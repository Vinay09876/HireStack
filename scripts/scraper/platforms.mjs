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
    // Named entities beyond the basic set (e.g. Capgemini's "you&rsquo;d")
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&bull;/g, '•')
    // Numeric entities (e.g. Mastercard's "200&#43;countries" -> "200+countries")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
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

// SmartRecruiters' list endpoint has no description; the per-job detail
// endpoint returns it as jobAd.sections.jobDescription (the real role
// content) and jobAd.sections.qualifications (candidate requirements) -
// both HTML, sometimes using real <ul><li> lists and sometimes plain <p>
// paragraphs prefixed with a literal "■" bullet character (both handled by
// extractTopLevelListItems).
async function fetchSmartRecruitersJobDetail(companyId, jobId) {
  const data = await fetchJson(`https://api.smartrecruiters.com/v1/companies/${companyId}/postings/${jobId}`);
  const sections = data.jobAd?.sections || {};
  return {
    description: sections.jobDescription?.text || '',
    requirements: sections.qualifications?.text ? extractTopLevelListItems(sections.qualifications.text) : [],
  };
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
  const results = jobs.map((job) => {
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

  const DETAIL_CONCURRENCY = 5;
  for (let i = 0; i < results.length; i += DETAIL_CONCURRENCY) {
    const batch = results.slice(i, i + DETAIL_CONCURRENCY);
    await Promise.all(
      batch.map(async (job) => {
        try {
          const detail = await fetchSmartRecruitersJobDetail(company.platformId, job.externalId);
          job.description = stripHtml(detail.description) || undefined;
          job.requirements = detail.requirements;
        } catch (err) {
          console.warn(`  SmartRecruiters detail fetch failed for ${company.name} ${job.externalId}: ${err.message}`);
        }
      })
    );
    if (i + DETAIL_CONCURRENCY < results.length) await sleep(PAGE_DELAY_MS);
  }

  return results;
}

const WORKDAY_INDIA_HINTS = [
  'india', 'bengaluru', 'bangalore', 'hyderabad', 'mumbai', 'pune', 'chennai',
  'gurugram', 'gurgaon', 'noida', 'delhi', 'kolkata', 'ahmedabad',
];

// Workday's list endpoint returns no description at all - only the detail
// endpoint (one request per job) has the real jobDescription HTML. Fetching
// that for every job across every country would be very expensive, so we
// filter to India-looking postings first and only fetch details for those.
async function fetchWorkdayJobDetail(company, externalPath) {
  // externalPath already starts with "/job/..." from the list response.
  const url = `https://${company.workdayHost}/wday/cxs/${company.platformId}/${company.workdaySite}${externalPath}`;
  const data = await fetchJson(url);
  const info = data.jobPostingInfo || {};
  return stripHtml(info.jobDescription || '');
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

  const india = [];
  const nonIndia = [];
  for (const job of jobs) {
    const locationsText = job.locationsText || '';
    const isIndiaLooking = WORKDAY_INDIA_HINTS.some((hint) => locationsText.toLowerCase().includes(hint));
    (isIndiaLooking ? india : nonIndia).push(job);
  }

  // Detail fetches only run for India-looking postings (list-only for the
  // rest keeps request volume down), in small concurrent batches so a
  // company with hundreds of India jobs doesn't take minutes sequentially.
  const DETAIL_CONCURRENCY = 5;
  const descriptionByPath = new Map();
  for (let i = 0; i < india.length; i += DETAIL_CONCURRENCY) {
    const batch = india.slice(i, i + DETAIL_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (job) => {
        if (!job.externalPath) return null;
        try {
          return [job.externalPath, await fetchWorkdayJobDetail(company, job.externalPath)];
        } catch (err) {
          console.warn(`  Workday detail fetch failed for ${company.name} ${job.externalPath}: ${err.message}`);
          return null;
        }
      })
    );
    for (const entry of batchResults) {
      if (entry) descriptionByPath.set(entry[0], entry[1]);
    }
    if (i + DETAIL_CONCURRENCY < india.length) await sleep(PAGE_DELAY_MS);
  }

  return jobs.map((job) => {
    const locationsText = job.locationsText || '';
    return {
      externalId: job.bulletFields?.[0] || job.externalPath,
      title: job.title,
      location: locationsText,
      department: null,
      postedDate: null, // Workday only gives relative text like "Posted 2 Days Ago"; left null, not worth mis-parsing
      applicationUrl: `https://${company.workdayHost}/${company.workdaySite}${job.externalPath}`,
      description: descriptionByPath.get(job.externalPath) || undefined,
      isRemote: /remote/i.test(locationsText),
    };
  });
}

// Oracle HCM's list endpoint never carries a real description (its
// ExternalResponsibilitiesStr/ExternalQualificationsStr fields come back
// empty even when the detail endpoint has real content) - only the
// per-job detail endpoint has it, as ExternalDescriptionStr HTML. That
// HTML uses the same "<p><strong>Section Title</strong></p> followed by a
// <ul>" pattern already handled for Wipro/Capgemini, so the same
// splitIntoSections/classification helpers apply directly.
async function fetchOracleHcmJobDetail(company, jobId) {
  const finder = `ById;Id="${jobId}",siteNumber=${company.siteNumber}`;
  const url =
    `https://${company.platformId}/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails` +
    `?onlyData=true&finder=${encodeURIComponent(finder)}`;
  const data = await fetchJson(url);
  const detail = data.items?.[0];
  const raw = detail?.ExternalDescriptionStr;
  if (!raw) throw new Error(`no ExternalDescriptionStr for job ${jobId}`);
  const sections = splitIntoSections(raw);
  const classified = classifyPhenomSections(sections);
  if (!classified.description && classified.responsibilities.length === 0) {
    classified.description = stripHtml(raw);
  }
  return classified;
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

  const results = jobs.map((job) => ({
    externalId: job.Id,
    title: job.Title,
    location: job.PrimaryLocation || '',
    department: null,
    postedDate: job.PostedDate ? job.PostedDate.slice(0, 10) : null,
    applicationUrl: `https://${company.platformId}/hcmUI/CandidateExperience/en/sites/${company.siteNumber}/job/${job.Id}`,
    isRemote: (job.WorkplaceTypeCode || '').toLowerCase() === 'remote',
    countryHint: job.PrimaryLocationCountry || null,
  }));

  // Detail-fetch only India-looking postings to keep request volume down,
  // same approach as Workday. countryHint (PrimaryLocationCountry) is
  // reliable when present; location text is the fallback.
  const indiaResults = results.filter((j) => {
    if (j.countryHint) {
      const c = j.countryHint.toUpperCase();
      if (c === 'IN' || c === 'IND' || c === 'INDIA') return true;
      if (c.length <= 4) return false;
    }
    return WORKDAY_INDIA_HINTS.some((hint) => (j.location || '').toLowerCase().includes(hint));
  });
  const DETAIL_CONCURRENCY = 5;
  for (let i = 0; i < indiaResults.length; i += DETAIL_CONCURRENCY) {
    const batch = indiaResults.slice(i, i + DETAIL_CONCURRENCY);
    await Promise.all(
      batch.map(async (job) => {
        try {
          const detail = await fetchOracleHcmJobDetail(company, job.externalId);
          job.description = detail.description;
          job.responsibilities = detail.responsibilities;
          job.requirements = detail.requirements;
          job.qualifications = detail.qualifications;
        } catch (err) {
          console.warn(`  Oracle HCM detail fetch failed for ${company.name} ${job.externalId}: ${err.message}`);
        }
      })
    );
    if (i + DETAIL_CONCURRENCY < indiaResults.length) await sleep(PAGE_DELAY_MS);
  }

  return results;
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

// Eightfold's list endpoint always returns an empty job_description (at
// least on Netflix's instance) - only the per-job detail endpoint has real
// content, with clean <h2> section headings ("Key Responsibilities",
// "Requirements - Must Have", "Requirements - Preferred") that
// splitIntoSections/classification already handle.
async function fetchEightfoldJobDetail(company, jobId) {
  const url = `https://${company.eightfoldHost}/api/apply/v2/jobs/${jobId}?domain=${company.eightfoldDomain}`;
  const data = await fetchJson(url);
  const raw = data.job_description;
  if (!raw) throw new Error(`no job_description for job ${jobId}`);
  const sections = splitIntoSections(raw);
  const classified = classifyPhenomSections(sections);
  if (!classified.description && classified.responsibilities.length === 0) {
    classified.description = stripHtml(raw);
  }
  return classified;
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

  const results = jobs.map((job) => ({
    externalId: String(job.id),
    title: job.name,
    location: (job.location || job.locations?.[0] || '').replace(/,/g, ', ').replace(/\s+/g, ' ').trim(),
    department: job.department || null,
    postedDate: job.t_create ? new Date(job.t_create * 1000).toISOString().slice(0, 10) : null,
    applicationUrl: job.canonicalPositionUrl,
    isRemote: (job.work_location_option || '').toLowerCase() === 'remote',
  }));

  // Detail-fetch only India-looking postings to keep request volume down.
  const indiaResults = results.filter((j) => WORKDAY_INDIA_HINTS.some((hint) => (j.location || '').toLowerCase().includes(hint)));
  const DETAIL_CONCURRENCY = 5;
  for (let i = 0; i < indiaResults.length; i += DETAIL_CONCURRENCY) {
    const batch = indiaResults.slice(i, i + DETAIL_CONCURRENCY);
    await Promise.all(
      batch.map(async (job) => {
        try {
          const detail = await fetchEightfoldJobDetail(company, job.externalId);
          job.description = detail.description;
          job.responsibilities = detail.responsibilities;
          job.requirements = detail.requirements;
          job.qualifications = detail.qualifications;
        } catch (err) {
          console.warn(`  Eightfold detail fetch failed for ${company.name} ${job.externalId}: ${err.message}`);
        }
      })
    );
    if (i + DETAIL_CONCURRENCY < indiaResults.length) await sleep(800);
  }

  return results;
}

// UrbanCompany's list API already returns the full job_description as HTML,
// consistently split into bold-labeled sections ("What You'll Do:", "What
// We Need:", "What can you expect:") followed by real <ul><li> lists - the
// same shape already handled for Wipro/Capgemini, so splitIntoSections
// applies directly. "What can you expect" is perks/culture copy, not job
// content, so it's intentionally skipped rather than kept as prose.
function classifyUrbanCompanyDescription(html) {
  if (!html) return { description: '', responsibilities: [], requirements: [] };
  const sections = splitIntoSections(html);
  const responsibilities = [];
  const requirements = [];
  const introParts = [];

  for (const { heading, content } of sections) {
    if (heading === null) {
      const text = stripHtml(content);
      if (text) introParts.push(text);
      continue;
    }
    const h = heading.toLowerCase();
    if (/what you.?ll do|responsibilit/.test(h)) {
      responsibilities.push(...extractTopLevelListItems(content));
    } else if (/what we need|requirement|qualification/.test(h)) {
      requirements.push(...extractTopLevelListItems(content));
    }
    // "What can you expect" (perks/culture) and anything else is skipped -
    // it's marketing copy, not job content.
  }

  let description = introParts.join('\n\n');
  if (!description) {
    description =
      responsibilities.length > 0 || requirements.length > 0
        ? 'See the sections below for full role details.'
        : stripHtml(html);
  }
  return { description, responsibilities, requirements };
}

export async function fetchUrbanCompanyCustom() {
  const data = await fetchJson('https://www.urbanclap.com/api/v2/platform-gateway/getAllJobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const jobs = data.jobs || data.data || [];
  return jobs.map((job) => {
    const { description, responsibilities, requirements } = classifyUrbanCompanyDescription(job.job_description);
    return {
      externalId: String(job.id || job.job_id),
      title: job.job_title || job.title,
      location: (job.location_city || job.location || []).join(', '),
      department: job.parent_department || null,
      postedDate: null,
      applicationUrl: job.apply_url || 'https://careers.urbancompany.com',
      description: description || undefined,
      responsibilities,
      requirements,
      isRemote: false,
    };
  });
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
    // JobDescV2 is already the full description (HTML, no section headings
    // in practice - just one prose blob) right in the list response.
    return {
      externalId: job.JobId,
      title: job.JobTitle,
      location,
      department: job.Department || null,
      postedDate: job.PublishedDate ? job.PublishedDate.slice(0, 10) : null,
      applicationUrl: `${company.turboHireReferer}job/${job.JobIdObfuscated}`,
      description: stripHtml(job.JobDescV2) || undefined,
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

// Finds the index of the closing tag matching the opening tag whose content
// starts at `contentStart` (right after that tag's ">"), tracking nested
// same-named tags so an inner <span>...</span> (very common here - list
// items and even single words get wrapped in their own <span>) doesn't get
// mistaken for the outer span's close. A plain non-greedy regex badly
// truncates content on any page that nests spans this way.
function findMatchingClose(html, contentStart, tagName) {
  const openRe = new RegExp(`<${tagName}(?=[\\s>])`, 'gi');
  const closeStr = `</${tagName}>`;
  let depth = 1;
  let searchFrom = contentStart;
  while (depth > 0) {
    openRe.lastIndex = searchFrom;
    const openMatch = openRe.exec(html);
    const closeIdx = html.indexOf(closeStr, searchFrom);
    if (closeIdx === -1) return html.length;
    if (openMatch && openMatch.index < closeIdx) {
      depth++;
      searchFrom = openMatch.index + openMatch[0].length;
    } else {
      depth--;
      if (depth === 0) return closeIdx;
      searchFrom = closeIdx + closeStr.length;
    }
  }
  return html.length;
}

// The Phenom/Job2Web job detail page is plain server-rendered HTML - the
// list/search API has no description field at all, so this is the only way
// to get real content. The page layout is NOT consistent even within the
// same company: some jobs put the real body in a plain
// <span class="rtltextaligneligible"> (no itemprop) right after a
// "Job Description:" label, while their itemprop="description" spans hold
// generic company boilerplate; OTHER jobs on the very same company leave
// that labeled span empty/placeholder and put the entire real body in an
// itemprop="description" span instead - sometimes across multiple such
// spans, only one of which is real.
//
// There's no reliable structural signal for which case applies, so instead
// of guessing based on "does the label exist", every candidate span is
// extracted (depth-aware) and the longest one (by plain-text length) wins -
// boilerplate and empty/placeholder spans are always much shorter than an
// actual job description.
function extractPhenomDescription(html) {
  const candidates = [];

  const labelIdx = html.indexOf('>Job Description:');
  if (labelIdx !== -1) {
    const afterLabel = html.slice(labelIdx);
    const spanMatch = afterLabel.match(/<span[^>]*class="rtltextaligneligible"[^>]*>/);
    if (spanMatch) {
      const contentStart = labelIdx + spanMatch.index + spanMatch[0].length;
      candidates.push(html.slice(contentStart, findMatchingClose(html, contentStart, 'span')));
    }
  }

  const itempropRe = /itemprop="description"[^>]*>/g;
  let m;
  while ((m = itempropRe.exec(html)) !== null) {
    const contentStart = m.index + m[0].length;
    candidates.push(html.slice(contentStart, findMatchingClose(html, contentStart, 'span')));
  }

  if (candidates.length === 0) return null;
  return candidates.reduce((best, current) =>
    stripHtml(current).length > stripHtml(best).length ? current : best
  );
}

// Checks whether `html.slice(fromIndex)` is immediately followed (allowing
// only whitespace, the paragraph's own closing tags, and empty/&nbsp;-only
// <span> wrappers - never any other real text) by a <ul>/<ol>. This is a
// plain string scan rather than a regex lookahead so it can't accidentally
// match across an unrelated later list further down the document.
function isFollowedByList(html, fromIndex) {
  let i = fromIndex;
  // Any run of whitespace, &nbsp;, a closing </strong|span|p|b>, or an
  // OPENING <span ...> tag is "invisible" filler between the heading and
  // the list - opening spans are included (not just closing ones) because
  // Oracle HCM nests a trailing "&nbsp;" inside two levels of <span>, and
  // this only needs to confirm no other real text sits between them.
  const skippable = /^(?:\s|&nbsp;|<\/(strong|span|p|b)>|<span[^>]*>)+/i;
  while (i < html.length) {
    const rest = html.slice(i);
    const skipMatch = rest.match(skippable);
    if (skipMatch && skipMatch[0].length > 0) {
      i += skipMatch[0].length;
      continue;
    }
    return /^<[uo]l[\s>]/i.test(rest);
  }
  return false;
}

// Splits the raw description HTML into (heading, content) sections. Section
// titles show up in several different markups seen across Wipro/HCLTech/
// Oracle HCM templates:
//  - real <h1-6> tags (covers Wipro's <h4> and HCLTech's <H2 style=...>)
//  - a <strong> span whose text is short title-like prose (no sentence-
//    ending period, under ~80 chars), immediately followed by a <ul>/<ol>
//    once only whitespace/closing-tags/empty-span wrappers are skipped -
//    that adjacency (not "any bold text") is what's matched, to avoid
//    treating an inline bolded phrase inside real prose as a heading. This
//    single check covers both a bare <p><strong>Title</strong></p> and
//    Oracle HCM's <p><span><span><strong>Title</strong></span></span>
//    <span>&nbsp;</span></p> variants without needing a separate pattern
//    for each nesting shape.
//  - a numbered <p> whose main content is bold, e.g.
//    <p>1.<strong> Practice Growth and Revenue Leadership</strong></p> or
//    <p><strong>2. Commercial Modeling</strong></p> - here the section's
//    "list" is just several more plain <p> sentences, not a real <ul>, so
//    no list-adjacency check applies; the leading number is itself
//    distinctive enough not to false-positive on inline bold prose.
// Content before the first recognized heading has no heading and is kept
// as an intro paragraph.
function splitIntoSections(html) {
  const headingRe =
    /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>|<strong>([\s\S]*?)<\/strong>|<p[^>]*>\s*(\d+\.\s*<strong>[\s\S]*?<\/strong>)\s*<\/p>|<p[^>]*>(<strong>\s*\d+\.[^<]*<\/strong>)\s*<\/p>/gi;
  const sections = [];
  let lastIndex = 0;
  let lastHeading = null;
  let match;
  while ((match = headingRe.exec(html)) !== null) {
    let title;
    if (match[2] !== undefined) {
      // Bare <strong>...</strong> candidate - only a real heading if its
      // own text is short/title-like AND a list immediately follows.
      const strongText = stripHtml(match[2]);
      const looksLikeTitle = strongText && strongText.length <= 80 && !/[.!?]\s*$/.test(strongText.trim());
      if (!looksLikeTitle || !isFollowedByList(html, match.index + match[0].length)) continue;
      title = strongText;
    } else {
      title = stripHtml(match[1] ?? match[3] ?? match[4]);
    }
    // Wipro pads some sections with a heading containing only the invisible
    // Unicode combining-grapheme-joiner character "͏" - stripHtml doesn't
    // reduce it to '', so it needs an explicit check to be skipped here.
    if (!title || title === '͏') continue;
    if (lastHeading !== null) {
      sections.push({ heading: lastHeading, content: html.slice(lastIndex, match.index) });
    } else {
      const intro = html.slice(lastIndex, match.index);
      if (stripHtml(intro)) sections.push({ heading: null, content: intro });
    }
    lastHeading = title;
    lastIndex = match.index + match[0].length;
  }
  if (lastHeading !== null) {
    sections.push({ heading: lastHeading, content: html.slice(lastIndex) });
  }
  return sections;
}

// Extracts only the TOP-LEVEL <li> items from a chunk of list HTML,
// depth-tracked so a nested <ul> inside one <li> (e.g. Wipro's
// "Hands-on experience with: <ul>...</ul>") stays part of that single
// item instead of being split into separate top-level entries.
function extractTopLevelListItems(html) {
  const items = [];
  let depth = 0;
  let i = 0;
  let current = '';
  let capturing = false;
  while (i < html.length) {
    if (/^<li[\s>]/i.test(html.slice(i, i + 4))) {
      const tagEnd = html.indexOf('>', i) + 1;
      if (depth === 0) {
        capturing = true;
        current = '';
      } else if (capturing) {
        current += html.slice(i, tagEnd);
      }
      depth++;
      i = tagEnd;
      continue;
    }
    if (html.slice(i, i + 5).toLowerCase() === '</li>') {
      depth--;
      if (depth === 0) {
        items.push(current);
        capturing = false;
      } else if (capturing) {
        current += '</li>';
      }
      i += 5;
      continue;
    }
    if (capturing) current += html[i];
    i++;
  }
  // Wipro pads some sections with invisible-character "͏" placeholder
  // paragraphs (visible as an empty-looking bullet/line) - drop them here
  // so they never surface as a responsibility/requirement item.
  const isRealText = (s) => s && s !== '͏' && s !== 'null';
  // Some templates (e.g. Swiggy/SmartRecruiters) use a literal "■" bullet
  // character at the start of a plain <p>, instead of real <li> markup.
  const cleanLine = (s) => s.replace(/^[■•·▪]\s*/, '');

  if (items.length > 0) return items.map((item) => cleanLine(stripHtml(item))).filter(isRealText);

  // No <li> markup at all - some templates use plain "<br>1. ..." numbered
  // lines, or (Wipro) several consecutive <p> sentences, instead of a real
  // list; stripHtml already turns both </p> and <br> into newlines.
  return stripHtml(html)
    .split(/\n+/)
    .map((line) => cleanLine(line.trim().replace(/^\d+\.\s*/, '')))
    .filter(isRealText);
}

// Classifies each section by its heading text into the same
// responsibilities/requirements/qualifications shape the rest of the
// scraper already uses (see Lever's adapter), falling back to plain
// prose in the description for anything unrecognized (overview, summary).
//
// One Wipro template nests headings: a top-level "Do" <h2> is immediately
// followed by several sibling <h3> headings, each one naming a single
// responsibility area (with further nested detail bullets under it that
// are too granular to surface as separate list items). splitIntoSections
// flattens all of these into one heading per <h1-6>, so once "Do" is seen,
// every subsequent heading up to the next *recognized* section keyword is
// actually one responsibility bullet, not its own section - each such
// heading's title becomes the bullet text.
function classifyPhenomSections(sections) {
  const responsibilities = [];
  const requirements = [];
  const qualifications = [];
  const introParts = [];
  let inDoBlock = false;

  for (const { heading, content } of sections) {
    if (heading === null) {
      const text = stripHtml(content);
      if (text) introParts.push(text);
      continue;
    }
    // A leading "1. "/"2. " numbering (e.g. Wipro's "2. Commercial Modeling
    // & Deal Structuring") marks a numbered focus-area breakdown - that
    // structural pattern, not the specific title text, is what signals
    // "these are responsibility areas" since the titles vary per job.
    const isNumberedSection = /^\d+\.\s/.test(heading);
    const h = heading.toLowerCase().replace(/^\d+\.\s*/, '');

    if (/^do$/.test(h)) {
      inDoBlock = true;
      continue;
    }
    if (inDoBlock) {
      // Stop treating headings as "Do" bullets once a differently-labeled
      // real section starts (e.g. some jobs follow "Do" with "Deliver").
      if (/^deliver$/.test(h) || /required skill|mandatory|^requirement|preferred|qualification/.test(h)) {
        inDoBlock = false;
      } else {
        if (heading !== '͏') responsibilities.push(heading);
        continue;
      }
    }

    if (isNumberedSection || /responsibilit/.test(h)) {
      responsibilities.push(...extractTopLevelListItems(content));
    } else if (/preferred|good to have|nice to have|desirable|^qualification/.test(h)) {
      // Checked before the generic "requirement" match below so a heading
      // like "Requirements - Preferred" (which contains both words) lands
      // in qualifications, not requirements.
      qualifications.push(...extractTopLevelListItems(content));
    } else if (
      /required skill|mandatory|^requirement|ideal candidate|candidate profile/.test(h)
    ) {
      requirements.push(...extractTopLevelListItems(content));
    } else if (/^job description$/.test(h)) {
      // Wipro wraps everything in an outer "Job Description" <H2> that's
      // purely structural (immediately followed by the title repeated as
      // plain text) - it isn't real section content, skip the label itself
      // but keep the paragraph that follows.
      const text = stripHtml(content);
      if (text) introParts.push(text);
    } else {
      const text = stripHtml(content);
      if (text) introParts.push(`${heading}\n${text}`);
    }
  }

  return { description: introParts.join('\n\n'), responsibilities, requirements, qualifications };
}

async function fetchPhenomJobDetail(applicationUrl) {
  const res = await fetch(applicationUrl, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  // A malformed/expired job URL redirects to a generic error page but still
  // returns HTTP 200, so a missing description match must also be treated
  // as a failure - otherwise it silently persists as an empty description.
  if (!res.ok) throw new Error(`${applicationUrl} -> HTTP ${res.status}`);
  const html = await res.text();
  const raw = extractPhenomDescription(html);
  if (!raw) throw new Error(`${applicationUrl} -> no description found (likely redirected to an error page)`);
  const sections = splitIntoSections(raw);
  const classified = classifyPhenomSections(sections);
  const hasStructuredContent =
    classified.responsibilities.length > 0 ||
    classified.requirements.length > 0 ||
    classified.qualifications.length > 0;
  if (!classified.description) {
    // No unheaded "overview"-style prose came through. If nothing was
    // structured either, fall back to a flat strip of the whole block; if
    // real content did land in the structured lists, a short generic line
    // is enough - the real content is fully visible in those sections and
    // the caller's own placeholder fallback (`description || ...`) only
    // triggers on a genuinely empty string, not on this.
    classified.description = hasStructuredContent
      ? 'See the sections below for full role details.'
      : stripHtml(raw);
  }
  return classified;
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

  const results = jobs.map((job) => {
    const cities = job.jobLocationShort || job.custprimecity || [];
    const rawLocation = Array.isArray(cities) ? cities[0] : cities;
    const location = (rawLocation || '').replace(/<br\/?>/g, '').trim() || 'India';
    // urlTitle comes back HTML-entity-encoded for titles with special chars
    // (e.g. "...Zscaler-&amp;-Palo-Alto..." for a title containing "&") -
    // decoding it first is required, otherwise the literal "&amp;" breaks
    // the URL and the detail page silently 200s to a generic error page.
    const urlTitle = decodeEntities(job.urlTitle || job.unifiedUrlTitle || '');
    return {
      externalId: job.id,
      title: job.unifiedStandardTitle || job.unifiedUrlTitle,
      location,
      department: null,
      postedDate: null,
      // The locale suffix is required - without it the site silently
      // redirects to a generic error page (still HTTP 200, no description).
      applicationUrl: `https://${company.phenomHost}/job/${urlTitle}/${job.id}-en_US`,
      isRemote: /remote/i.test(location),
    };
  });

  const DETAIL_CONCURRENCY = 5;
  for (let i = 0; i < results.length; i += DETAIL_CONCURRENCY) {
    const batch = results.slice(i, i + DETAIL_CONCURRENCY);
    await Promise.all(
      batch.map(async (job) => {
        try {
          const detail = await fetchPhenomJobDetail(job.applicationUrl);
          job.description = detail.description;
          job.responsibilities = detail.responsibilities;
          job.requirements = detail.requirements;
          job.qualifications = detail.qualifications;
        } catch (err) {
          console.warn(`  Phenom detail fetch failed for ${company.name} ${job.applicationUrl}: ${err.message}`);
        }
      })
    );
    if (i + DETAIL_CONCURRENCY < results.length) await sleep(PAGE_DELAY_MS);
  }

  return results;
}

export async function fetchInfosysCustom() {
  const data = await fetchJson(
    'https://intapgateway.infosysapps.com/careersci/search/intapjbsrch/getHotJobsDetails?location=All%20locations&sourceId=1,21'
  );
  return (data.hotJobsLists || []).map((job) => {
    // rolesResponsibilities is the only field with real content in
    // practice (technicalRequirement/preferredSkills/educationalRequirement
    // are consistently empty) - it's plain text using "•" bullets, not
    // HTML, so pull out bullet lines as responsibilities and keep the
    // non-bulleted lead-in text as the description.
    const raw = job.rolesResponsibilities || '';
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    const bulletLines = lines.filter((l) => l.startsWith('•')).map((l) => l.replace(/^•\s*/, ''));
    const proseLines = lines.filter((l) => !l.startsWith('•'));
    return {
      externalId: String(job.postingId),
      title: job.postingTitle,
      location: job.location || 'India',
      department: job.unit || null,
      postedDate: job.createdOn ? job.createdOn.slice(0, 10) : null,
      applicationUrl: `https://career.infosys.com/joblist/${job.requisitionId}`,
      description: proseLines.join('\n\n') || bulletLines[0] || undefined,
      responsibilities: bulletLines,
      isRemote: /remote/i.test(job.location || ''),
    };
  });
}

// Capgemini's list API already returns the full job description as HTML
// (unlike Workday/Phenom, which need a separate per-job detail fetch) -
// consistently split into <H2>-titled sections. Titles vary in trailing
// punctuation/casing but reliably start with "Your Role" (responsibilities)
// or "Your Profile"/"Your Skills" (requirements); anything else (company
// boilerplate, "What you'll love...", "About Capgemini") is skipped rather
// than kept as prose, since it's marketing copy, not job content.
function classifyCapgeminiDescription(html) {
  if (!html) return { description: '', responsibilities: [], requirements: [] };
  const sections = splitIntoSections(html);
  const responsibilities = [];
  const requirements = [];
  const introParts = [];

  for (const { heading, content } of sections) {
    if (heading === null) {
      const text = stripHtml(content);
      if (text) introParts.push(text);
      continue;
    }
    const h = heading.toLowerCase();
    if (/^your role/.test(h)) {
      responsibilities.push(...extractTopLevelListItems(content));
    } else if (/^your (profile|skills)/.test(h)) {
      requirements.push(...extractTopLevelListItems(content));
    }
    // Anything else (intro boilerplate, "What you'll love...", "About
    // Capgemini") is marketing copy, not job content - skipped entirely.
  }

  let description = introParts.join('\n\n');
  if (!description) {
    description =
      responsibilities.length > 0 || requirements.length > 0
        ? 'See the sections below for full role details.'
        : stripHtml(html);
  }
  return { description, responsibilities, requirements };
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
  return jobs.map((job) => {
    const { description, responsibilities, requirements } = classifyCapgeminiDescription(job.description);
    return {
      externalId: job.id,
      title: job.title || job.job_title,
      location: job.city || job.location || 'India',
      department: job.brand || null,
      postedDate: job.posted_date ? job.posted_date.slice(0, 10) : null,
      applicationUrl: job.apply_url || job.url || 'https://www.capgemini.com/in-en/careers/',
      description: description || undefined,
      responsibilities,
      requirements,
      isRemote: /remote/i.test(job.city || job.location || ''),
    };
  });
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

// AMD's list API already returns the full description, but as plain text
// (no HTML) that always opens with one of two fixed company-mission
// sentences and always closes with the same boilerplate legal/benefits
// paragraph - neither is job-specific content, so both are stripped.
// Section markers within the remaining text ("Key Responsibilities",
// "Required Qualifications"/"Required Skills", "Preferred Qualifications")
// vary in case and wording and aren't present on every posting, so rather
// than risk mis-splitting inconsistent plain-text bullets, only the known
// boilerplate is removed and the rest is kept as readable prose.
const AMD_INTRO_PATTERNS = [
  /^WHAT YOU DO AT AMD CHANGES EVERYTHING\s+At AMD, our mission is to build great products[\s\S]*?Together, we advance your career\.\s*/i,
  /^ADVANCE YOUR CAREER\. ADVANCE THE WORLD\.[\s\S]*?technology that moves the world forward\.\s*/i,
];
const AMD_OUTRO_PATTERN =
  /\s*Benefits offered are described: AMD benefits at a glance\.[\s\S]*$/i;

function cleanAmdDescription(raw) {
  if (!raw) return '';
  let text = raw;
  for (const pattern of AMD_INTRO_PATTERNS) {
    text = text.replace(pattern, '');
  }
  text = text.replace(AMD_OUTRO_PATTERN, '');
  return text.trim();
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
      description: cleanAmdDescription(j.description) || undefined,
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
