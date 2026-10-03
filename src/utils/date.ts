const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Days since the Unix epoch for a calendar date, independent of timezone and
// DST (Date.UTC never shifts), so differences are always whole days.
function epochDay(year: number, monthIndex: number, day: number): number {
  return Date.UTC(year, monthIndex, day) / MS_PER_DAY;
}

// posted_date is a Postgres `date` ("YYYY-MM-DD"): a calendar day with no time
// or timezone. It must not go through `new Date("YYYY-MM-DD")`, which treats it
// as UTC midnight and shifts it to the previous day west of UTC.
function postedEpochDay(dateString: string): number | null {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return epochDay(Number(y), Number(m) - 1, Number(d));
  }
  // Full timestamps: use the calendar day they fall on in the user's timezone.
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return null;
  return epochDay(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/**
 * Calendar days between the posted date and today in the user's local
 * timezone: 0 = today, 1 = yesterday, negative = a future date.
 * Returns null when the posted date is unknown or unparseable.
 */
export function getDaysAgo(dateString: string | null, now: Date = new Date()): number | null {
  if (!dateString) return null;
  const posted = postedEpochDay(dateString);
  if (posted === null) return null;
  const today = epochDay(now.getFullYear(), now.getMonth(), now.getDate());
  return today - posted;
}

export function formatPostedDate(dateString: string | null, now: Date = new Date()): string {
  const diffDays = getDaysAgo(dateString, now);

  if (diffDays === null) {
    return 'Date not listed';
  } else if (diffDays <= 0) {
    // Future dates (source timezone skew or bad data) read as today rather
    // than being flipped into the past.
    return 'Posted today';
  } else if (diffDays === 1) {
    return 'Posted 1 day ago';
  } else if (diffDays < 30) {
    return `Posted ${diffDays} days ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `Posted ${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
}
