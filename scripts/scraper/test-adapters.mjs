import { fetchGreenhouse, fetchLever, fetchSmartRecruiters, fetchWorkday, fetchOracleHcm, fetchAmazonCustom, fetchUrbanCompanyCustom } from './platforms.mjs';
import { isIndiaJob, normalizeJob } from './normalize.mjs';

const tests = [
  { adapter: fetchGreenhouse, company: { id: 'razorpay', name: 'Razorpay', platform: 'greenhouse', platformId: 'razorpaysoftwareprivatelimited' } },
  { adapter: fetchLever, company: { id: 'cred', name: 'CRED', platform: 'lever', platformId: 'cred' } },
  { adapter: fetchSmartRecruiters, company: { id: 'zomato', name: 'Zomato', platform: 'smartrecruiters', platformId: 'Zomato1' } },
  { adapter: fetchWorkday, company: { id: 'browserstack', name: 'BrowserStack', platform: 'workday', platformId: 'browserstack', workdayHost: 'browserstack.wd3.myworkdayjobs.com', workdaySite: 'External' } },
  { adapter: fetchOracleHcm, company: { id: 'kpmg', name: 'KPMG', platform: 'oracle-hcm', platformId: 'ejgk.fa.em2.oraclecloud.com', siteNumber: 'CX_3001' } },
  { adapter: fetchAmazonCustom, company: { id: 'amazon', name: 'Amazon' } },
  { adapter: fetchUrbanCompanyCustom, company: { id: 'urbancompany', name: 'Urban Company' } },
];

for (const { adapter, company } of tests) {
  try {
    const raw = await adapter(company);
    const india = raw.filter(isIndiaJob);
    const normalized = india.slice(0, 2).map((j) => normalizeJob(company, j));
    console.log(`\n=== ${company.name} ===`);
    console.log(`total: ${raw.length}, india: ${india.length}`);
    console.log(JSON.stringify(normalized, null, 2));
  } catch (err) {
    console.log(`\n=== ${company.name} === FAILED: ${err.message}`);
  }
}
