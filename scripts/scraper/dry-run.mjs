// Read-only dry run of the scraper: fetches every company exactly like
// index.mjs does, then compares the result against what's currently in
// Supabase and reports what a real run WOULD do - without writing anything.
//
//   node dry-run.mjs                 print the report
//   node dry-run.mjs --out report.json   also save it as JSON
//
// Writes are impossible from this script: its Supabase client is built on a
// fetch wrapper that refuses every request except GET/HEAD. For a second,
// database-level guarantee, set SUPABASE_ANON_KEY - it's then used instead of
// the service_role key, and RLS has no write policies for anon on these tables.
//
// Exit code: 0 if a real run would pass, 1 if it would fail (or if the dry run
// itself couldn't complete).
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import dotenv from 'dotenv';
import { PLATFORM_ADAPTERS } from './platforms.mjs';
import { ScrapeError, fetchCompanyJobs, prepareJobs } from './scrape-core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PAGE_SIZE = 1000;
// Flag a company when a real run would deactivate at least this share of its
// currently active jobs - usually a sign of a partial/broken fetch.
const LARGE_DEACTIVATION_RATIO = 0.5;

// Wraps fetch so only GET/HEAD requests ever leave the process. Any other
// method is recorded and rejected before it reaches the network.
export function createReadOnlyFetch(blockedRequests, baseFetch = fetch) {
  return (input, init = {}) => {
    const method = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      const url = typeof input === 'string' ? input : input.url;
      blockedRequests.push(`${method} ${url}`);
      return Promise.reject(new Error(`dry run: blocked ${method} request - the dry run must never write`));
    }
    return baseFetch(input, init);
  };
}

// Pages through a query with a deterministic order so no row is skipped or
// counted twice.
async function readAll(buildQuery) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().order('id').range(from, from + PAGE_SIZE - 1);
    if (error) throw new ScrapeError('db', error.message);
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

async function checkMigration001(supabase) {
  const { error } = await supabase.from('jobs').select('last_seen_at').limit(1);
  if (!error) return null;
  return error.code === '42703' || /last_seen_at/.test(error.message)
    ? 'jobs.last_seen_at does not exist - apply supabase/migrations/001_p0_scraper_columns.sql before the real run, or every jobs upsert will fail'
    : `could not check for jobs.last_seen_at: ${error.message}`;
}

async function dryRunCompany(supabase, company, existingCompanyIds, runStartedAt) {
  const report = {
    company: company.name,
    id: company.id,
    knownFailing: !!company.knownFailing,
    companyRow: existingCompanyIds.has(company.id) ? 'exists' : 'new',
    fetch: 'not run',
    rawJobs: 0,
    indiaJobs: 0,
    wouldUpsert: 0,
    newJobs: 0,
    reactivated: 0,
    activeInDb: 0,
    wouldDeactivate: 0,
    skippedZeroJobs: false,
    issues: [],
    warnings: [],
  };
  const issue = (kind, message) => report.issues.push({ kind, message });

  const adapter = PLATFORM_ADAPTERS[company.platform];
  if (!adapter) {
    issue('config', `no adapter for platform "${company.platform}"`);
    return report;
  }
  // companies.name is NOT NULL, so the real run's companies upsert would fail.
  if (!company.name) issue('db', 'companies.json entry has no "name"; the companies upsert would fail');

  let rawJobs;
  try {
    rawJobs = await fetchCompanyJobs(adapter, company);
    report.fetch = 'ok';
  } catch (err) {
    report.fetch = 'failed';
    issue(err instanceof ScrapeError ? err.kind : 'fetch', err.message);
    return report;
  }

  const { indiaCount, jobs } = prepareJobs(company, rawJobs, runStartedAt);
  report.rawJobs = rawJobs.length;
  report.indiaJobs = indiaCount;
  report.wouldUpsert = jobs.length;

  // Rows the real upsert would reject on the jobs table's NOT NULL columns.
  const invalid = jobs.filter((j) => !j.title || !j.application_url);
  if (invalid.length > 0) {
    issue(
      'db',
      `${invalid.length} row(s) missing title or application_url would fail the jobs upsert (e.g. ${invalid[0].id})`
    );
  }

  let existing;
  try {
    existing = await readAll(() => supabase.from('jobs').select('id, is_active').eq('company_id', company.id));
  } catch (err) {
    issue('db', `could not read existing jobs: ${err.message}`);
    return report;
  }

  const scrapedIds = new Set(jobs.map((j) => j.id));
  const existingById = new Map(existing.map((row) => [row.id, row.is_active]));
  const active = existing.filter((row) => row.is_active);

  report.activeInDb = active.length;
  report.newJobs = jobs.filter((j) => !existingById.has(j.id)).length;
  report.reactivated = jobs.filter((j) => existingById.get(j.id) === false).length;

  if (jobs.length === 0) {
    // Mirrors index.mjs: 0 India jobs never deactivates anything.
    report.skippedZeroJobs = true;
    if (active.length > 0) {
      report.warnings.push(`0 India jobs returned; ${active.length} active job(s) left untouched by the zero-jobs safeguard`);
    }
  } else {
    // After this company's upsert, every scraped job has last_seen_at =
    // runStartedAt, so exactly the active rows NOT scraped this run satisfy
    // last_seen_at < runStartedAt - whether last_seen_at was backfilled by
    // migration 001 or set by an earlier run.
    report.wouldDeactivate = active.filter((row) => !scrapedIds.has(row.id)).length;
    if (report.wouldDeactivate > 0 && report.wouldDeactivate / active.length >= LARGE_DEACTIVATION_RATIO) {
      report.warnings.push(
        `would deactivate ${report.wouldDeactivate} of ${active.length} active jobs (${Math.round(
          (report.wouldDeactivate / active.length) * 100
        )}%) - check the fetch isn't partial`
      );
    }
  }

  return report;
}

async function readRemovedCompanies(supabase, configuredIds) {
  if (configuredIds.length === 0) {
    throw new ScrapeError('config', 'companies.json has no company ids; the real run refuses removed-companies cleanup');
  }
  const rows = await readAll(() =>
    supabase
      .from('jobs')
      .select('id, company_id')
      .eq('is_active', true)
      .not('company_id', 'in', `(${configuredIds.map((id) => `"${id}"`).join(',')})`)
  );
  const counts = {};
  for (const row of rows) counts[row.company_id] = (counts[row.company_id] || 0) + 1;
  return counts;
}

function isBlocking(companyReport, issue) {
  return !(issue.kind === 'fetch' && companyReport.knownFailing);
}

export async function dryRun({ supabase, companies, blockedRequests }) {
  const runStartedAt = new Date().toISOString();
  const report = {
    generatedAt: runStartedAt,
    mode: 'dry-run (read-only)',
    globalIssues: [],
    globalWarnings: [],
    companies: [],
    removedCompanies: {},
    totals: {},
    wouldRealRunPass: false,
  };

  const migrationIssue = await checkMigration001(supabase);
  if (migrationIssue) report.globalIssues.push({ kind: 'db', message: migrationIssue });

  const ids = companies.map((c) => c.id);
  const duplicateIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (duplicateIds.length > 0) {
    report.globalWarnings.push(`duplicate company ids in companies.json: ${duplicateIds.join(', ')}`);
  }

  let existingCompanyIds = new Set();
  const { data: companyRows, error: companyError } = await supabase.from('companies').select('id');
  if (companyError) {
    report.globalIssues.push({ kind: 'db', message: `could not read companies: ${companyError.message}` });
  } else {
    existingCompanyIds = new Set((companyRows || []).map((c) => c.id));
  }

  for (const company of companies) {
    const r = await dryRunCompany(supabase, company, existingCompanyIds, runStartedAt);
    report.companies.push(r);
    const status = r.issues.length === 0 ? 'ok' : r.issues.every((i) => !isBlocking(r, i)) ? 'tolerated' : 'FAIL';
    console.log(
      `${company.name}: fetch ${r.fetch}, ${r.indiaJobs} India, ${r.wouldUpsert} upsert, ` +
        `${r.wouldDeactivate} deactivate${r.skippedZeroJobs ? ' (skipped: 0 jobs)' : ''} [${status}]`
    );
  }

  try {
    report.removedCompanies = await readRemovedCompanies(supabase, ids);
  } catch (err) {
    report.globalIssues.push({
      kind: err instanceof ScrapeError ? err.kind : 'db',
      message: `removed-companies check failed: ${err.message}`,
    });
  }

  const sum = (key) => report.companies.reduce((n, c) => n + c[key], 0);
  const removedTotal = Object.values(report.removedCompanies).reduce((n, v) => n + v, 0);
  report.totals = {
    companies: report.companies.length,
    fetchOk: report.companies.filter((c) => c.fetch === 'ok').length,
    fetchFailed: report.companies.filter((c) => c.fetch === 'failed').length,
    wouldUpsert: sum('wouldUpsert'),
    newJobs: sum('newJobs'),
    reactivated: sum('reactivated'),
    activeInDb: sum('activeInDb'),
    wouldDeactivate: sum('wouldDeactivate'),
    wouldDeactivateFromRemovedCompanies: removedTotal,
  };

  const blocking = [
    ...report.globalIssues.map((i) => ({ company: '(global)', ...i })),
    ...report.companies.flatMap((c) => c.issues.filter((i) => isBlocking(c, i)).map((i) => ({ company: c.company, ...i }))),
  ];
  if (blockedRequests.length > 0) {
    blocking.push({ company: '(dry run)', kind: 'bug', message: `blocked write attempt(s): ${blockedRequests.join('; ')}` });
  }
  report.blockingIssues = blocking;
  report.blockedWriteAttempts = blockedRequests.slice();
  report.wouldRealRunPass = blocking.length === 0;
  return report;
}

function printReport(report) {
  console.log('\n=== Dry run: what a real scrape would do (nothing was written) ===');
  console.table(
    report.companies.map((c) => ({
      company: c.company,
      knownFailing: c.knownFailing,
      fetch: c.fetch,
      india: c.indiaJobs,
      upsert: c.wouldUpsert,
      new: c.newJobs,
      reactivate: c.reactivated,
      activeInDb: c.activeInDb,
      deactivate: c.wouldDeactivate,
      skippedZero: c.skippedZeroJobs,
      issues: c.issues.map((i) => `[${i.kind}] ${i.message}`).join(' | '),
    }))
  );

  const removed = Object.entries(report.removedCompanies);
  if (removed.length > 0) {
    console.log('\nActive jobs from companies no longer in companies.json (would be deactivated):');
    for (const [id, n] of removed) console.log(`  - ${id}: ${n}`);
  }

  console.log('\nTotals:', report.totals);

  const warnings = [
    ...report.globalWarnings,
    ...report.companies.flatMap((c) => c.warnings.map((w) => `${c.company}: ${w}`)),
  ];
  if (warnings.length > 0) {
    console.warn('\nWarnings:');
    for (const w of warnings) console.warn(`  - ${w}`);
  }

  const tolerated = report.companies.filter((c) => c.knownFailing && c.issues.some((i) => i.kind === 'fetch'));
  if (tolerated.length > 0) {
    console.warn(`\nKnown-failing fetch failures (a real run tolerates these): ${tolerated.map((c) => c.company).join(', ')}`);
  }

  if (report.blockingIssues.length > 0) {
    console.error(`\nA real run would FAIL - ${report.blockingIssues.length} blocking issue(s):`);
    for (const i of report.blockingIssues) console.error(`  - ${i.company} [${i.kind}]: ${i.message}`);
  } else {
    console.log('\nA real run would pass.');
  }
}

async function main() {
  dotenv.config({ path: join(__dirname, '.env') });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) {
    console.error('Missing SUPABASE_URL and SUPABASE_ANON_KEY (preferred) or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }
  console.log(
    `Dry run (read-only) using the ${process.env.SUPABASE_ANON_KEY ? 'anon' : 'service_role'} key; ` +
      'all non-GET requests are blocked.\n'
  );

  const outIndex = process.argv.indexOf('--out');
  const outPath = outIndex !== -1 ? process.argv[outIndex + 1] : null;
  if (outIndex !== -1 && !outPath) {
    console.error('--out needs a file path');
    process.exit(1);
  }

  const blockedRequests = [];
  const supabase = createClient(SUPABASE_URL, key, {
    global: { fetch: createReadOnlyFetch(blockedRequests) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const companies = JSON.parse(readFileSync(join(__dirname, 'companies.json'), 'utf8'));

  const report = await dryRun({ supabase, companies, blockedRequests });
  printReport(report);

  if (outPath) {
    writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to ${outPath}`);
  }
  return report.wouldRealRunPass;
}

// Only run when executed directly (not when imported by tests).
const samePath = (a, b) => (process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b);
const isEntryPoint = !!process.argv[1] && samePath(resolve(process.argv[1]), fileURLToPath(import.meta.url));
if (isEntryPoint) {
  main()
    .then((ok) => process.exit(ok ? 0 : 1))
    .catch((err) => {
      console.error('Fatal error in dry run:', err);
      process.exit(1);
    });
}
