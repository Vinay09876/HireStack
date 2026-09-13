// Each adapter fetches raw postings for a company and returns an array of
// normalized job objects: { externalId, title, location, department, postedDate, applicationUrl, isRemote }
// Location stays as a raw human-readable string here; India-filtering happens later in index.mjs.

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url, options = {}, retriesLeft = 2) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    // Transient errors (rate limiting, momentary server hiccups) get a
    // couple of backed-off retries before we give up on this request.
    if (retriesLeft > 0 && (res.status === 429 || res.status >= 500)) {
      await sleep(1500 * (3 - retriesLeft));
      return fetchJson(url, options, retriesLeft - 1);
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
    isRemote: /remote/i.test(job.location?.name || ''),
  }));
}

export async function fetchLever(company) {
  const url = `https://api.lever.co/v0/postings/${company.platformId}?mode=json`;
  const data = await fetchJson(url);
  return (data || []).map((job) => ({
    externalId: String(job.id),
    title: job.text,
    location: job.categories?.location || '',
    department: job.categories?.team || null,
    postedDate: job.createdAt ? new Date(job.createdAt).toISOString().slice(0, 10) : null,
    applicationUrl: job.applyUrl || job.hostedUrl,
    isRemote: /remote/i.test(job.categories?.location || ''),
  }));
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
  return jobs.map((job) => ({
    externalId: String(job.id_icims || job.id),
    title: job.title,
    location: job.normalized_location || job.location || '',
    department: job.business_category || null,
    postedDate: job.posted_date ? new Date(job.posted_date).toISOString().slice(0, 10) : null,
    applicationUrl: `https://www.amazon.jobs${job.job_path}`,
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

export const PLATFORM_ADAPTERS = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  smartrecruiters: fetchSmartRecruiters,
  workday: fetchWorkday,
  'oracle-hcm': fetchOracleHcm,
  'amazon-custom': fetchAmazonCustom,
  'urbancompany-custom': fetchUrbanCompanyCustom,
  eightfold: fetchEightfold,
};
