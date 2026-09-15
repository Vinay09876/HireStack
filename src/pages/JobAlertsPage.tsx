import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Sparkles, X, CheckCircle2, Mail } from 'lucide-react';
import { useJob } from '../context/JobContext';
import { ExperienceLevel } from '../types';

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'Entry', label: 'Entry (0-2 years)' },
  { value: 'Mid', label: 'Mid (2-5 years)' },
  { value: 'Senior', label: 'Senior (5-9 years)' },
  { value: 'Lead', label: 'Lead (8+ years)' },
];

const SKILL_SUGGESTIONS = [
  'React.js',
  'Next.js',
  'Node.js',
  'TypeScript',
  'JavaScript',
  'Python',
  'Java',
  'Spring Boot',
  'AWS',
  'Docker',
  'Kubernetes',
  'SQL',
  'MongoDB',
  'GraphQL',
  'Angular',
  'Vue.js',
  'Go',
  'Rust',
  'CI/CD',
  'Machine Learning',
];

export const JobAlertsPage: React.FC = () => {
  const { currentUser, jobAlert, saveJobAlert } = useJob();

  const [role, setRole] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Mid');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (jobAlert) {
      setRole(jobAlert.role);
      setSkills(jobAlert.skills);
      setExperienceLevel(jobAlert.experienceLevel);
    }
  }, [jobAlert]);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const canSubmit = role.trim().length > 0 && skills.length >= 3 && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!role.trim()) {
      setError('Please enter a target role.');
      return;
    }
    if (skills.length < 3) {
      setError('Please add at least 3 skills so we can match you accurately.');
      return;
    }

    setSaving(true);
    const { error: saveError } = await saveJobAlert({
      role: role.trim(),
      skills,
      experienceLevel,
    });
    setSaving(false);

    if (saveError) {
      setError(saveError);
    } else {
      setSuccess(true);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-[70vh] bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-16 transition-colors">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-6 shadow-md">
            <Bell className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personalized Job Alerts</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Never miss a role that's right for you
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto mb-8">
            Tell us the role, skills, and experience level you're targeting. Every day, we'll scan
            newly posted openings from 60+ top tech companies and email you only the ones that
            genuinely match — no noise, no spam.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">Smart matching</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                We match on role, skills, and experience so you only see relevant openings.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Mail className="w-4.5 h-4.5" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">Daily digest</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                One clean email per day summarizing new matches — never a flood of individual pings.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Bell className="w-4.5 h-4.5" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">Free, always</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Set your preferences once and update them anytime from your dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link
              to="/signup"
              className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
            >
              Create free account
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 transition-colors">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <Bell className="w-3.5 h-3.5" />
            <span>Job Alerts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {jobAlert ? 'Update your alert preferences' : 'Set up your job alert'}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            We'll email <span className="font-semibold">{currentUser.email}</span> once a day with
            new openings that match what you're looking for.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6"
        >
          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Target Role
            </label>
            <input
              id="role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Frontend Developer"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 transition-colors"
            />
          </div>

          {/* Skills */}
          <div>
            <label htmlFor="skills" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Skills <span className="normal-case font-medium text-slate-400">(add at least 3)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                    className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              id="skills"
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillInputKeyDown}
              onBlur={() => skillInput.trim() && addSkill(skillInput)}
              placeholder="Type a skill and press Enter (e.g. React.js)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 transition-colors"
            />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {SKILL_SUGGESTIONS.filter(
                (s) => !skills.some((sk) => sk.toLowerCase() === s.toLowerCase())
              ).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addSkill(suggestion)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <label htmlFor="experience" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Experience Level
            </label>
            <select
              id="experience"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 transition-colors"
            >
              {EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Your job alert preferences are saved. We'll email you daily with new matches.
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-500 text-white rounded-xl shadow-xs transition-colors"
          >
            {saving ? 'Saving...' : jobAlert ? 'Update Alert Preferences' : 'Save Alert Preferences'}
          </button>
        </form>
      </div>
    </div>
  );
};
