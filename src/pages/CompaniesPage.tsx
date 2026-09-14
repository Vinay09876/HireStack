import React from 'react';
import { Building2, Sparkles } from 'lucide-react';
import { useJob } from '../context/JobContext';
import { CompanyCard } from '../components/CompanyCard';

export const CompaniesPage: React.FC = () => {
  const { companies, loading, loadError, retryLoad } = useJob();

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured Employers</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Top Tech Companies Hiring
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Browse company overviews, corporate culture, headquarters, and explore all active engineering and product roles with direct external application links.
          </p>
        </div>

        {loadError ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">{loadError}</p>
            <button
              type="button"
              onClick={retryLoad}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading companies...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
