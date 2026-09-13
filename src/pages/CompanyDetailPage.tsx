import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Users,
  ExternalLink,
  Briefcase,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useJob } from '../context/JobContext';
import { CompanyLogo } from '../components/CompanyLogo';
import { JobCard } from '../components/JobCard';

export const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCompanyById, getJobsByCompany, companies } = useJob();

  const company = getCompanyById(id || '');
  const openJobs = getJobsByCompany(id || '');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!company) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Company not found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          We couldn't locate the requested company profile.
        </p>
        <Link
          to="/companies"
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          View All Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* COMPANY HERO BANNER */}
      <div className={`h-48 md:h-64 w-full bg-linear-to-r ${company.bannerGradient} relative`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-start pt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-white text-xs font-medium backdrop-blur-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        {/* COMPANY PROFILE HEADER CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-start sm:items-end gap-5">
              <CompanyLogo
                src={company.logoUrl}
                name={company.name}
                size="xl"
                className="shadow-md -mt-10 sm:-mt-12 ring-4 ring-white dark:ring-slate-900 bg-white"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {company.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {company.headquarters}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {company.employees} employees
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Founded {company.founded}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={company.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs transition-colors"
              >
                <span>Official Careers Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* About Text */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              About {company.name}
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl">
              {company.about}
            </p>
          </div>
        </div>

        {/* OPEN JOBS LIST SECTION */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Open Positions at {company.name}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {openJobs.length} {openJobs.length === 1 ? 'role' : 'roles'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Apply directly to these positions via {company.name}'s official portal
              </p>
            </div>
          </div>

          {openJobs.length > 0 ? (
            <div className="space-y-4">
              {openJobs.map((job) => (
                <JobCard key={job.id} job={job} variant="list" />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No currently open jobs listed for {company.name}. Check back soon!
              </p>
            </div>
          )}
        </div>

        {/* OTHER TECH COMPANIES QUICK CAROUSEL */}
        <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Other Leading Employers
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {companies
              .filter((c) => c.id !== company.id)
              .map((c) => (
                <Link
                  key={c.id}
                  to={`/companies/${c.id}`}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 flex items-center gap-2.5 transition-all group"
                >
                  <CompanyLogo src={c.logoUrl} name={c.name} size="sm" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {c.name}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
