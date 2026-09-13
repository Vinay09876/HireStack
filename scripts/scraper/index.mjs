import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { PLATFORM_ADAPTERS } from './platforms.mjs';
import { isIndiaJob, normalizeJob } from './normalize.mjs';

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
  if (error) throw new Error(`companies upsert failed for ${company.id}: ${error.message}`);
}

async function upsertJobs(jobs) {
  if (jobs.length === 0) return;
  const CHUNK = 200;
  for (let i = 0; i < jobs.length; i += CHUNK) {
    const chunk = jobs.slice(i, i + CHUNK);
    const { error } = await supabase.from('jobs').upsert(chunk, { onConflict: 'id' });
    if (error) throw new Error(`jobs upsert failed: ${error.message}`);
  }
}

async function deactivateMissingJobs(companyId, activeIds) {
  if (activeIds.length === 0) {
    // Nothing came back this run — don't nuke everything on a transient failure;
    // caller already logs a warning and skips this company's cleanup.
    return;
  }
  const { error } = await supabase
    .from('jobs')
    .update({ is_active: false })
    .eq('company_id', companyId)
    .not('id', 'in', `(${activeIds.map((id) => `"${id}"`).join(',')})`);
  if (error) throw new Error(`deactivate failed for ${companyId}: ${error.message}`);
}

async function run() {
  const summary = [];

  for (const company of companies) {
    const adapter = PLATFORM_ADAPTERS[company.platform];
    if (!adapter) {
      console.warn(`Skipping ${company.name}: no adapter for platform "${company.platform}"`);
      continue;
    }

    try {
      await upsertCompany(company);

      const rawJobs = await adapter(company);
      const indiaJobs = rawJobs.filter(isIndiaJob);
      const normalizedWithDupes = indiaJobs.map((raw) => normalizeJob(company, raw));

      // Some ATS APIs (e.g. Oracle HCM) can return the same job across
      // overlapping pages; de-dupe by id before upserting so a single
      // upsert() call never targets the same row twice.
      const seen = new Set();
      const normalized = normalizedWithDupes.filter((job) => {
        if (seen.has(job.id)) return false;
        seen.add(job.id);
        return true;
      });

      await upsertJobs(normalized);
      await deactivateMissingJobs(
        company.id,
        normalized.map((j) => j.id)
      );

      summary.push({ company: company.name, total: rawJobs.length, india: normalized.length, status: 'ok' });
      console.log(`${company.name}: ${rawJobs.length} total, ${normalized.length} India-based`);
    } catch (err) {
      summary.push({ company: company.name, status: 'error', error: err.message });
      console.error(`${company.name}: FAILED - ${err.message}`);
    }
  }

  console.log('\n=== Scrape summary ===');
  console.table(summary);

  const failures = summary.filter((s) => s.status === 'error');
  if (failures.length > 0) {
    console.error(`\n${failures.length} of ${summary.length} companies failed this run.`);
  }
}

run();
