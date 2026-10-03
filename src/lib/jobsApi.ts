// Database-side job queries. All reads go through the read-only views from
// supabase/migrations/002_p0_job_listing_views.sql (security_invoker, so the
// jobs/companies RLS policies apply as for direct table reads), and every
// multi-row query has a deterministic order ending in `id`.
import { supabase } from './supabase';
import type { ExperienceLevel, FilterState, Job, JobType } from '../types';

export type SortOption = 'recent' | 'relevance';

// Columns needed to render a job card / list row.
const LIST_COLUMNS =
  'id, title, company_id, company_name, company_logo, location, job_type, experience_level, ' +
  'description, salary_range, application_url, posted_date, department, is_remote';
// Job detail additionally needs the structured sections.
const DETAIL_COLUMNS = `${LIST_COLUMNS}, responsibilities, requirements, qualifications`;

// PostgREST caps a single response at 1000 rows.
const MAX_PAGE = 1000;
// Keeps `id=in.(...)` URLs well under request-line limits.
const ID_BATCH_SIZE = 100;

interface JobListingRow {
  id: string;
  title: string;
  company_id: string;
  company_name: string;
  company_logo: string;
  location: string;
  job_type: JobType;
  experience_level: ExperienceLevel;
  description: string;
  salary_range: string | null;
  application_url: string;
  posted_date: string | null;
  department: string | null;
  is_remote: boolean;
  responsibilities?: string[] | null;
  requirements?: string[] | null;
  qualifications?: string[] | null;
}

export function mapJobListingRow(row: JobListingRow): Job {
  return {
    id: row.id,
    title: row.title,
    companyId: row.company_id,
    companyName: row.company_name,
    companyLogo: row.company_logo || '',
    location: row.location,
    jobType: row.job_type,
    experienceLevel: row.experience_level,
    description: row.description,
    // Only present on detail queries; list rows render without them.
    responsibilities: row.responsibilities || [],
    requirements: row.requirements || [],
    qualifications: row.qualifications || [],
    salaryRange: row.salary_range,
    applicationUrl: row.application_url,
    postedDate: row.posted_date ?? null,
    // job_listings only contains active jobs.
    isActive: true,
    department: row.department ?? undefined,
    isRemote: row.is_remote,
  };
}

const toJobs = (data: unknown): Job[] => ((data ?? []) as JobListingRow[]).map(mapJobListingRow);

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

/**
 * Turns user text into a Postgres regex (PostgREST `imatch`, i.e. `~*`) that
 * matches it as a literal, case-insensitive substring - the same semantics as
 * the previous client-side `toLowerCase().includes()`.
 *
 * Every regex metacharacter is backslash-escaped. `imatch` is used instead of
 * `ilike` because PostgREST rewrites every `*` in a like/ilike pattern to `%`,
 * so a literal `*` can't be expressed there; `%` and `_` have no special
 * meaning in a regex at all.
 */
export function toLiteralRegex(text: string): string {
  return text.replace(/[\\^$.|?*+()[\]{}]/g, '\\$&');
}

/** Local calendar date `days` days before today, as YYYY-MM-DD. */
export function postedOnOrAfter(days: number, now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function filteredListings(
  columns: string,
  filters: FilterState,
  options?: { count?: 'exact'; head?: boolean },
  now: Date = new Date()
) {
  let query = supabase.from('job_listings').select(columns, options);

  // Keyword: title, company, description, requirements, department.
  const keyword = filters.searchQuery.trim();
  if (keyword) query = query.regexIMatch('search_text', toLiteralRegex(keyword));

  // Location: substring match (the dropdown and the homepage's free-text box).
  if (filters.location) query = query.regexIMatch('location', toLiteralRegex(filters.location));

  // Company: exact name, case-insensitive.
  if (filters.company) query = query.regexIMatch('company_name', `^${toLiteralRegex(filters.company)}$`);

  if (filters.jobTypes.length > 0) query = query.in('job_type', filters.jobTypes);
  if (filters.experienceLevels.length > 0) query = query.in('experience_level', filters.experienceLevels);

  // "Posted within N days" == posted_date >= today - N (local calendar days):
  // future dates count as today, and NULL (unknown) never matches.
  if (filters.postedWithinDays !== 'all') {
    query = query.gte('posted_date', postedOnOrAfter(filters.postedWithinDays, now));
  }

  return query;
}

// 'recent': newest posting first, unknown dates last.
// 'relevance': there is no relevance score; this used to apply no ordering at
// all (so the order depended on whatever the database returned). Insertion
// order (created_at, id) is a deterministic stand-in, not an exact equivalent.
function sorted<Q extends { order: (column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => Q }>(
  query: Q,
  sort: SortOption
): Q {
  return sort === 'recent'
    ? query.order('posted_date', { ascending: false, nullsFirst: false }).order('id', { ascending: true })
    : query.order('created_at', { ascending: true }).order('id', { ascending: true });
}

export interface JobsPageResult {
  jobs: Job[];
  total: number;
}

export async function fetchJobsPage({
  filters,
  sort,
  page,
  pageSize,
  now,
}: {
  filters: FilterState;
  sort: SortOption;
  page: number;
  pageSize: number;
  now?: Date;
}): Promise<JobsPageResult> {
  const from = (page - 1) * pageSize;
  const { data, error, count } = await sorted(filteredListings(LIST_COLUMNS, filters, { count: 'exact' }, now), sort).range(
    from,
    from + pageSize - 1
  );

  if (error) {
    // Page is past the end (e.g. jobs were deactivated since the page count
    // was shown): return the real total so the caller can move back.
    if (error.code === 'PGRST103') return { jobs: [], total: await countJobs(filters, now) };
    fail('Failed to load jobs', error);
  }
  return { jobs: toJobs(data), total: count ?? 0 };
}

export async function countJobs(filters: FilterState, now?: Date): Promise<number> {
  const { count, error } = await filteredListings('id', filters, { count: 'exact', head: true }, now);
  if (error) fail('Failed to count jobs', error);
  return count ?? 0;
}

/** Returns null when the job doesn't exist or is no longer active. */
export async function fetchJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase.from('job_listings').select(DETAIL_COLUMNS).eq('id', id).maybeSingle();
  if (error) fail('Failed to load job', error);
  return data ? mapJobListingRow(data as unknown as JobListingRow) : null;
}

/**
 * A company's active jobs, newest first. With `limit`, returns just that many
 * plus the exact total; without it, pages through all of them.
 */
export async function fetchJobsByCompany(
  companyId: string,
  { excludeId, limit }: { excludeId?: string; limit?: number } = {}
): Promise<JobsPageResult> {
  const base = (withCount: boolean) => {
    let query = supabase
      .from('job_listings')
      .select(LIST_COLUMNS, withCount ? { count: 'exact' } : undefined)
      .eq('company_id', companyId);
    if (excludeId) query = query.neq('id', excludeId);
    return sorted(query, 'recent');
  };

  if (limit !== undefined) {
    const { data, error, count } = await base(true).range(0, limit - 1);
    if (error) fail('Failed to load company jobs', error);
    return { jobs: toJobs(data), total: count ?? 0 };
  }

  const jobs: Job[] = [];
  for (let from = 0; ; from += MAX_PAGE) {
    const { data, error } = await base(false).range(from, from + MAX_PAGE - 1);
    if (error) fail('Failed to load company jobs', error);
    const batch = toJobs(data);
    jobs.push(...batch);
    if (batch.length < MAX_PAGE) break;
  }
  return { jobs, total: jobs.length };
}

/** Active jobs for the given ids, returned in the order of `ids`. */
export async function fetchJobsByIds(ids: string[]): Promise<Job[]> {
  const unique = Array.from(new Set(ids));
  const byId = new Map<string, Job>();
  for (let i = 0; i < unique.length; i += ID_BATCH_SIZE) {
    const batch = unique.slice(i, i + ID_BATCH_SIZE);
    const { data, error } = await supabase.from('job_listings').select(LIST_COLUMNS).in('id', batch).order('id');
    if (error) fail('Failed to load saved jobs', error);
    for (const job of toJobs(data)) byId.set(job.id, job);
  }
  return unique.map((id) => byId.get(id)).filter((job): job is Job => job !== undefined);
}

/** Jobs sharing the experience level or job type, excluding the job itself. */
export async function fetchSimilarJobs(job: Job, limit = 3): Promise<Job[]> {
  const { data, error } = await sorted(
    supabase
      .from('job_listings')
      .select(LIST_COLUMNS)
      .neq('id', job.id)
      .or(`experience_level.eq."${job.experienceLevel}",job_type.eq."${job.jobType}"`),
    'recent'
  ).limit(limit);
  if (error) fail('Failed to load similar jobs', error);
  return toJobs(data);
}

/** Homepage featured jobs: the most recently posted. */
export async function fetchFeaturedJobs(limit = 6): Promise<Job[]> {
  const { data, error } = await sorted(supabase.from('job_listings').select(LIST_COLUMNS), 'recent').limit(limit);
  if (error) fail('Failed to load featured jobs', error);
  return toJobs(data);
}

/** Open-role count per company id. Companies with no active jobs are absent. */
export async function fetchCompanyJobCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (let from = 0; ; from += MAX_PAGE) {
    const { data, error } = await supabase
      .from('company_job_counts')
      .select('company_id, open_roles')
      .order('company_id')
      .range(from, from + MAX_PAGE - 1);
    if (error) fail('Failed to load company job counts', error);
    const rows = (data ?? []) as { company_id: string; open_roles: number }[];
    for (const row of rows) counts[row.company_id] = row.open_roles;
    if (rows.length < MAX_PAGE) break;
  }
  return counts;
}

/** Distinct job locations for the filter dropdown, sorted like before. */
export async function fetchJobLocations(): Promise<string[]> {
  const locations: string[] = [];
  for (let from = 0; ; from += MAX_PAGE) {
    const { data, error } = await supabase
      .from('job_locations')
      .select('location')
      .order('location')
      .range(from, from + MAX_PAGE - 1);
    if (error) fail('Failed to load job locations', error);
    const rows = (data ?? []) as { location: string }[];
    locations.push(...rows.map((r) => r.location));
    if (rows.length < MAX_PAGE) break;
  }
  // Same ordering as the previous client-side Array.prototype.sort().
  return locations.sort();
}
