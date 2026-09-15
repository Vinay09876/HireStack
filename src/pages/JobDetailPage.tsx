import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  ChevronLeft,
  Building,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Share2,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useJob } from '../context/JobContext';
import { CompanyLogo } from '../components/CompanyLogo';
import { ApplyButton } from '../components/ApplyButton';
import { BookmarkButton } from '../components/BookmarkButton';
import { JobCard } from '../components/JobCard';
import { formatPostedDate } from '../utils/date';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getJobById, getCompanyById, getJobsByCompany, jobs, loading, loadError, retryLoad } = useJob();

  const job = getJobById(id || '');

  // Scroll to top on id change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (loadError) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">{loadError}</p>
        <button
          type="button"
          onClick={retryLoad}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Loading job details...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
          <Briefcase className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Job listing not found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          The position you are looking for might have been filled or expired.
        </p>
        <Link
          to="/jobs"
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Browse All Available Jobs
        </Link>
      </div>
    );
  }

  const company = getCompanyById(job.companyId);

  // Other open roles at this company (excluding current job)
  const otherCompanyRoles = getJobsByCompany(job.companyId).filter((j) => j.id !== job.id);

  // Similar jobs: same category or experience level or other top tech companies
  const similarJobs = jobs
    .filter((j) => j.id !== job.id && (j.experienceLevel === job.experienceLevel || j.jobType === job.jobType))
    .slice(0, 3);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to listings</span>
          </button>
        </div>

        {/* TOP HERO HEADER CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <CompanyLogo src={job.companyLogo} name={job.companyName} size="xl" className="shadow-xs" />

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Link
                    to={`/companies/${job.companyId}`}
                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Building className="w-3.5 h-3.5" />
                    {job.companyName}
                  </Link>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatPostedDate(job.postedDate)}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                    Actively Hiring
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {job.title}
                </h1>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-600 dark:text-slate-400 mt-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {job.location}
                  </span>
                  {job.salaryRange && (
                    <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      {job.salaryRange}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    {job.jobType} ({job.experienceLevel} Level)
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons (prominent Apply Now & Bookmark) */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <BookmarkButton jobId={job.id} size="lg" showLabel={true} className="flex-1 sm:flex-initial" />
                <ApplyButton
                  url={job.applicationUrl}
                  companyName={job.companyName}
                  size="lg"
                  className="flex-1 sm:flex-initial shadow-md"
                />
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 justify-center">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified official portal
                </span>
                <button
                  type="button"
                  onClick={handleShare}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                >
                  <Share2 className="w-3 h-3" /> Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN BODY: 2 Columns (Content Left, Company Sidebar Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT: JOB SPECIFICATIONS */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview / Description */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Role Overview
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {job.description}
              </p>
            </div>

            {/* Responsibilities (only shown when the source provided a structured list) */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Key Responsibilities
                </h2>
                <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  {job.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Minimum Requirements (only shown when the source provided a structured list) */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                  Core Requirements
                </h2>
                <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-2" />
                      <span className="leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preferred Qualifications if present */}
            {job.qualifications && job.qualifications.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                  Preferred Qualifications
                </h2>
                <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  {job.qualifications.map((qual, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                      <span className="leading-relaxed">{qual}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* BOTTOM APPLY PROMPT */}
            <div className="bg-linear-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Ready to apply to {job.companyName}?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  You will be directed straight to {job.companyName}'s official ATS to submit your resume.
                </p>
              </div>
              <ApplyButton url={job.applicationUrl} companyName={job.companyName} size="lg" />
            </div>
          </div>

          {/* RIGHT SIDEBAR: COMPANY CARD & OTHER ROLES */}
          <div className="space-y-6">
            {/* Company Info Card */}
            {company && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs">
                <div className="flex items-center gap-3.5 mb-4">
                  <CompanyLogo src={company.logoUrl} name={company.name} size="lg" />
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {company.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {company.headquarters}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                  {company.about}
                </p>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Team Size:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{company.employees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Founded:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{company.founded}</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between gap-2">
                  <Link
                    to={`/companies/${company.id}`}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View Company Profile
                  </Link>

                  <a
                    href={company.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    <span>Careers Site</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Other open roles at this company */}
            {otherCompanyRoles.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center justify-between">
                  <span>Other roles at {job.companyName}</span>
                  <span className="text-xs font-normal text-slate-400">({otherCompanyRoles.length})</span>
                </h3>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1 -mr-1">
                  {otherCompanyRoles.slice(0, 50).map((role) => (
                    <Link
                      key={role.id}
                      to={`/jobs/${role.id}`}
                      className="group block p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                    >
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {role.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span>{role.location.split('(')[0]}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{role.jobType}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                {otherCompanyRoles.length > 50 && (
                  <Link
                    to={`/companies/${job.companyId}`}
                    className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>View all {otherCompanyRoles.length} roles</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SIMILAR JOBS SECTION (3 job cards) */}
        {similarJobs.length > 0 && (
          <div className="mt-16 pt-12 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Similar Positions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Explore relevant opportunities across other leading technology organizations
                </p>
              </div>

              <Link
                to="/jobs"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {similarJobs.map((simJob) => (
                <JobCard key={simJob.id} job={simJob} variant="grid" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
