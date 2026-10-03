// Fetch + normalize logic shared by the real scraper (index.mjs) and the
// read-only dry run (dry-run.mjs), so the dry run reports exactly what a real
// run would upsert. Nothing in this module talks to Supabase.
import { isIndiaJob, normalizeJob } from './normalize.mjs';

// Every failure is tagged with what kind of operation failed, so the run can
// decide whether it should fail the GitHub Action:
//   'fetch'  - the company's careers API/ATS couldn't be scraped
//   'db'     - a Supabase write failed
//   'config' - companies.json is misconfigured
// Only 'fetch' failures can be excused, and only for companies explicitly
// marked "knownFailing": true in companies.json.
export class ScrapeError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

// Hard ceiling on how long a single company's fetch can run for. Individual
// requests already time out and retry inside fetchJson(), but this is a
// backstop so a company that keeps paginating (or any other runaway loop)
// can never stall the whole scheduled run.
// Workday companies with many India postings now also fetch a per-job
// detail page for a real description, so this needs real headroom.
const COMPANY_TIMEOUT_MS = 300000;

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

export async function fetchCompanyJobs(adapter, company) {
  try {
    const rawJobs = await withTimeout(adapter(company), COMPANY_TIMEOUT_MS, company.name);
    if (!Array.isArray(rawJobs)) throw new Error('adapter did not return an array of jobs');
    return rawJobs;
  } catch (err) {
    throw new ScrapeError('fetch', err.message);
  }
}

// India-filters, normalizes and de-dupes a company's raw jobs into the exact
// rows a real run upserts.
export function prepareJobs(company, rawJobs, runStartedAt) {
  const indiaJobs = rawJobs.filter(isIndiaJob);
  const normalizedWithDupes = indiaJobs.map((raw) => ({
    ...normalizeJob(company, raw),
    last_seen_at: runStartedAt,
  }));

  // Some ATS APIs (e.g. Oracle HCM) can return the same job across
  // overlapping pages; de-dupe by id before upserting so a single
  // upsert() call never targets the same row twice.
  const seen = new Set();
  const jobs = normalizedWithDupes.filter((job) => {
    if (seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });

  return { indiaCount: indiaJobs.length, jobs };
}
