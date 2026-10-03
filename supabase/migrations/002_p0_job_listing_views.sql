-- P0 migration 002: read-only views for database-side job listing queries
--
-- WHEN: apply manually in the Supabase SQL Editor BEFORE deploying the Batch C
-- frontend (src/lib/jobsApi.ts). Purely additive: the currently deployed
-- frontend never queries these views, so applying this early is safe.
--
-- Full rollout order (see also 003):
--   1. Apply 002 (this file).
--   2. Deploy Batches A + B + C together.
--   3. Apply 003 only after the new frontend is live.
--   4. Run the scraper dry run (scripts/scraper/dry-run.mjs).
--   5. Review the deactivation numbers it reports.
--   6. Only then run the real scraper.
--
-- RLS / ACCESS MODEL
-- ------------------
-- * No table, column, policy or RLS setting is changed.
-- * Every view is created WITH (security_invoker = true): queries through the
--   view run with the CALLER's privileges, so the existing RLS policies on
--   public.jobs and public.companies are evaluated exactly as for a direct
--   table query. (A default view runs as its owner - `postgres`, which
--   bypasses RLS - which is why security_invoker is required here.)
-- * Requires Postgres 15+. On an older server this migration fails with an
--   error instead of silently creating an RLS-bypassing view.
-- * The views only NARROW what is already readable: active jobs only, and only
--   columns that are already publicly selectable on jobs/companies.
-- * Grants are explicit: everything is revoked, then only SELECT is granted to
--   anon and authenticated. None of the views is updatable (join / GROUP BY /
--   DISTINCT), and with security_invoker any write would still hit RLS on
--   public.jobs, which has no INSERT/UPDATE/DELETE policies.

-- ============================================================
-- PRE-FLIGHT CHECKS (read-only - run these first and review)
-- ============================================================
-- Postgres version must be 15 or later:
--   show server_version;
--
-- RLS must be enabled on both underlying tables (expect relrowsecurity = true):
--   select relname, relrowsecurity, relforcerowsecurity
--   from pg_class
--   where oid in ('public.jobs'::regclass, 'public.companies'::regclass);
--
-- Existing policies (expect exactly one SELECT policy each, qual = true, and
-- no INSERT/UPDATE/DELETE/ALL policies):
--   select tablename, policyname, cmd, roles, qual, with_check
--   from pg_policies
--   where schemaname = 'public' and tablename in ('jobs', 'companies')
--   order by tablename, policyname;

begin;

-- Active jobs joined to their company's display fields, plus a lowercase
-- search_text covering every field the keyword search matches: title,
-- company name, description, requirements, department. Fields are joined
-- with newlines, which a single-line search box can never contain, so a
-- search can't match across two fields.
create view public.job_listings
with (security_invoker = true) as
select
  j.id,
  j.title,
  j.company_id,
  coalesce(c.name, j.company_id) as company_name,
  coalesce(c.logo_url, '') as company_logo,
  j.location,
  j.job_type,
  j.experience_level,
  j.description,
  j.responsibilities,
  j.requirements,
  j.qualifications,
  j.salary_range,
  j.application_url,
  j.posted_date,
  j.department,
  j.is_remote,
  j.created_at,
  lower(concat_ws(
    E'\n',
    j.title,
    coalesce(c.name, j.company_id),
    j.description,
    array_to_string(j.requirements, E'\n'),
    j.department
  )) as search_text
from public.jobs j
left join public.companies c on c.id = j.company_id
where j.is_active;

-- Open-role count per company (company cards, homepage, company filter).
create view public.company_job_counts
with (security_invoker = true) as
select company_id, count(*)::int as open_roles
from public.jobs
where is_active
group by company_id;

-- Distinct location options for the Jobs page dropdown. Mirrors the previous
-- client-side `location.split('(')[0].trim()`.
create view public.job_locations
with (security_invoker = true) as
select distinct btrim(split_part(location, '(', 1)) as location
from public.jobs
where is_active;

revoke all on public.job_listings, public.company_job_counts, public.job_locations
  from public, anon, authenticated;
grant select on public.job_listings, public.company_job_counts, public.job_locations
  to anon, authenticated;

commit;

-- ============================================================
-- POST-APPLY VERIFICATION (read-only)
-- ============================================================
-- Every view must report security_invoker=true:
--   select c.relname, c.reloptions
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public'
--     and c.relname in ('job_listings', 'company_job_counts', 'job_locations');
--
-- anon/authenticated must have SELECT only (no INSERT/UPDATE/DELETE/TRUNCATE/
-- REFERENCES/TRIGGER):
--   select table_name, grantee, privilege_type
--   from information_schema.role_table_grants
--   where table_schema = 'public'
--     and table_name in ('job_listings', 'company_job_counts', 'job_locations')
--     and grantee in ('anon', 'authenticated', 'PUBLIC')
--   order by table_name, grantee, privilege_type;
--
-- Policies on jobs/companies unchanged (re-run the pre-flight pg_policies query
-- and compare).
--
-- Sanity: view counts match the base table
--   select (select count(*) from public.jobs where is_active) as active_jobs,
--          (select count(*) from public.job_listings) as listed,
--          (select sum(open_roles) from public.company_job_counts) as counted;

-- Rollback (only if the Batch C frontend is NOT deployed - it depends on these):
--   drop view if exists public.job_locations;
--   drop view if exists public.company_job_counts;
--   drop view if exists public.job_listings;
