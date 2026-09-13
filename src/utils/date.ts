export function formatPostedDate(dateString: string): string {
  try {
    const posted = new Date(dateString);
    // Reference date using contemporary timestamp or relative
    const now = new Date('2026-09-13T00:00:00Z');
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Posted today';
    } else if (diffDays === 1) {
      return 'Posted 1 day ago';
    } else if (diffDays < 30) {
      return `Posted ${diffDays} days ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `Posted ${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
  } catch {
    return 'Posted recently';
  }
}

export function getDaysAgo(dateString: string): number {
  try {
    const posted = new Date(dateString);
    const now = new Date('2026-09-13T00:00:00Z');
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}
