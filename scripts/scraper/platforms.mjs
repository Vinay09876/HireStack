// Each adapter fetches raw postings for a company and returns an array of
// normalized job objects: { externalId, title, location, department, postedDate, applicationUrl, isRemote }
// Location stays as a raw human-readable string here; India-filtering happens later in index.mjs.

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Strips HTML tags/entities down to plain text for storing as a job
// description - good enough for a job board card/detail view, not meant to
// preserve rich formatting.
//
// Some ATS APIs (Greenhouse) double-encode their HTML field - the string
// contains literal "&lt;div&gt;" rather than "<div>" - so entities must be
// decoded BEFORE tag-stripping runs, or the tags never match as real "<...>".
function decodeEntities(str) {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

function stripHtml(html) {
  if (!html) return '';
  const decoded = decodeEntities(html);
  return decodeEntities(
    decoded
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const REQUEST_TIMEOUT_MS = 20000;

async function fetchJson(url, options = {}, retriesLeft = 2, retryable403 = false) {
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    // A hung/unresponsive server must never stall the whole scraper run -
    // treat a timeout the same as a retryable transient failure.
    if (retriesLeft > 0 && err.name === 'TimeoutError') {
      await sleep(1500 * (3 - retriesLeft));
      return fetchJson(url, options, retriesLeft - 1, retryable403);
    }
    throw err;
  }
  if (!res.ok) {
    // Transient errors (rate limiting, momentary server hiccups) get a
    // couple of backed-off retries before we give up on this request.
    // 403 is only treated as transient for platforms known to use it as a
    // soft rate-limit (e.g. Darwinbox) - elsewhere a 403 usually means
    // genuinely gated access and retrying is pointless.
    const isTransient = res.status === 429 || res.status >= 500 || (retryable403 && res.status === 403);
    if (retriesLeft > 0 && isTransient) {
      const baseDelay = retryable403 && res.status === 403 ? 6000 : 1500;
      await sleep(baseDelay * (3 - retriesLeft));
      return fetchJson(url, options, retriesLeft - 1, retryable403);
    }
    throw new Error(`${url} -> HTTP ${res.status}`);
  }
  return res.json();
}
// Small pause between paginated requests to the same host so we don't trip
// rate limits (seen from Netflix/Eightfold and to be a considerate scraper).
const PAGE_DELAY_MS = 300;

export async function fetchGreenhouse(company) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${company.platformId}/jobs?content=true`;
  const data = await fetchJson(url);
  return (data.jobs || []).map((job) => ({
    externalId: String(job.id),
    title: job.title,
    location: job.location?.name || '',
    department: job.departments?.[0]?.name || null,
    postedDate: job.updated_at ? job.updated_at.slice(0, 10) : null,
    applicationUrl: job.absolute_url,
    description: stripHtml(job.content),
    isRemote: /remote/i.test(job.location?.name || ''),
  }));
}

export async function fetchLever(company) {
  const url = `https://api.lever.co/v0/postings/${company.platformId}?mode=json`;
  const data = await fetchJson(url);
  return (data || []).map((job) => {
    // Lever's "lists" holds named bullet sections - typically responsibilities
    // and requirements/qualifications, but the exact labels vary per company.
    const responsibilitiesList = job.lists?.find((l) =>
      /responsib|what (you|will you|we'?ll)|what does this role|role overview|day.to.day/i.test(l.text || '')
    );
    const requirementsList = job.lists?.find((l) =>
      /require|qualifi|you (should|have|are|bring)|what (you|we're looking|you'll need)|apply if/i.test(l.text || '')
    );
    const stripListItems = (html) =>
      (html || '')
        .split(/<li[^>]*>/i)
        .slice(1)
        .map((item) => stripHtml(item.split(/<\/li>/i)[0]))
        .filter(Boolean);

    return {
      externalId: String(job.id),
      title: job.text,
      location: job.categories?.location || '',
      department: job.categories?.team || null,
      postedDate: job.createdAt ? new Date(job.createdAt).toISOString().slice(0, 10) : null,
      applicationUrl: job.applyUrl || job.hostedUrl,
      description: job.descriptionPlain || stripHtml(job.description),
      responsibilities: responsibilitiesList ? stripListItems(responsibilitiesList.content) : [],
      requirements: requirementsList ? stripListItems(requirementsList.content) : [],
      isRemote: /remote/i.test(job.categories?.location || ''),
    };
  });
}

export async function fetchSmartRecruiters(company) {
  const jobs = [];
  let offset = 0;
  const limit = 100;
  const maxPages = 20; // safety cap: 2000 postings per company per run
  for (let page = 0; page < maxPages; page++) {
    const url = `https://api.smartrecruiters.com/v1/companies/${company.platformId}/postings?limit=${limit}&offset=${offset}`;
    const data = await fetchJson(url);
    const batch = data.content || [];
    jobs.push(...batch);
    offset += limit;
    if (batch.length < limit) break;
    await sleep(PAGE_DELAY_MS);
  }
  return jobs.map((job) => {
    const loc = job.location || {};
    const locationStr = [loc.city, loc.region, loc.country].filter(Boolean).join(', ');
    return {
      externalId: String(job.id),
      title: job.name,
      location: locationStr,
      department: job.department?.label || null,
      postedDate: job.releasedDate ? job.releasedDate.slice(0, 10) : null,
      applicationUrl: `https://jobs.smartrecruiters.com/${company.platformId}/${job.id}`,
      isRemote: loc.remote === true,
    };
  });
}

export async function fetchWorkday(company) {
  const jobs = [];
  let offset = 0;
  const limit = 20;
  const maxPages = 25; // safety cap: 500 jobs per company per run
  for (let page = 0; page < maxPages; page++) {
    const url = `https://${company.workdayHost}/wday/cxs/${company.platformId}/${company.workdaySite}/jobs`;
    const data = await fetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appliedFacets: {}, limit, offset, searchText: '' }),
    });
    const batch = data.jobPostings || [];
    jobs.push(...batch);
    offset += limit;
    if (batch.length < limit) break;
    await sleep(PAGE_DELAY_MS);
  }
  return jobs.map((job) => ({
    externalId: job.bulletFields?.[0] || job.externalPath,
    title: job.title,
    location: job.locationsText || '',
    department: null,
    postedDate: null, // Workday only gives relative text like "Posted 2 Days Ago"; left null, not worth mis-parsing
    applicationUrl: `https://${company.workdayHost}/${company.workdaySite}${job.externalPath}`,
    isRemote: /remote/i.test(job.locationsText || ''),
  }));
}

export async function fetchOracleHcm(company) {
  const jobs = [];
  let offset = 0;
  const limit = 25;
  const maxPages = 25;
  for (let page = 0; page < maxPages; page++) {
    const finder = `findReqs;siteNumber=${company.siteNumber},facetsList=LOCATIONS;limit=${limit};offset=${offset}`;
    const url =
      `https://${company.platformId}/hcmRestApi/resources/latest/recruitingCEJobRequisitions` +
      `?onlyData=true&expand=requisitionList.secondaryLocations&finder=${encodeURIComponent(finder)}`;
    const data = await fetchJson(url);
    const requisitions = data.items?.[0]?.requisitionList || [];
    jobs.push(...requisitions);
    offset += limit;
    if (requisitions.length < limit) break;
    await sleep(PAGE_DELAY_MS);
  }
  return jobs.map((job) => ({
    externalId: job.Id,
    title: job.Title,
    location: job.PrimaryLocation || '',
    department: null,
    postedDate: job.PostedDate ? job.PostedDate.slice(0, 10) : null,
    applicationUrl: `https://${company.platformId}/hcmUI/CandidateExperience/en/sites/${company.siteNumber}/job/${job.Id}`,
    isRemote: (job.WorkplaceTypeCode || '').toLowerCase() === 'remote',
    countryHint: job.PrimaryLocationCountry || null,
  }));
}

export async function fetchAmazonCustom() {
  const jobs = [];
  let offset = 0;
  const limit = 100;
  const maxPages = 10; // Amazon India subset only, cap at 1000
  for (let page = 0; page < maxPages; page++) {
    const url = `https://www.amazon.jobs/en/search.json?offset=${offset}&result_limit=${limit}&sort=recent&country=IND`;
    const data = await fetchJson(url);
    const batch = data.jobs || [];
    jobs.push(...batch);
    offset += limit;
    if (batch.length < limit) break;
    await sleep(PAGE_DELAY_MS);
  }
  // Amazon formats qualification blocks as "- item one<br/>- item two<br/>...".
  const splitDashList = (html) =>
    stripHtml(html)
      .split('\n')
      .map((line) => line.replace(/^[-•\s]+/, '').trim())
      .filter(Boolean);

  return jobs.map((job) => ({
    externalId: String(job.id_icims || job.id),
    title: job.title,
    location: job.normalized_location || job.location || '',
    department: job.business_category || null,
    postedDate: job.posted_date ? new Date(job.posted_date).toISOString().slice(0, 10) : null,
    applicationUrl: `https://www.amazon.jobs${job.job_path}`,
    description: stripHtml(job.description || job.description_short),
    requirements: job.basic_qualifications ? splitDashList(job.basic_qualifications) : [],
    qualifications: job.preferred_qualifications ? splitDashList(job.preferred_qualifications) : [],
    isRemote: /remote/i.test(job.normalized_location || ''),
    countryHint: job.country_code || null,
  }));
}

export async function fetchEightfold(company) {
  const jobs = [];
  let start = 0;
  const maxPages = 50; // 500 jobs cap per company per run (pages of 10)
  for (let page = 0; page < maxPages; page++) {
    const url = `https://${company.eightfoldHost}/api/apply/v2/jobs?domain=${company.eightfoldDomain}&start=${start}`;
    const data = await fetchJson(url);
    const batch = data.positions || [];
    jobs.push(...batch);
    start += 10;
    if (batch.length < 10 || jobs.length >= (data.count || 0)) break;
    // Eightfold rate-limits rapid pagination; back off more generously here.
    await sleep(800);
  }
  return jobs.map((job) => ({
    externalId: String(job.id),
    title: job.name,
    location: (job.location || job.locations?.[0] || '').replace(/,/g, ', ').replace(/\s+/g, ' ').trim(),
    department: job.department || null,
    postedDate: job.t_create ? new Date(job.t_create * 1000).toISOString().slice(0, 10) : null,
    applicationUrl: job.canonicalPositionUrl,
    isRemote: (job.work_location_option || '').toLowerCase() === 'remote',
  }));
}

export async function fetchUrbanCompanyCustom() {
  const data = await fetchJson('https://www.urbanclap.com/api/v2/platform-gateway/getAllJobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const jobs = data.jobs || data.data || [];
  return jobs.map((job) => ({
    externalId: String(job.id || job.job_id),
    title: job.job_title || job.title,
    location: (job.location_city || job.location || []).join(', '),
    department: job.parent_department || null,
    postedDate: null,
    applicationUrl: 'https://careers.urbancompany.com',
    isRemote: false,
  }));
}

export async function fetchTurboHire(company) {
  const tokenRes = await fetchJson('https://api.turbohire.co/api/token/noauth', {
    headers: { Referer: company.turboHireReferer },
  });
  const token = tokenRes.access_token;

  const data = await fetchJson(
    `https://thapi.azurewebsites.net/api/careerpagev2/filteredjobs?orgId=${company.turboHireOrgId}&pageType=0`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Referer: company.turboHireReferer,
      },
      body: JSON.stringify({
        SortByV2: { Key: 'PostedDate', Order: 2 },
        BunitIds: { Value: null, FilterType: 0 },
        Experience: { Value: null, FilterType: 0 },
        JobTypes: { Value: null, FilterType: 0 },
        JobTypeV2: { Value: null, FilterType: 0 },
        Locations: { Value: null, FilterType: 0 },
        CreatedDate: { Value: null, FilterType: 0 },
        Compensation: { Value: null, FilterType: 0 },
        Skills: { Value: null, FilterType: 0 },
        Keyword: '',
        ClientIds: { Value: null, FilterType: 0 },
        Department: '',
        CustomFields: {},
      }),
    }
  );

  return (data.Result || []).map((job) => {
    let location = '';
    try {
      const locs = JSON.parse(job.Location || '[]');
      location = locs[0]?.Address || '';
    } catch {
      // leave location empty if the field is malformed
    }
    return {
      externalId: job.JobId,
      title: job.JobTitle,
      location,
      department: job.Department || null,
      postedDate: job.PublishedDate ? job.PublishedDate.slice(0, 10) : null,
      applicationUrl: `${company.turboHireReferer}job/${job.JobIdObfuscated}`,
      isRemote: /remote/i.test(location),
    };
  });
}

export async function fetchZohoRecruit(company) {
  const url =
    `https://${company.zohoHost}/recruit/v2/public/Job_Openings` +
    `?pagename=Careers&source=CareerSite&extra_fields=%5B%22Remote_Job%22%2C%22Job_Description%22%5D`;
  const data = await fetchJson(url);
  return (data.data || []).map((job) => ({
    externalId: job.id,
    title: job.Posting_Title || job.Job_Opening_Name,
    location: job.City || job.Country1 || '',
    department: null,
    postedDate: job.Date_Opened ? job.Date_Opened.slice(0, 10) : null,
    applicationUrl: job.$url || `https://${company.zohoHost}/jobs/Careers`,
    isRemote: job.Remote_Job === true || job.Remote_Job === 'true',
    countryHint: job.Country1 || null,
  }));
}

export async function fetchPhenomJobStream(company) {
  const jobs = [];
  let pageNumber = 0;
  const maxPages = 60; // safety cap
  for (let page = 0; page < maxPages; page++) {
    const data = await fetchJson(`https://${company.phenomHost}/services/recruiting/v1/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locale: 'en_US',
        pageNumber,
        sortBy: '',
        keywords: '',
        location: company.phenomLocationParam ?? 'india',
        facetFilters: company.phenomFacetFilters ?? {},
        brand: '',
        skills: [],
        categoryId: 0,
        alertId: '',
        rcmCandidateId: '',
      }),
    });
    const batch = (data.jobSearchResult || []).map((r) => r.response);
    jobs.push(...batch);
    pageNumber += 1;
    if (batch.length < 10) break;
    await sleep(PAGE_DELAY_MS);
  }
  return jobs.map((job) => {
    const cities = job.jobLocationShort || job.custprimecity || [];
    const rawLocation = Array.isArray(cities) ? cities[0] : cities;
    const location = (rawLocation || '').replace(/<br\/?>/g, '').trim() || 'India';
    return {
      externalId: job.id,
      title: job.unifiedStandardTitle || job.unifiedUrlTitle,
      location,
      department: null,
      postedDate: null,
      applicationUrl: `https://${company.phenomHost}/job/${job.urlTitle}/${job.id}`,
      isRemote: /remote/i.test(location),
    };
  });
}

export async function fetchInfosysCustom() {
  const data = await fetchJson(
    'https://intapgateway.infosysapps.com/careersci/search/intapjbsrch/getHotJobsDetails?location=All%20locations&sourceId=1,21'
  );
  return (data.hotJobsLists || []).map((job) => ({
    externalId: String(job.postingId),
    title: job.postingTitle,
    location: job.location || 'India',
    department: job.unit || null,
    postedDate: job.createdOn ? job.createdOn.slice(0, 10) : null,
    applicationUrl: `https://career.infosys.com/joblist/${job.requisitionId}`,
    isRemote: /remote/i.test(job.location || ''),
  }));
}

export async function fetchCapgeminiCustom() {
  const jobs = [];
  let page = 1;
  const size = 50;
  const maxPages = 10;
  for (let i = 0; i < maxPages; i++) {
    const data = await fetchJson(
      `https://cg-jobstream-api.azurewebsites.net/api/job-search?page=${page}&size=${size}&country_code=in-en`
    );
    const batch = data.data || [];
    jobs.push(...batch);
    page += 1;
    if (batch.length < size) break;
    await sleep(PAGE_DELAY_MS);
  }
  return jobs.map((job) => ({
    externalId: job.id,
    title: job.title || job.job_title,
    location: job.city || job.location || 'India',
    department: job.brand || null,
    postedDate: job.posted_date ? job.posted_date.slice(0, 10) : null,
    applicationUrl: job.apply_url || job.url || 'https://www.capgemini.com/in-en/careers/',
    isRemote: /remote/i.test(job.city || job.location || ''),
  }));
}

export async function fetchDarwinbox(company) {
  const jobs = [];
  let pageNum = 1;
  const limit = 20;
  const maxPages = 20;
  for (let i = 0; i < maxPages; i++) {
    const data = await fetchJson(
      `https://${company.darwinboxHost}/ms/candidateapi/job/alljobs?companyId=${company.darwinboxCompanyId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Referer: `https://${company.darwinboxHost}/`,
        },
        body: JSON.stringify({
          companyId: company.darwinboxCompanyId,
          page: pageNum,
          sort_option: 'new',
          limit,
        }),
      },
      2,
      true
    );
    const batch = data.data || [];
    jobs.push(...batch);
    pageNum += 1;
    if (batch.length < limit) break;
    await sleep(PAGE_DELAY_MS);
  }
  return jobs.map((job) => ({
    externalId: job.id || job._id,
    title: job.title || job.designation_name || 'Untitled role',
    location: (job.officelocations_without_area?.[0] || job.country || 'India').replace(/\r/g, '').trim(),
    department: job.department_name_only || null,
    postedDate: job.posted_on ? new Date(job.posted_on * 1000).toISOString().slice(0, 10) : null,
    applicationUrl: company.websiteUrl,
    isRemote: job.is_remote === 1,
  }));
}

export async function fetchAmdCustom() {
  const jobs = [];
  let pageNum = 1;
  const maxPages = 20;
  for (let i = 0; i < maxPages; i++) {
    const data = await fetchJson(
      `https://careers.amd.com/api/jobs?location=India&page=${pageNum}&sortBy=relevance&descending=false&internal=false`
    );
    const batch = data.jobs || [];
    jobs.push(...batch);
    pageNum += 1;
    if (batch.length === 0) break;
    await sleep(PAGE_DELAY_MS);
  }
  return jobs.map((job) => {
    const j = job.data || job;
    return {
      externalId: j.req_id || j.slug,
      title: j.title,
      location: j.location || 'India',
      department: null,
      postedDate: null,
      applicationUrl: `https://careers.amd.com/careers-home/jobs/${j.slug}`,
      isRemote: /remote/i.test(j.location || ''),
    };
  });
}

export const PLATFORM_ADAPTERS = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  smartrecruiters: fetchSmartRecruiters,
  workday: fetchWorkday,
  'oracle-hcm': fetchOracleHcm,
  'amazon-custom': fetchAmazonCustom,
  'urbancompany-custom': fetchUrbanCompanyCustom,
  eightfold: fetchEightfold,
  turbohire: fetchTurboHire,
  'zoho-recruit': fetchZohoRecruit,
  'phenom-jobstream': fetchPhenomJobStream,
  'infosys-custom': fetchInfosysCustom,
  'capgemini-custom': fetchCapgeminiCustom,
  darwinbox: fetchDarwinbox,
  'amd-custom': fetchAmdCustom,
};
