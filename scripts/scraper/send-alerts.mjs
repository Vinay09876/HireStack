import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_FROM_EMAIL = process.env.ALERT_FROM_EMAIL || 'HireStack Alerts <onboarding@resend.dev>';
const SITE_URL = process.env.SITE_URL || 'https://hirestack.vercel.app';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}
if (!RESEND_API_KEY) {
  console.error('Missing RESEND_API_KEY environment variable.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Approximate year ranges for the 4 experience_level categories that exist
// in the jobs table - there's no real structured "years required" field,
// so this is the same mapping already agreed for the matching feature.
const EXPERIENCE_RANGES = {
  Entry: [0, 2],
  Mid: [2, 5],
  Senior: [5, 9],
  Lead: [8, 99],
};

function rangesOverlap([aMin, aMax], [bMin, bMax]) {
  return aMin <= bMax && bMin <= aMax;
}

function roleMatches(userRole, job) {
  const needle = userRole.trim().toLowerCase();
  if (!needle) return false;
  return job.title.toLowerCase().includes(needle);
}

function countMatchingSkills(userSkills, job) {
  const haystack = `${job.title} ${job.description || ''}`.toLowerCase();
  return userSkills.filter((skill) => haystack.includes(skill.toLowerCase())).length;
}

function jobMatchesAlert(alert, job) {
  if (!roleMatches(alert.role, job)) return false;

  const matchingSkills = countMatchingSkills(alert.skills, job);
  if (matchingSkills < 3) return false;

  const userRange = EXPERIENCE_RANGES[alert.experience_level];
  const jobRange = EXPERIENCE_RANGES[job.experience_level];
  if (!userRange || !jobRange) return false;
  if (!rangesOverlap(userRange, jobRange)) return false;

  return true;
}

function renderEmailHtml({ name, matches }) {
  const rows = matches
    .map(
      (job) => `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #e2e8f0;">
          <a href="${SITE_URL}/jobs/${job.id}" style="font-size:15px;font-weight:700;color:#4338ca;text-decoration:none;">
            ${job.title}
          </a>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">
            ${job.company_name} &middot; ${job.location} &middot; ${job.experience_level}
          </div>
          <a href="${SITE_URL}/jobs/${job.id}" style="display:inline-block;margin-top:10px;font-size:12px;font-weight:600;color:#ffffff;background:#4f46e5;padding:8px 14px;border-radius:8px;text-decoration:none;">
            View job on HireStack &rarr;
          </a>
        </td>
      </tr>`
    )
    .join('');

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
    <div style="padding:24px 0;">
      <span style="font-size:20px;font-weight:800;color:#0f172a;">Hire<span style="color:#4f46e5;">Stack</span></span>
    </div>
    <h1 style="font-size:18px;margin:0 0 8px;">Hi ${name || 'there'}, we found ${matches.length} new match${matches.length === 1 ? '' : 'es'} for you</h1>
    <p style="font-size:13px;color:#475569;line-height:1.6;margin:0 0 8px;">
      Based on your saved job alert preferences, here ${matches.length === 1 ? 'is a role' : 'are roles'} posted in the last day that fit what you're looking for.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">
      ${rows}
    </table>
    <p style="font-size:11px;color:#94a3b8;margin-top:28px;line-height:1.6;">
      You're receiving this because you set up a job alert on HireStack. Manage or turn off your alert anytime from
      <a href="${SITE_URL}/job-alerts" style="color:#4f46e5;">your job alerts page</a>.
    </p>
  </div>`;
}

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: ALERT_FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend API error (${res.status}): ${text}`);
  }
}

async function main() {
  console.log('Loading saved job alerts...');
  const { data: alerts, error: alertsError } = await supabase.from('job_alerts').select('*');
  if (alertsError) throw new Error(`Failed to load job_alerts: ${alertsError.message}`);
  if (!alerts || alerts.length === 0) {
    console.log('No saved job alerts. Nothing to do.');
    return;
  }
  console.log(`Loaded ${alerts.length} saved job alert(s).`);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  console.log(`Loading jobs created since ${since}...`);
  // Supabase caps a single select() at 1000 rows, so page through all
  // matching jobs rather than silently truncating the result.
  const PAGE_SIZE = 1000;
  const newJobs = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, description, company_id, location, experience_level, is_active, created_at')
      .eq('is_active', true)
      .gte('created_at', since)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to load new jobs: ${error.message}`);
    newJobs.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  if (newJobs.length === 0) {
    console.log('No new jobs in the last 24 hours. Nothing to do.');
    return;
  }
  console.log(`Loaded ${newJobs.length} job(s) posted in the last 24 hours.`);

  const { data: companyRows, error: companyError } = await supabase
    .from('companies')
    .select('id, name');
  if (companyError) throw new Error(`Failed to load companies: ${companyError.message}`);
  const companyNameById = new Map((companyRows || []).map((c) => [c.id, c.name]));
  const jobsWithCompany = newJobs.map((job) => ({
    ...job,
    company_name: companyNameById.get(job.company_id) || job.company_id,
  }));

  const { data: userRows, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) throw new Error(`Failed to load users: ${usersError.message}`);
  const userById = new Map((userRows?.users || []).map((u) => [u.id, u]));

  let emailsSent = 0;

  for (const alert of alerts) {
    const user = userById.get(alert.user_id);
    if (!user || !user.email) continue;

    const candidateMatches = jobsWithCompany.filter((job) => jobMatchesAlert(alert, job));
    if (candidateMatches.length === 0) continue;

    // Filter out jobs we've already emailed this user (avoid duplicates
    // across daily runs if a job stays "new" longer than expected).
    const { data: alreadySentRows, error: alreadySentError } = await supabase
      .from('job_alert_sent')
      .select('job_id')
      .eq('user_id', alert.user_id)
      .in(
        'job_id',
        candidateMatches.map((j) => j.id)
      );
    if (alreadySentError) {
      console.error(`Failed to check job_alert_sent for user ${alert.user_id}: ${alreadySentError.message}`);
      continue;
    }
    const alreadySentIds = new Set((alreadySentRows || []).map((r) => r.job_id));
    const matches = candidateMatches.filter((job) => !alreadySentIds.has(job.id));
    if (matches.length === 0) continue;

    const name = user.user_metadata?.full_name || user.email.split('@')[0];
    const html = renderEmailHtml({ name, matches });

    try {
      await sendEmail(user.email, `${matches.length} new job match${matches.length === 1 ? '' : 'es'} on HireStack`, html);
      emailsSent += 1;

      const sentRows = matches.map((job) => ({ user_id: alert.user_id, job_id: job.id }));
      const { error: insertError } = await supabase.from('job_alert_sent').insert(sentRows);
      if (insertError) {
        console.error(`Failed to record job_alert_sent for user ${alert.user_id}: ${insertError.message}`);
      }
      console.log(`Sent ${matches.length} match(es) to ${user.email}`);
    } catch (err) {
      console.error(`Failed to send email to ${user.email}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`Done. Sent ${emailsSent} digest email(s).`);
}

main().catch((err) => {
  console.error('Fatal error in send-alerts:', err);
  process.exit(1);
});
