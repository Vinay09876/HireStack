-- P0 migration 001: scraper columns
--
-- Apply manually in the Supabase SQL Editor BEFORE the updated scraper
-- (scripts/scraper/index.mjs + normalize.mjs) runs. The new scraper writes
-- posted_date = null and last_seen_at, and would fail without this.
--
-- Safe to apply while the CURRENT code is still deployed: the old scraper
-- always sends posted_date and never sends last_seen_at, and the frontend only
-- reads columns it already knows about.
--
-- RLS: no policy changes. jobs already has RLS enabled with a public SELECT
-- policy and no INSERT/UPDATE/DELETE policies, so last_seen_at becomes
-- publicly readable (a scrape timestamp, not sensitive) and remains writable
-- only by the service_role key used by the scraper.

begin;

-- 1. posted_date: unknown dates stay null instead of defaulting to today.
alter table public.jobs alter column posted_date drop not null;
alter table public.jobs alter column posted_date drop default;

-- 2. last_seen_at: set by each scraper run to its start time. Existing rows are
--    filled with now() (evaluated once), so jobs not seen in the next
--    successful run for their company are deactivated by that run.
alter table public.jobs
  add column if not exists last_seen_at timestamptz not null default now();

commit;

-- Rollback (only if the new scraper is NOT deployed - it requires both changes):
--   alter table public.jobs drop column if exists last_seen_at;
--   update public.jobs set posted_date = current_date where posted_date is null;
--   alter table public.jobs alter column posted_date set default current_date;
--   alter table public.jobs alter column posted_date set not null;
