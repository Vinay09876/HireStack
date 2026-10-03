import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { PLATFORM_ADAPTERS } from './platforms.mjs';
import { ScrapeError, fetchCompanyJobs, prepareJobs } from './scrape-core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const companies = JSON.parse(readFileSync(join(__dirname, 'companies.json'), 'utf8'));

async function upsertCompany(company) {
  const { error } = await supabase.from('companies').upsert(
    {
      id: company.id,
      name: company.name,
      logo_url: company.logoUrl,
      about: company.about,
      website_url: company.websiteUrl,
      headquarters: company.headquarters,
      founded: company.founded,
      employees: company.employees,
      banner_gradient: company.bannerGradient,
    },
    { onConflict: 'id' }
  );
  if (error) throw new ScrapeError('db', `companies upsert failed for ${company.id}: ${error.message}`);
}

async function upsertJobs(jobs) {
  if (jobs.length === 0) return;
  const CHUNK = 200;
  for (let i = 0; i < jobs.length; i += CHUNK) {
    const chunk = jobs.slice(i, i + CHUNK);
    const { error } = await supabase.from('jobs').upsert(chunk, { onConflict: 'id' });
    if (error) throw new ScrapeError('db', `jobs upsert failed: ${error.message}`);
  }
}

// Every job upserted this run carries last_seen_at = runStartedAt, so any of
// this company's still-active jobs with an older last_seen_at weren't returned
// by the source this time and are no longer open. Only called after the
// company's fetch AND upsert both succeeded, so a failed or partial run never
// deactivates anything.
async function deactivateMissingJobs(companyId, runStartedAt) {
  const { error } = await supabase
    .from('jobs')
    .update({ is_active: false })
    .eq('company_id', companyId)
    .eq('is_active', true)
    .lt('last_seen_at', runStartedAt);
  if (error) throw new ScrapeError('db', `deactivate failed for ${companyId}: ${error.message}`);
}

// Companies deleted from companies.json are never scraped again, so their
// jobs would otherwise stay active forever. The company rows themselves are
// kept: deleting them would cascade-delete users' saved_jobs.
async function deactivateRemovedCompanies(configuredIds) {
  if (configuredIds.length === 0) {
    // An empty filter would match - and deactivate - every job in the table.
    throw new ScrapeError('config', 'companies.json has no company ids; refusing to deactivate removed companies');
  }
  const { data, error } = await supabase
    .from('jobs')
    .update({ is_active: false })
    .eq('is_active', true)
    .not('company_id', 'in', `(${configuredIds.map((id) => `"${id}"`).join(',')})`)
    .select('company_id');
  if (error) throw new ScrapeError('db', `deactivate failed for removed companies: ${error.message}`);
  return data || [];
}

async function run() {
  // One timestamp for the whole run, stamped onto every job seen in it.
  const runStartedAt = new Date().toISOString();
  const summary = [];

  for (const company of companies) {
    const adapter = PLATFORM_ADAPTERS[company.platform];
    if (!adapter) {
      const message = `no adapter for platform "${company.platform}"`;
      summary.push({ company: company.name, status: 'error', kind: 'config', knownFailing: !!company.knownFailing, error: message });
      console.error(`${company.name}: FAILED (config) - ${message}`);
      continue;
    }

    try {
      await upsertCompany(company);

      const rawJobs = await fetchCompanyJobs(adapter, company);
      const { jobs: normalized } = prepareJobs(company, rawJobs, runStartedAt);

      await upsertJobs(normalized);

      if (normalized.length === 0) {
        // Zero India jobs is far more often a transient/upstream glitch than
        // a company genuinely closing every role, so don't wipe its listings.
        console.warn(`${company.name}: 0 India-based jobs returned; skipping deactivation of its existing jobs`);
      } else {
        await deactivateMissingJobs(company.id, runStartedAt);
      }

      summary.push({ company: company.name, total: rawJobs.length, india: normalized.length, status: 'ok' });
      console.log(`${company.name}: ${rawJobs.length} total, ${normalized.length} India-based`);
    } catch (err) {
      const kind = err instanceof ScrapeError ? err.kind : 'db';
      summary.push({ company: company.name, status: 'error', kind, knownFailing: !!company.knownFailing, error: err.message });
      console.error(`${company.name}: FAILED (${kind}) - ${err.message}`);
    }
  }

  try {
    const removed = await deactivateRemovedCompanies(companies.map((c) => c.id));
    const removedCompanyIds = [...new Set(removed.map((row) => row.company_id))];
    if (removed.length > 0) {
      console.log(
        `Deactivated ${removed.length} job(s) from companies no longer in companies.json: ${removedCompanyIds.join(', ')}`
      );
    }
  } catch (err) {
    const kind = err instanceof ScrapeError ? err.kind : 'db';
    summary.push({ company: '(removed companies cleanup)', status: 'error', kind, knownFailing: false, error: err.message });
    console.error(`Removed-companies cleanup: FAILED (${kind}) - ${err.message}`);
  }

  console.log('\n=== Scrape summary ===');
  console.table(summary);

  const failures = summary.filter((s) => s.status === 'error');
  const excused = failures.filter((s) => s.kind === 'fetch' && s.knownFailing);
  const blocking = failures.filter((s) => !excused.includes(s));

  if (excused.length > 0) {
    console.warn(
      `\n${excused.length} known-failing compan${excused.length === 1 ? 'y' : 'ies'} failed to fetch (not failing the run): ` +
        excused.map((s) => s.company).join(', ')
    );
  }
  if (blocking.length > 0) {
    console.error(`\n${blocking.length} failure(s) this run:`);
    for (const s of blocking) console.error(`  - ${s.company} [${s.kind}]: ${s.error}`);
  }
  return blocking.length === 0;
}

run()
  .then((ok) => {
    // Explicit exit: a timed-out adapter's requests may still be in flight and
    // would otherwise keep the process alive after the run has finished.
    process.exit(ok ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal error in scraper:', err);
    process.exit(1);
  });
