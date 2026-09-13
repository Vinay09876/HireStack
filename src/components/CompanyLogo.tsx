import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface CompanyLogoProps {
  src?: string;
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const colorMap: Record<string, { bg: string; text: string; label: string }> = {
  google: { bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-900', text: 'Google', label: 'G' },
  microsoft: { bg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200 dark:border-sky-900', text: 'Microsoft', label: 'MS' },
  amazon: { bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900', text: 'Amazon', label: 'A' },
  meta: { bg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900', text: 'Meta', label: 'M' },
  apple: { bg: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700', text: 'Apple', label: '' },
  netflix: { bg: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-900', text: 'Netflix', label: 'N' },
};

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  src,
  name,
  className = '',
  size = 'md',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs font-bold rounded-lg',
    md: 'w-11 h-11 text-sm font-bold rounded-xl',
    lg: 'w-14 h-14 text-base font-bold rounded-xl',
    xl: 'w-20 h-20 text-2xl font-bold rounded-2xl',
  };

  const key = name.toLowerCase();
  const theme = colorMap[key] || {
    bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    text: name,
    label: name.slice(0, 2).toUpperCase(),
  };

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center border shrink-0 transition-transform ${sizeClasses[size]} ${theme.bg} ${className}`}
        aria-label={`${name} logo`}
      >
        <span>{theme.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      <img
        src={src}
        alt={`${name} logo`}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
