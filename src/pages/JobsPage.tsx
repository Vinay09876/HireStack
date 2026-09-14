import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
  X,
  Briefcase,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import { useJob } from '../context/JobContext';
import { ExperienceLevel, FilterState, Job, JobType } from '../types';
import { JobCard } from '../components/JobCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { getDaysAgo } from '../utils/date';

const ITEMS_PER_PAGE = 20;

type SortOption = 'recent' | 'relevance';

export const JobsPage: React.FC = () => {
  const { jobs, loading, loadError, retryLoad } = useJob();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mobile filters drawer open state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Initial filter state derived from URL search params
  const [filters, setFilters] = useState<FilterState>(() => {
    const q = searchParams.get('q') || '';
    const loc = searchParams.get('loc') || '';
    const company = searchParams.get('company') || '';
    const typeParam = searchParams.get('type');
    const expParam = searchParams.get('exp');

    const jobTypes: JobType[] = typeParam ? [typeParam as JobType] : [];
    const experienceLevels: ExperienceLevel[] = expParam ? [expParam as ExperienceLevel] : [];

    return {
      searchQuery: q,
      location: loc,
      company: company,
      jobTypes,
      experienceLevels,
      postedWithinDays: 'all',
    };
  });

  // Sync URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.searchQuery) params.set('q', filters.searchQuery);
    if (filters.location) params.set('loc', filters.location);
    if (filters.company) params.set('company', filters.company);
    if (filters.jobTypes.length === 1) params.set('type', filters.jobTypes[0]);
    if (filters.experienceLevels.length === 1) params.set('exp', filters.experienceLevels[0]);

    setSearchParams(params, { replace: true });
    setCurrentPage(1); // Reset to page 1 on filter changes
  }, [filters, setSearchParams]);

  // Extract distinct locations for dropdown
  const availableLocations = useMemo(() => {
    const locs = Array.from(new Set(jobs.map((j) => j.location.split('(')[0].trim())));
    return locs.sort();
  }, [jobs]);

  // Extract distinct companies (that actually have jobs) for dropdown
  const availableCompanies = useMemo(() => {
    const names = Array.from(new Set(jobs.map((j) => j.companyName)));
    return names.sort();
  }, [jobs]);

  // Filter logic
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Keyword search (title, company, description, requirements)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesCompany = job.companyName.toLowerCase().includes(query);
        const matchesDesc = job.description.toLowerCase().includes(query);
        const matchesReqs = job.requirements.some((r) => r.toLowerCase().includes(query));
        const matchesDept = job.department?.toLowerCase().includes(query);

        if (!matchesTitle && !matchesCompany && !matchesDesc && !matchesReqs && !matchesDept) {
          return false;
        }
      }

      // Location match
      if (filters.location) {
        const queryLoc = filters.location.toLowerCase();
        if (!job.location.toLowerCase().includes(queryLoc)) {
          return false;
        }
      }

      // Company match
      if (filters.company) {
        if (job.companyName.toLowerCase() !== filters.company.toLowerCase()) {
          return false;
        }
      }

      // Job type
      if (filters.jobTypes.length > 0) {
        if (!filters.jobTypes.includes(job.jobType)) {
          return false;
        }
      }

      // Experience level
      if (filters.experienceLevels.length > 0) {
        if (!filters.experienceLevels.includes(job.experienceLevel)) {
          return false;
        }
      }

      // Posted date
      if (filters.postedWithinDays !== 'all') {
        const days = getDaysAgo(job.postedDate);
        if (days > filters.postedWithinDays) {
          return false;
        }
      }

      return true;
    });
  }, [jobs, filters]);

  // Sorting logic
  const sortedJobs = useMemo(() => {
    const list = [...filteredJobs];
    if (sortBy === 'recent') {
      list.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    }
    // 'relevance' keeps default search ranking
    return list;
  }, [filteredJobs, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedJobs.length / ITEMS_PER_PAGE) || 1;
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedJobs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedJobs, currentPage]);

  // Windowed page list: first page, last page, current page ± 1, with
  // '...' gaps elsewhere, so the pagination bar stays a fixed, wrappable width
  // regardless of how many total pages exist.
  const paginationItems = useMemo(() => {
    const items: (number | 'ellipsis')[] = [];
    const addPage = (p: number) => items.push(p);

    addPage(1);
    if (currentPage > 3) items.push('ellipsis');

    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
      addPage(p);
    }

    if (currentPage < totalPages - 2) items.push('ellipsis');
    if (totalPages > 1) addPage(totalPages);

    return items;
  }, [currentPage, totalPages]);

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      location: '',
      company: '',
      jobTypes: [],
      experienceLevels: [],
      postedWithinDays: 'all',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search & Top Bar */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Tech Job Listings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Showing {sortedJobs.length} active opportunities across top tech engineering teams
              </p>
            </div>

            {/* Keyword Quick Input */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  placeholder="Filter by keyword..."
                  className="w-full text-xs pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-slate-100"
                />
                {filters.searchQuery && (
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, searchQuery: '' })}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: Left Sidebar + Right Listings Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* DESKTOP FILTER SIDEBAR */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilters}
              availableLocations={availableLocations}
              availableCompanies={availableCompanies}
              totalResultsCount={sortedJobs.length}
              onReset={handleResetFilters}
            />
          </div>

          {/* RIGHT JOB LISTINGS MAIN AREA */}
          <div className="lg:col-span-3 space-y-4">
            {/* Sort Dropdown & Quick Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Found <span className="font-semibold text-slate-900 dark:text-white">{sortedJobs.length}</span> positions
                {filters.company && <span> at <strong className="text-indigo-600 dark:text-indigo-400">{filters.company}</strong></span>}
                {filters.location && <span> in <strong>{filters.location}</strong></span>}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" /> Sort by:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 cursor-pointer font-medium"
                >
                  <option value="recent">Most Recent</option>
                  <option value="relevance">Relevance</option>
                </select>
              </div>
            </div>

            {/* List of Job Cards */}
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
                Loading jobs...
              </div>
            ) : paginatedJobs.length > 0 ? (
              <div className="space-y-3.5">
                {paginatedJobs.map((job) => (
                  <JobCard key={job.id} job={job} variant="list" />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  No matching jobs found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4 leading-relaxed">
                  We couldn't find any positions matching your specific criteria. Try broadening your search or resetting applied filters.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  Reset all filters
                </button>
              </div>
            )}

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex flex-wrap items-center justify-center gap-1">
                  {paginationItems.map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 dark:text-slate-600"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item)}
                        className={`w-8 h-8 shrink-0 rounded-xl text-xs font-semibold transition-colors ${
                          currentPage === item
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE FILTER MODAL DRAWER */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white dark:bg-slate-900 h-full p-5 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Filters
                </span>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <FilterSidebar
                filters={filters}
                onFilterChange={setFilters}
                availableLocations={availableLocations}
                availableCompanies={availableCompanies}
                totalResultsCount={sortedJobs.length}
                onReset={handleResetFilters}
                className="border-0 shadow-none p-0"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-6">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Apply Filters ({sortedJobs.length} results)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
