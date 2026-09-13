import React from 'react';
import { Bookmark } from 'lucide-react';
import { useJob } from '../context/JobContext';

interface BookmarkButtonProps {
  jobId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  jobId,
  size = 'md',
  className = '',
  showLabel = false,
}) => {
  const { isJobSaved, toggleSaveJob } = useJob();
  const saved = isJobSaved(jobId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaveJob(jobId);
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
    lg: 'w-5 h-5',
  };

  const buttonPaddings = {
    sm: showLabel ? 'px-2.5 py-1 text-xs' : 'p-1.5',
    md: showLabel ? 'px-3.5 py-1.5 text-sm' : 'p-2',
    lg: showLabel ? 'px-4 py-2 text-base' : 'p-2.5',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? 'Remove from saved jobs' : 'Save this job'}
      title={saved ? 'Remove from saved jobs' : 'Save this job'}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl transition-all duration-150 border ${
        saved
          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80'
      } ${buttonPaddings[size]} ${className}`}
    >
      <Bookmark
        className={`${iconSizes[size]} transition-transform active:scale-125 ${
          saved ? 'fill-amber-500 text-amber-500' : ''
        }`}
      />
      {showLabel && (
        <span className="font-medium">
          {saved ? 'Saved' : 'Save Job'}
        </span>
      )}
    </button>
  );
};
