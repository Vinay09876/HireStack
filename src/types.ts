export type JobType = 'Full-time' | 'Internship' | 'Contract';
export type ExperienceLevel = 'Entry' | 'Mid' | 'Senior' | 'Lead';

export interface Job {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  location: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  description: string;
  responsibilities: string[];
  requirements: string[];
  qualifications?: string[];
  salaryRange?: string | null;
  applicationUrl: string;
  postedDate: string; // ISO string or YYYY-MM-DD
  isActive: boolean;
  department?: string;
  isRemote?: boolean;
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string;
  about: string;
  websiteUrl: string;
  headquarters: string;
  founded: string;
  employees: string;
  bannerGradient: string;
}

export interface FilterState {
  searchQuery: string;
  location: string;
  company: string;
  jobTypes: JobType[];
  experienceLevels: ExperienceLevel[];
  postedWithinDays: number | 'all';
}

export interface UserProfile {
  name: string;
  email: string;
  title: string;
  preferredRoles: string[];
  preferredLocations: string[];
  bio: string;
  notificationsEnabled: boolean;
}

export interface JobAlert {
  role: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
}
