import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Bookmark,
  User,
  Briefcase,
  MapPin,
  Mail,
  Check,
  Building2,
  Trash2,
  ArrowRight,
  Sparkles,
  Search,
} from 'lucide-react';
import { useJob } from '../context/JobContext';
import { JobCard } from '../components/JobCard';
import { UserProfile } from '../types';

export const DashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getSavedJobs, savedJobIds, userProfile, updateUserProfile, currentUser } = useJob();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'saved' | 'profile'>(
    tabParam === 'profile' ? 'profile' : 'saved'
  );

  // Sync tab with search params
  useEffect(() => {
    if (tabParam === 'profile' || tabParam === 'saved') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'saved' | 'profile') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Profile Form state
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [preferredRoleInput, setPreferredRoleInput] = useState('');
  const [preferredLocInput, setPreferredLocInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFormData(userProfile);
  }, [userProfile]);

  const savedJobsList = getSavedJobs();

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleAddRole = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
    e.preventDefault();
    if (preferredRoleInput.trim() && !formData.preferredRoles.includes(preferredRoleInput.trim())) {
      setFormData({
        ...formData,
        preferredRoles: [...formData.preferredRoles, preferredRoleInput.trim()],
      });
      setPreferredRoleInput('');
    }
  };

  const handleRemoveRole = (role: string) => {
    setFormData({
      ...formData,
      preferredRoles: formData.preferredRoles.filter((r) => r !== role),
    });
  };

  const handleAddLocation = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
    e.preventDefault();
    if (preferredLocInput.trim() && !formData.preferredLocations.includes(preferredLocInput.trim())) {
      setFormData({
        ...formData,
        preferredLocations: [...formData.preferredLocations, preferredLocInput.trim()],
      });
      setPreferredLocInput('');
    }
  };

  const handleRemoveLocation = (loc: string) => {
    setFormData({
      ...formData,
      preferredLocations: formData.preferredLocations.filter((l) => l !== loc),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* User Hero Greeting */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-xs">
              {(currentUser?.name || userProfile.name).charAt(0)}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {currentUser?.name || userProfile.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>{userProfile.title}</span>
                <span>•</span>
                <span>{userProfile.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Explore More Jobs</span>
            </Link>
          </div>
        </div>

        {/* 2 COLUMNS: LEFT SIDEBAR TABS + RIGHT CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* LEFT SIDEBAR NAVIGATION */}
          <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 shadow-xs space-y-1">
            <button
              type="button"
              onClick={() => handleTabChange('saved')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'saved'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-4 h-4" />
                <span>Saved Jobs</span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'saved'
                    ? 'bg-indigo-700/80 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {savedJobIds.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('profile')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile & Preferences</span>
            </button>
          </div>

          {/* RIGHT CONTENT TAB PANEL */}
          <div className="md:col-span-3">
            {activeTab === 'saved' ? (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Bookmark className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Bookmarked Opportunities</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Jobs you have pinned to review and submit external applications for.
                    </p>
                  </div>
                </div>

                {savedJobsList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedJobsList.map((job) => (
                      <JobCard key={job.id} job={job} variant="grid" />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                      <Bookmark className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                      No saved jobs yet
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4 leading-relaxed">
                      Click the bookmark icon on any job card to save it here for later reference.
                    </p>
                    <Link
                      to="/jobs"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Browse Openings</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              /* PROFILE & PREFERENCES TAB */
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
                <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Candidate Profile & Preferences
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Customize your career target roles and preferred working locations.
                  </p>
                </div>

                {saveSuccess && (
                  <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Your preferences have been saved successfully!</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Professional Headline
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Senior Software Engineer / Distributed Systems"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  {/* Preferred Job Roles */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Preferred Job Roles & Skills
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.preferredRoles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                        >
                          <span>{role}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRole(role)}
                            className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={preferredRoleInput}
                        onChange={(e) => setPreferredRoleInput(e.target.value)}
                        onKeyDown={handleAddRole}
                        placeholder="Add role (e.g. DevOps Engineer, Machine Learning)..."
                        className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <button
                        type="button"
                        onClick={handleAddRole}
                        className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Preferred Locations */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Preferred Locations
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.preferredLocations.map((loc) => (
                        <span
                          key={loc}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          <span>{loc}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLocation(loc)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={preferredLocInput}
                        onChange={(e) => setPreferredLocInput(e.target.value)}
                        onKeyDown={handleAddLocation}
                        placeholder="Add location (e.g. Seattle, WA, Remote)..."
                        className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <button
                        type="button"
                        onClick={handleAddLocation}
                        className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Short Bio / Note
                    </label>
                    <textarea
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Profile Preferences</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
