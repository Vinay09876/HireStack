import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, DollarSign, Clock, Building, ArrowUpRight } from 'lucide-react';
import { Job } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { BookmarkButton } from './BookmarkButton';
import { ApplyButton } from './ApplyButton';
import { formatPostedDate } from '../utils/date';

interface JobCardProps {
  job: Job;
  variant?: 'grid' | 'list';
  showApplyButton?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  variant = 'list',
  showApplyButton = true,
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/jobs/${job.id}`);
  };

  const handleCompanyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/companies/${job.companyId}`);
  };

  const jobTypeBadgeColors: Record<string, string> = {
    'Full-time': 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    'Internship': 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    'Contract': 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
  };

  const expBadgeColors: Record<string, string> = {
    'Entry': 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    'Mid': 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
    'Senior': 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900',
    'Lead': 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
  };

  // GRID VARIANT (Used on Home featured, Dashboard, and Similar Jobs)
  if (variant === 'grid') {
    return (
      <div
        onClick={handleCardClick}
        className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700/70 transition-all duration-200 flex flex-col justify-between cursor-pointer"
      >
        <div>
          {/* Card Top Row */}
          <div className="flex items-start justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-3">
              <CompanyLogo src={job.companyLogo} name={job.companyName} size="md" />
              <div>
                <button
                  type="button"
                  onClick={handleCompanyClick}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline flex items-center gap-1 transition-colors"
                >
                  <Building className="w-3 h-3 opacity-70" />
                  {job.companyName}
                </button>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <Clock className="w-3 h-3 opacity-70" />
                  <span>{formatPostedDate(job.postedDate)}</span>
                </div>
              </div>
            </div>

            <BookmarkButton jobId={job.id} size="sm" />
          </div>

          {/* Job Title */}
          <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2">
            {job.title}
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {job.description}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                jobTypeBadgeColors[job.jobType] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {job.jobType}
            </span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                expBadgeColors[job.experienceLevel] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {job.experienceLevel}
            </span>
            {job.isRemote && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md border bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900">
                Remote
              </span>
            )}
          </div>
        </div>

        {/* Card Bottom Meta & Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{job.location}</span>
            </div>
            {job.salaryRange && (
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
                {job.salaryRange}
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            {showApplyButton ? (
              <ApplyButton url={job.applicationUrl} companyName={job.companyName} size="sm" />
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                View role <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // LIST VARIANT (Used on /jobs Listings Page)
  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 md:p-6 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700/70 transition-all duration-200 cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left info */}
        <div className="flex items-start gap-4 min-w-0">
          <CompanyLogo src={job.companyLogo} name={job.companyName} size="lg" className="shrink-0" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <button
                type="button"
                onClick={handleCompanyClick}
                className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 transition-colors"
              >
                {job.companyName}
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatPostedDate(job.postedDate)}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {job.title}
            </h3>

            {/* Meta Tags Row */}
            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600 dark:text-slate-400 mt-2">
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {job.location}
              </span>
              {job.salaryRange && (
                <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {job.salaryRange}
                </span>
              )}
              {job.department && (
                <span className="hidden md:inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {job.department}
                </span>
              )}
            </div>

            {/* Short Snippet */}
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-3 leading-relaxed">
              {job.description}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3.5">
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-lg border ${
                  jobTypeBadgeColors[job.jobType] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {job.jobType}
              </span>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-lg border ${
                  expBadgeColors[job.experienceLevel] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {job.experienceLevel} Level
              </span>
              {job.isRemote && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-lg border bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900">
                  Remote Eligible
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right action buttons */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <BookmarkButton jobId={job.id} size="md" />
            <ApplyButton url={job.applicationUrl} companyName={job.companyName} size="md" />
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block text-right">
            Direct company link
          </span>
        </div>
      </div>
    </div>
  );
};
