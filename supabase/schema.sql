-- HireStack database schema
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query)

-- ============================================================
-- companies
-- ============================================================
create table if not exists public.companies (
  id text primary key,
  name text not null,
  logo_url text,
  about text,
  website_url text,
  headquarters text,
  founded text,
  employees text,
  banner_gradient text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- jobs
-- ============================================================
create table if not exists public.jobs (
  id text primary key,
  title text not null,
  company_id text not null references public.companies(id) on delete cascade,
  location text not null,
  job_type text not null check (job_type in ('Full-time', 'Internship', 'Contract')),
  experience_level text not null check (experience_level in ('Entry', 'Mid', 'Senior', 'Lead')),
  description text not null,
  responsibilities text[] not null default '{}',
  requirements text[] not null default '{}',
  qualifications text[] default '{}',
  salary_range text,
  application_url text not null,
  source_url text,
  posted_date date not null default current_date,
  is_active boolean not null default true,
  department text,
  is_remote boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists jobs_company_id_idx on public.jobs(company_id);
create index if not exists jobs_posted_date_idx on public.jobs(posted_date desc);
create index if not exists jobs_is_active_idx on public.jobs(is_active);

-- ============================================================
-- profiles (one row per authenticated user, linked to auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  title text not null default '',
  preferred_roles text[] not null default '{}',
  preferred_locations text[] not null default '{}',
  bio text not null default '',
  notifications_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- saved_jobs (bookmarks, one row per user per job)
-- ============================================================
create table if not exists public.saved_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id text not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.profiles enable row level security;
alter table public.saved_jobs enable row level security;

-- companies & jobs: publicly readable (this is a public job board)
create policy "Companies are viewable by everyone"
  on public.companies for select
  using (true);

create policy "Jobs are viewable by everyone"
  on public.jobs for select
  using (true);

-- profiles: users can only read/update their own profile
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- saved_jobs: users can only manage their own bookmarks
create policy "Users can view their own saved jobs"
  on public.saved_jobs for select
  using (auth.uid() = user_id);

create policy "Users can save jobs for themselves"
  on public.saved_jobs for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own saved jobs"
  on public.saved_jobs for delete
  using (auth.uid() = user_id);
