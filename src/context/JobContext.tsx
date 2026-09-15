import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Company, Job, UserProfile, JobAlert } from '../types';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  title: string;
}

interface JobContextType {
  jobs: Job[];
  companies: Company[];
  loading: boolean;
  loadError: string | null;
  retryLoad: () => void;
  savedJobIds: string[];
  toggleSaveJob: (id: string) => void;
  isJobSaved: (id: string) => boolean;
  getSavedJobs: () => Job[];
  getJobById: (id: string) => Job | undefined;
  getCompanyById: (id: string) => Company | undefined;
  getJobsByCompany: (companyId: string) => Job[];
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  currentUser: AuthUser | null;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  logout: () => void;
  jobAlert: JobAlert | null;
  saveJobAlert: (alert: JobAlert) => Promise<{ error?: string }>;
}

const emptyProfile: UserProfile = {
  name: '',
  email: '',
  title: '',
  preferredRoles: [],
  preferredLocations: [],
  bio: '',
  notificationsEnabled: true,
};

function mapCompanyRow(row: any): Company {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    about: row.about,
    websiteUrl: row.website_url,
    headquarters: row.headquarters,
    founded: row.founded,
    employees: row.employees,
    bannerGradient: row.banner_gradient,
  };
}

function mapJobRow(row: any, companyById: Map<string, Company>): Job {
  const company = companyById.get(row.company_id);
  return {
    id: row.id,
    title: row.title,
    companyId: row.company_id,
    companyName: company?.name || row.company_id,
    companyLogo: company?.logoUrl || '',
    location: row.location,
    jobType: row.job_type,
    experienceLevel: row.experience_level,
    description: row.description,
    responsibilities: row.responsibilities || [],
    requirements: row.requirements || [],
    qualifications: row.qualifications || [],
    salaryRange: row.salary_range,
    applicationUrl: row.application_url,
    postedDate: row.posted_date,
    isActive: row.is_active,
    department: row.department,
    isRemote: row.is_remote,
  };
}

function mapProfileRow(row: any): UserProfile {
  return {
    name: row.name || '',
    email: row.email || '',
    title: row.title || '',
    preferredRoles: row.preferred_roles || [],
    preferredLocations: row.preferred_locations || [],
    bio: row.bio || '',
    notificationsEnabled: row.notifications_enabled ?? true,
  };
}

function mapJobAlertRow(row: any): JobAlert {
  return {
    role: row.role,
    skills: row.skills || [],
    experienceLevel: row.experience_level,
  };
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(emptyProfile);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [jobAlert, setJobAlert] = useState<JobAlert | null>(null);

  // Load public job/company data on mount (and whenever retryLoad() is called)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    // A hard ceiling so a hung request can never leave the UI stuck on a
    // loading spinner forever - surface a retryable error instead.
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        setLoadError('Loading is taking longer than expected. Please try again.');
        setLoading(false);
      }
    }, 20000);

    (async () => {
      try {
        const { data: companyRows, error: companyError } = await supabase.from('companies').select('*');
        if (companyError) throw new Error(companyError.message);

        // Supabase caps a single select() at 1000 rows, so page through
        // all active jobs rather than silently truncating the result.
        const PAGE_SIZE = 1000;
        const jobRows: any[] = [];
        for (let from = 0; ; from += PAGE_SIZE) {
          const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('is_active', true)
            .range(from, from + PAGE_SIZE - 1);
          if (error) throw new Error(error.message);
          jobRows.push(...(data || []));
          if (!data || data.length < PAGE_SIZE) break;
        }

        if (cancelled) return;

        const mappedCompanies = (companyRows || []).map(mapCompanyRow);
        const companyById = new Map(mappedCompanies.map((c) => [c.id, c]));
        const mappedJobs = jobRows.map((row) => mapJobRow(row, companyById));

        setCompanies(mappedCompanies);
        setJobs(mappedJobs);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load jobs/companies:', err);
        setLoadError(err instanceof Error ? err.message : 'Failed to load jobs.');
        setLoading(false);
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [reloadToken]);

  const retryLoad = useCallback(() => setReloadToken((t: number) => t + 1), []);

  // Load the user's saved jobs + profile whenever their session changes
  const loadUserData = useCallback(async (userId: string) => {
    const [{ data: savedRows }, { data: profileRow }, { data: alertRow }] = await Promise.all([
      supabase.from('saved_jobs').select('job_id').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('job_alerts').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    setSavedJobIds((savedRows || []).map((r: any) => r.job_id));
    if (profileRow) setUserProfile(mapProfileRow(profileRow));
    setJobAlert(alertRow ? mapJobAlertRow(alertRow) : null);
  }, []);

  // Auth session bootstrap + listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const user = session?.user;
    if (user) {
      setCurrentUser({
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        title: 'Tech Professional',
      });
      loadUserData(user.id);
    } else {
      setCurrentUser(null);
      setSavedJobIds([]);
      setUserProfile(emptyProfile);
      setJobAlert(null);
    }
  }, [session, loadUserData]);

  const toggleSaveJob = async (id: string) => {
    if (!currentUser) return;
    const isSaved = savedJobIds.includes(id);

    // Optimistic update
    setSavedJobIds((prev) => (isSaved ? prev.filter((item) => item !== id) : [...prev, id]));

    if (isSaved) {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('job_id', id);
      if (error) {
        console.error('Failed to unsave job:', error.message);
        setSavedJobIds((prev) => [...prev, id]);
      }
    } else {
      const { error } = await supabase
        .from('saved_jobs')
        .insert({ user_id: currentUser.id, job_id: id });
      if (error) {
        console.error('Failed to save job:', error.message);
        setSavedJobIds((prev) => prev.filter((item) => item !== id));
      }
    }
  };

  const isJobSaved = (id: string) => savedJobIds.includes(id);

  const getSavedJobs = () => jobs.filter((j) => savedJobIds.includes(j.id));

  const getJobById = (id: string) => jobs.find((j) => j.id === id);

  const getCompanyById = (id: string) => companies.find((c) => c.id === id);

  const getJobsByCompany = (companyId: string) =>
    jobs.filter((j) => j.companyId.toLowerCase() === companyId.toLowerCase());

  const updateUserProfile = async (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    setUserProfile((prev) => ({ ...prev, ...updated }));

    const { error } = await supabase
      .from('profiles')
      .update({
        ...(updated.name !== undefined && { name: updated.name }),
        ...(updated.email !== undefined && { email: updated.email }),
        ...(updated.title !== undefined && { title: updated.title }),
        ...(updated.preferredRoles !== undefined && { preferred_roles: updated.preferredRoles }),
        ...(updated.preferredLocations !== undefined && {
          preferred_locations: updated.preferredLocations,
        }),
        ...(updated.bio !== undefined && { bio: updated.bio }),
        ...(updated.notificationsEnabled !== undefined && {
          notifications_enabled: updated.notificationsEnabled,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentUser.id);

    if (error) console.error('Failed to update profile:', error.message);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    return { error: error?.message };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    return { error: error?.message };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return { error: error?.message };
  };

  const logout = () => {
    supabase.auth.signOut();
  };

  const saveJobAlert = async (alert: JobAlert) => {
    if (!currentUser) return { error: 'You must be logged in to save a job alert.' };

    const previous = jobAlert;
    setJobAlert(alert);

    const { error } = await supabase.from('job_alerts').upsert({
      user_id: currentUser.id,
      role: alert.role,
      skills: alert.skills,
      experience_level: alert.experienceLevel,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to save job alert:', error.message);
      setJobAlert(previous);
      return { error: error.message };
    }
    return {};
  };

  return (
    <JobContext.Provider
      value={{
        jobs,
        companies,
        loading,
        loadError,
        retryLoad,
        savedJobIds,
        toggleSaveJob,
        isJobSaved,
        getSavedJobs,
        getJobById,
        getCompanyById,
        getJobsByCompany,
        userProfile,
        updateUserProfile,
        currentUser,
        signUp,
        signIn,
        signInWithGoogle,
        resetPassword,
        logout,
        jobAlert,
        saveJobAlert,
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

export const useJob = (): JobContextType => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJob must be used within a JobProvider');
  }
  return context;
};
