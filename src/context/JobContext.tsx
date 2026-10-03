import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { fetchCompanyJobCounts } from '../lib/jobsApi';
import { Company, UserProfile, JobAlert } from '../types';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  title: string;
}

interface JobContextType {
  companies: Company[];
  // Active-job count per company id, and their sum. Jobs themselves are
  // queried per page via src/lib/jobsApi.ts.
  totalActiveJobs: number;
  getOpenRoleCount: (companyId: string) => number;
  loading: boolean;
  loadError: string | null;
  retryLoad: () => void;
  savedJobIds: string[];
  toggleSaveJob: (id: string) => void;
  isJobSaved: (id: string) => boolean;
  getCompanyById: (id: string) => Company | undefined;
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyJobCounts, setCompanyJobCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(emptyProfile);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [jobAlert, setJobAlert] = useState<JobAlert | null>(null);

  // Load companies + their open-role counts on mount (and whenever retryLoad()
  // is called). Both are small (one row per company); job rows themselves are
  // never loaded wholesale.
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
        const [{ data: companyRows, error: companyError }, counts] = await Promise.all([
          // Insertion order (the order companies were first scraped), made
          // deterministic with id as tie-breaker.
          supabase.from('companies').select('*').order('created_at').order('id'),
          fetchCompanyJobCounts(),
        ]);
        if (companyError) throw new Error(companyError.message);

        if (cancelled) return;

        setCompanies((companyRows || []).map(mapCompanyRow));
        setCompanyJobCounts(counts);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load companies:', err);
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
      // Most recently saved first (deterministic Dashboard order).
      supabase
        .from('saved_jobs')
        .select('job_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('job_id'),
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

  const getCompanyById = (id: string) => companies.find((c) => c.id === id);

  const getOpenRoleCount = (companyId: string) => companyJobCounts[companyId] ?? 0;

  const totalActiveJobs = useMemo(
    () => Object.values<number>(companyJobCounts).reduce((sum: number, n: number) => sum + n, 0),
    [companyJobCounts]
  );

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
        companies,
        totalActiveJobs,
        getOpenRoleCount,
        loading,
        loadError,
        retryLoad,
        savedJobIds,
        toggleSaveJob,
        isJobSaved,
        getCompanyById,
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
