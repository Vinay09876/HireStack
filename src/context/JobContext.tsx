import React, { createContext, useContext, useEffect, useState } from 'react';
import { mockCompanies, mockJobs } from '../data/mockData';
import { Company, Job, UserProfile } from '../types';

interface AuthUser {
  name: string;
  email: string;
  title: string;
  avatarUrl?: string;
}

interface JobContextType {
  jobs: Job[];
  companies: Company[];
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
  login: (email: string, name?: string) => void;
  logout: () => void;
}

const defaultProfile: UserProfile = {
  name: 'Vinay Ippalayala',
  email: 'vinay.ippalayala@hirestack.dev',
  title: 'Senior Software Engineer',
  preferredRoles: ['Software Engineer', 'Frontend Developer', 'Distributed Systems'],
  preferredLocations: ['Mountain View, CA', 'San Francisco, CA', 'Remote'],
  bio: 'Passionate full-stack & distributed systems engineer looking for high-impact roles at top-tier tech engineering teams.',
  notificationsEnabled: true,
};

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs] = useState<Job[]>(mockJobs);
  const [companies] = useState<Company[]>(mockCompanies);

  // Initialize saved jobs from localStorage (empty by default for a new visitor)
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hirestack_saved_ids');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hirestack_profile');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return defaultProfile;
        }
      }
    }
    return defaultProfile;
  });

  // Auth User (starts logged out; login() sets this after a real sign-in)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hirestack_auth');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem('hirestack_saved_ids', JSON.stringify(savedJobIds));
  }, [savedJobIds]);

  useEffect(() => {
    localStorage.setItem('hirestack_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hirestack_auth', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('hirestack_auth');
    }
  }, [currentUser]);

  const toggleSaveJob = (id: string) => {
    setSavedJobIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isJobSaved = (id: string) => savedJobIds.includes(id);

  const getSavedJobs = () => {
    return jobs.filter((j) => savedJobIds.includes(j.id));
  };

  const getJobById = (id: string) => jobs.find((j) => j.id === id);

  const getCompanyById = (id: string) => companies.find((c) => c.id === id);

  const getJobsByCompany = (companyId: string) =>
    jobs.filter((j) => j.companyId.toLowerCase() === companyId.toLowerCase());

  const updateUserProfile = (updated: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updated };
      if (currentUser && (updated.name || updated.email || updated.title)) {
        setCurrentUser((u) => u ? {
          ...u,
          name: updated.name || u.name,
          email: updated.email || u.email,
          title: updated.title || u.title
        } : null);
      }
      return next;
    });
  };

  const login = (email: string, name?: string) => {
    const formattedName = name || email.split('@')[0].replace('.', ' ').replace(/^./, (str) => str.toUpperCase());
    const user: AuthUser = {
      name: formattedName,
      email,
      title: 'Tech Professional',
    };
    setCurrentUser(user);
    updateUserProfile({ name: user.name, email: user.email });
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <JobContext.Provider
      value={{
        jobs,
        companies,
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
        login,
        logout,
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
