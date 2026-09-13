import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Building2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useJob } from '../context/JobContext';
import { JobCard } from '../components/JobCard';
import { CompanyLogo } from '../components/CompanyLogo';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { jobs, companies, loading } = useJob();

  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (location.trim()) params.set('loc', location.trim());
    navigate(`/jobs?${params.toString()}`);
  };

  const handleChipClick = (paramKey: string, paramValue: string) => {
    const params = new URLSearchParams();
    params.set(paramKey, paramValue);
    navigate(`/jobs?${params.toString()}`);
  };

  // 6 featured jobs across diverse companies and disciplines
  const featuredJobs = jobs.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/70 dark:border-slate-800/80 bg-linear-to-b from-indigo-50/40 via-white to-slate-50/50 dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950">
        {/* Subtle decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Direct Tech Career Aggregator</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Land Your Next Role at <span className="text-indigo-600 dark:text-indigo-400">Top Tech Giants</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Explore verified engineering, AI, product, and infrastructure openings from Amazon, Netflix, NVIDIA, Accenture, and other top employers. Apply directly on their official portals.
            </p>
          </div>

          {/* SEARCH BAR CARD */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-indigo-500/5 border border-slate-200/90 dark:border-slate-800 p-2.5 sm:p-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch gap-2">
              {/* Job Title / Keyword input */}
              <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-transparent focus-within:border-indigo-400 dark:focus-within:border-indigo-600 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
                <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Job title, skills (e.g. Software Engineer, React, AI)..."
                  className="w-full text-sm bg-transparent placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Location input */}
              <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-transparent focus-within:border-indigo-400 dark:focus-within:border-indigo-600 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
                <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State, or 'Remote'..."
                  className="w-full text-sm bg-transparent placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Search Submit Button */}
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Find Jobs</span>
              </button>
            </form>
          </div>

          {/* FILTER CHIP ROW BELOW HERO */}
          <div className="max-w-4xl mx-auto mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Trending filters:</span>

            <button
              type="button"
              onClick={() => handleChipClick('type', 'Full-time')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              Full-time Roles
            </button>

            <button
              type="button"
              onClick={() => handleChipClick('type', 'Internship')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              🎓 Student Internships
            </button>

            <button
              type="button"
              onClick={() => handleChipClick('loc', 'Remote')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              🌐 Remote Eligible
            </button>

            <button
              type="button"
              onClick={() => handleChipClick('exp', 'Senior')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              Senior & Staff
            </button>

            <button
              type="button"
              onClick={() => handleChipClick('company', 'Amazon')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              Amazon
            </button>

            <button
              type="button"
              onClick={() => handleChipClick('company', 'Netflix')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              Netflix
            </button>
          </div>
        </div>
      </section>

      {/* TOP COMPANIES LOGO STRIP SECTION */}
      <section className="py-12 bg-white dark:bg-slate-900/50 border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Top Hiring Companies
              </h2>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Aggregated official listings from tier-one technology leaders
              </p>
            </div>

            <Link
              to="/companies"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>View all company profiles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            {companies.map((company) => (
              <Link
                key={company.id}
                to={`/companies/${company.id}`}
                className="group flex flex-col items-center p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs transition-all text-center"
              >
                <CompanyLogo
                  src={company.logoUrl}
                  name={company.name}
                  size="md"
                  className="mb-2 group-hover:scale-105 transition-transform"
                />
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {company.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {jobs.filter((j) => j.companyId === company.id).length} open roles
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED JOBS GRID SECTION (3 columns desktop, 1 column mobile) */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Handpicked Openings</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Featured Opportunities
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Top prioritized engineering, research, and product positions this week
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs transition-all"
          >
            <span>Explore all {jobs.length} roles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Columns Desktop, 1 Column Mobile */}
        {loading ? (
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-12">
            Loading jobs...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} variant="grid" />
            ))}
          </div>
        )}
      </section>

      {/* DIRECT REDIRECT ASSURANCE BANNER */}
      <section className="py-12 bg-indigo-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-800/80 flex items-center justify-center shrink-0 text-indigo-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Direct Company Application</h4>
                <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                  Every "Apply Now" button links straight to the employer’s authentic ATS/career page.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-800/80 flex items-center justify-center shrink-0 text-indigo-200">
                <ShieldCheck className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">No Intermediaries or Spam</h4>
                <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                  Zero third-party recruiter spam or ghost listings. We only index recognized tech companies.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-800/80 flex items-center justify-center shrink-0 text-indigo-200">
                <Building2 className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Real-time Role Bookmarking</h4>
                <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                  Save roles locally across sessions and track your targeted application pipeline with ease.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
