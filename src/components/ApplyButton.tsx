import React from 'react';
import { ExternalLink } from 'lucide-react';

interface ApplyButtonProps {
  url: string;
  companyName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const ApplyButton: React.FC<ApplyButtonProps> = ({
  url,
  companyName,
  size = 'md',
  className = '',
  variant = 'primary',
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-medium gap-1.5 rounded-lg',
    md: 'px-4 py-2 text-sm font-medium gap-2 rounded-xl',
    lg: 'px-6 py-3 text-base font-semibold gap-2.5 rounded-xl',
  };

  const variantClasses = {
    primary:
      'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md hover:shadow-indigo-500/20 active:bg-indigo-800 transition-all duration-150',
    secondary:
      'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 dark:text-indigo-300 transition-colors',
    outline:
      'border border-indigo-300 dark:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 transition-colors',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={`Apply on ${companyName} careers site (opens in new tab)`}
      className={`inline-flex items-center justify-center font-medium transition-all group select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      title={`Redirect to ${companyName} official careers site`}
    >
      <span>Apply Now</span>
      <ExternalLink className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
    </a>
  );
};
