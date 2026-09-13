const INDIA_HINTS = [
  'india', ' in)', ', in', '(in)',
  'bengaluru', 'bangalore', 'hyderabad', 'mumbai', 'pune', 'chennai',
  'gurugram', 'gurgaon', 'noida', 'delhi', 'kolkata', 'ahmedabad',
  'kochi', 'coimbatore', 'jaipur', 'vadodara', 'indore', 'chandigarh',
  'thiruvananthapuram', 'nagpur', 'visakhapatnam',
];

export function isIndiaJob(job) {
  if (job.countryHint) {
    const c = job.countryHint.toUpperCase();
    if (c === 'IN' || c === 'IND' || c === 'INDIA') return true;
    if (c.length <= 4) return false; // a confident non-India country code
  }
  const loc = (job.location || '').toLowerCase();
  return INDIA_HINTS.some((hint) => loc.includes(hint));
}

export function inferJobType(title) {
  const t = title.toLowerCase();
  if (/\bintern(ship)?\b/.test(t)) return 'Internship';
  if (/\bcontract(or)?\b|\btemporary\b|\bc2c\b/.test(t)) return 'Contract';
  return 'Full-time';
}

export function inferExperienceLevel(title) {
  const t = title.toLowerCase();
  if (/\bintern(ship)?\b|\bgraduate\b|\bnew grad\b|\bentry.level\b|\btrainee\b/.test(t)) return 'Entry';
  if (/\bprincipal\b|\bstaff\b|\blead\b|\bdirector\b|\bhead of\b|\bvp\b|\bvice president\b/.test(t)) return 'Lead';
  if (/\bsenior\b|\bsr\.?\b|\biii\b/.test(t)) return 'Senior';
  return 'Mid';
}

function cleanLocationString(raw) {
  return (raw || '').replace(/\s*,\s*/g, ', ').trim();
}

export function normalizeJob(company, raw) {
  const location = cleanLocationString(raw.location) || 'India';
  return {
    id: `${company.id}-${raw.externalId}`,
    title: raw.title,
    company_id: company.id,
    location,
    job_type: inferJobType(raw.title),
    experience_level: inferExperienceLevel(raw.title),
    description: raw.description || `${raw.title} at ${company.name}. Visit the official listing for full details.`,
    responsibilities: [],
    requirements: [],
    qualifications: [],
    salary_range: null,
    application_url: raw.applicationUrl,
    source_url: raw.applicationUrl,
    posted_date: raw.postedDate || new Date().toISOString().slice(0, 10),
    is_active: true,
    department: raw.department,
    is_remote: !!raw.isRemote,
  };
}
