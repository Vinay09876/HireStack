import React from 'react';
import { RotateCcw, Filter, MapPin, Building, Calendar, Layers, Award } from 'lucide-react';
import { ExperienceLevel, FilterState, JobType } from '../types';
import { mockCompanies } from '../data/mockData';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableLocations: string[];
  totalResultsCount: number;
  onReset: () => void;
  className?: string;
}

const allJobTypes: JobType[] = ['Full-time', 'Internship', 'Contract', 'Part-time'];
const allExpLevels: ExperienceLevel[] = ['Entry', 'Mid', 'Senior', 'Lead'];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  availableLocations,
  totalResultsCount,
  onReset,
  className = '',
}) => {
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, location: e.target.value });
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, company: e.target.value });
  };

  const handlePostedDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFilterChange({
      ...filters,
      postedWithinDays: val === 'all' ? 'all' : parseInt(val, 10),
    });
  };

  const handleJobTypeToggle = (type: JobType) => {
    const exists = filters.jobTypes.includes(type);
    const newTypes = exists
      ? filters.jobTypes.filter((t) => t !== type)
      : [...filters.jobTypes, type];
    onFilterChange({ ...filters, jobTypes: newTypes });
  };

  const handleExpLevelToggle = (level: ExperienceLevel) => {
    const exists = filters.experienceLevels.includes(level);
    const newLevels = exists
      ? filters.experienceLevels.filter((l) => l !== level)
      : [...filters.experienceLevels, level];
    onFilterChange({ ...filters, experienceLevels: newLevels });
  };

  const hasActiveFilters =
    filters.location !== '' ||
    filters.company !== '' ||
    filters.jobTypes.length > 0 ||
    filters.experienceLevels.length > 0 ||
    filters.postedWithinDays !== 'all' ||
    filters.searchQuery !== '';

  return (
    <div
      className={`bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            Filter Roles
          </h2>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset all
          </button>
        )}
      </div>

      <div className="space-y-6 pt-5">
        {/* Location Dropdown */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Location
          </label>
          <select
            value={filters.location}
            onChange={handleLocationChange}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="">All Locations & Remote</option>
            {availableLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Company Dropdown */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            Company
          </label>
          <select
            value={filters.company}
            onChange={handleCompanyChange}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="">All Top Tech Companies</option>
            {mockCompanies.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Job Type Checkboxes */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Job Type
          </label>
          <div className="space-y-2">
            {allJobTypes.map((type) => {
              const checked = filters.jobTypes.includes(type);
              return (
                <label
                  key={type}
                  className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none group"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleJobTypeToggle(type)}
                    className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/30 focus:ring-offset-0 bg-white dark:bg-slate-800 cursor-pointer"
                  />
                  <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {type}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Experience Level Checkboxes */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2.5">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            Experience Level
          </label>
          <div className="space-y-2">
            {allExpLevels.map((lvl) => {
              const checked = filters.experienceLevels.includes(lvl);
              return (
                <label
                  key={lvl}
                  className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none group"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleExpLevelToggle(lvl)}
                    className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/30 focus:ring-offset-0 bg-white dark:bg-slate-800 cursor-pointer"
                  />
                  <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {lvl} Level
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Posted Date Dropdown */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Date Posted
          </label>
          <select
            value={filters.postedWithinDays}
            onChange={handlePostedDateChange}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">Any time</option>
            <option value="1">Past 24 hours</option>
            <option value="7">Past week (7 days)</option>
            <option value="14">Past 2 weeks</option>
            <option value="30">Past month (30 days)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
