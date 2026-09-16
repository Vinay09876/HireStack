# HireStack

A job search platform that brings together tech job listings from 60+ top companies (Google, Microsoft, Amazon, Meta, Wipro, TCS, Infosys, and many more) into one place. Instead of visiting dozens of company career pages one by one, users search and browse everything here — and when they click "Apply Now", they're sent straight to that company's own official career page to actually apply. HireStack never collects applications itself.

**Live site:** deployed on Vercel, connected to this repo's `main` branch.

## What's built

- **Job search & browsing** — search by keyword, filter by location, company, job type, and experience level, sort by recency/relevance, paginated listings.
- **Job detail pages** — full description, responsibilities, requirements, and qualifications where the source data provides them, with a direct "Apply Now" link to the real company page.
- **Company profiles** — company overview pages listing all of that company's open roles.
- **Authentication** — real email/password and Google OAuth sign-in via Supabase Auth (not mock/local storage).
- **Dashboard** — saved/bookmarked jobs and editable job preferences per user.
- **Job Alerts** *(built, currently disabled pending a custom domain — see below)* — users set a target role, skills, and experience level; a scheduled script matches new job postings against every user's saved preferences and emails a daily digest via Resend. Every job link in the email goes to HireStack's own job detail page first, never straight to the external company page.
- **Automated scraping** — a Node.js scraper (`scripts/scraper/`) pulls real, live job postings directly from each company's own careers API/ATS platform on a schedule (via GitHub Actions), filters to India-based roles, and upserts them into Supabase. Supports Greenhouse, Lever, SmartRecruiters, Workday, Oracle HCM, Eightfold, TurboHire, Zoho Recruit, Phenom/Job2Web, Darwinbox, and several company-specific custom APIs.
- **Real per-job descriptions** — for platforms whose list APIs don't expose a description (Workday, Oracle HCM, Eightfold, Phenom/Job2Web), the scraper does a second, targeted per-job request and parses the real HTML into Key Responsibilities / Requirements / Qualifications sections rather than showing a generic placeholder.

## Tech Stack

- **Frontend:** React 19, React Router v7, Tailwind CSS v4, Vite, TypeScript
- **Backend / Database:** Supabase (Postgres, Auth, Row Level Security)
- **Email:** Resend (for the job alerts digest, once a verified sending domain is set up)
- **Scraping:** Node.js scripts run on a schedule via GitHub Actions (`.github/workflows/scrape-jobs.yml`, `.github/workflows/send-job-alerts.yml`)
- **Hosting:** Vercel (frontend), Supabase (database/auth)

## Project structure

```
src/
  pages/        route-level pages (Home, Jobs, JobDetail, Companies, CompanyDetail, Auth, Dashboard, JobAlerts)
  components/   shared UI (Header, Footer, JobCard, FilterSidebar, ApplyButton, etc.)
  context/      JobContext (jobs/companies/auth/saved jobs/profile/job alerts) and ThemeContext
  lib/          Supabase client setup
  types.ts      shared TypeScript types

scripts/scraper/
  index.mjs         main scrape run: fetches every configured company, normalizes, upserts to Supabase
  platforms.mjs     one fetcher per ATS/platform (Greenhouse, Lever, Workday, Oracle HCM, etc.)
  normalize.mjs     India-location filtering, job type/experience-level inference, row shaping
  companies.json    the list of companies to scrape and their platform-specific config
  send-alerts.mjs   daily job-alert matching + email digest script

supabase/
  schema.sql    full database schema (companies, jobs, profiles, saved_jobs, job_alerts, job_alert_sent) + RLS policies
```

## Run locally

**Prerequisites:** Node.js, a Supabase project (for the database/auth to work)

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key.
3. Run the schema in your Supabase project's SQL Editor (`supabase/schema.sql`).
4. Start the dev server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` — start the frontend dev server
- `npm run build` — production build
- `npm run preview` — preview the production build locally
- `npm run lint` — TypeScript type-check

### Scraper (in `scripts/scraper/`)

- `node index.mjs` — run a full scrape of every company in `companies.json` and upsert results to Supabase
- `node send-alerts.mjs` — run the job-alert matching + email digest job once (needs `RESEND_API_KEY` set)

Both also run automatically on a schedule via GitHub Actions once the required repository secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `SITE_URL`) are configured.

## Known limitations

- A handful of companies (Samsung, Delhivery) fail to scrape due to platform-side access restrictions on their end, not a bug in this project.
- Job Alerts email delivery needs a verified sending domain in Resend to reach real users beyond the developer's own test account — it's fully built but disabled in the UI until a domain is purchased and verified.
- Most companies' job descriptions are real, scraped content; a small number of postings may still show a generic placeholder if the source company's own listing genuinely has no description text.
