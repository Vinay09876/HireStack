-- P0 migration 003: clear fake posted_date values
--
-- Before Batch A, the scraper stored TODAY as posted_date whenever the source
-- gave no date, so these jobs looked newly posted forever. These 15 companies
-- are scraped from sources that NEVER provide a posting date (11 Workday,
-- UrbanCompany, Wipro + HCLTech on Phenom, AMD), so every non-null posted_date
-- on their rows was invented by the scraper. supabase/seed.sql contains no
-- rows for any of them.
--
-- WHEN - this is step 3 of the rollout and the order matters:
--   1. Apply 002.
--   2. Deploy Batches A + B + C together.
--   3. Apply 003 (this file) - ONLY after the new frontend is live. The old
--      frontend renders a null posted_date as a 1970 date ("Posted 680 months
--      ago") and the old scraper would write today's date straight back.
--   4. Run the scraper dry run (scripts/scraper/dry-run.mjs).
--   5. Review the deactivation numbers it reports.
--   6. Only then run the real scraper.
--
-- Effect after applying: these jobs show "Date not listed", sort after dated
-- jobs under "Most Recent", and are excluded while a "Date Posted" window
-- filter is active (shown again under "Any time").
--
-- RLS: no policy changes. Run as the SQL Editor's postgres role.
--
-- Rollback: there is intentionally none. The cleared values were fabricated
-- (the scrape date, not a posting date) and cannot be meaningfully restored.
-- If you need a safety net anyway, snapshot first:
--   create table public.jobs_posted_date_backup_003 as
--     select id, posted_date from public.jobs
--     where posted_date is not null and company_id in (<same list as below>);

-- ============================================================
-- PREVIEW (read-only - run first and review the numbers)
-- ============================================================
--   select company_id,
--          count(*) filter (where posted_date is not null) as rows_to_clear,
--          count(*) filter (where posted_date is not null and is_active) as active_rows_to_clear,
--          count(*) filter (where posted_date is null) as already_null
--   from public.jobs
--   where company_id in (
--     'browserstack', 'visa', 'mastercard', 'broadcom', 'samsung', 'intel',
--     'accenture', 'nvidia', 'salesforce', 'autodesk', 'pwc',
--     'urbancompany', 'wipro', 'hcltech', 'amd'
--   )
--   group by company_id
--   order by company_id;

begin;

update public.jobs
set posted_date = null
where posted_date is not null
  and company_id in (
    -- workday
    'browserstack', 'visa', 'mastercard', 'broadcom', 'samsung', 'intel',
    'accenture', 'nvidia', 'salesforce', 'autodesk', 'pwc',
    -- urbancompany-custom
    'urbancompany',
    -- phenom-jobstream
    'wipro', 'hcltech',
    -- amd-custom
    'amd'
  );

commit;

-- ============================================================
-- POST-APPLY VERIFICATION (read-only) - expect 0 rows
-- ============================================================
--   select company_id, count(*)
--   from public.jobs
--   where posted_date is not null
--     and company_id in (
--       'browserstack', 'visa', 'mastercard', 'broadcom', 'samsung', 'intel',
--       'accenture', 'nvidia', 'salesforce', 'autodesk', 'pwc',
--       'urbancompany', 'wipro', 'hcltech', 'amd'
--     )
--   group by company_id;
