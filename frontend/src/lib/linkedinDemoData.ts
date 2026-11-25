/**
 * Sample LinkedIn data for the workspace's LinkedIn tab, which previews the
 * integration before it exists (it's labelled as sample in the UI). Shaped
 * after what the LinkedIn Pages and Marketing APIs return, so a live payload
 * can replace it without touching the component.
 *
 * Fully deterministic — no Date, no Math.random — so it renders identically
 * on the server and the client.
 */

export type LinkedInData = {
  page: {
    summary: {
      followers: number;
      new_followers: number;
      page_views: number;
      unique_visitors: number;
      impressions: number;
      engagement_rate: string;
    };
    trend: { date: string; impressions: number; followers: number }[];
    job_functions: { label: string; value: number }[];
    seniority: { label: string; value: number }[];
    industries: { label: string; value: number }[];
    top_posts: { title: string; impressions: number; clicks: number; engagement: string }[];
  };
  ads: {
    summary: {
      spend: number;
      impressions: number;
      clicks: number;
      ctr: string;
      cpc: string;
      leads: number;
      cost_per_lead: string;
      conversions: number;
    };
    trend: { date: string; spend: number; leads: number }[];
    campaigns: { name: string; objective: string; spend: number; impressions: number; clicks: number; ctr: string; leads: number; cpl: string }[];
  };
};

const DAYS = Array.from({ length: 30 }, (_, i) => `Nov ${i + 1}`);
// A gentle rise with a midweek rhythm — business audiences read on weekdays.
const wave = (i: number, base: number, amp: number, lift: number) =>
  Math.round(base + Math.sin((i % 7) / 7 * Math.PI * 2 - 1.2) * amp + i * lift);

export const linkedinDemo: LinkedInData = {
  page: {
    summary: {
      followers: 8450,
      new_followers: 342,
      page_views: 2140,
      unique_visitors: 980,
      impressions: 15210,
      engagement_rate: "4.6%",
    },
    trend: DAYS.map((date, i) => ({ date, impressions: wave(i, 420, 140, 6), followers: 8108 + Math.round(i * 11.4) })),
    job_functions: [
      { label: "Marketing", value: 31 },
      { label: "Business Development", value: 18 },
      { label: "Operations", value: 12 },
      { label: "Engineering", value: 10 },
      { label: "Sales", value: 9 },
    ],
    seniority: [
      { label: "Senior", value: 34 },
      { label: "Manager", value: 26 },
      { label: "Director", value: 15 },
      { label: "Entry", value: 14 },
      { label: "VP / CXO", value: 11 },
    ],
    industries: [
      { label: "Marketing Services", value: 24 },
      { label: "Software Development", value: 19 },
      { label: "Retail", value: 11 },
      { label: "Financial Services", value: 9 },
      { label: "Healthcare", value: 7 },
    ],
    top_posts: [
      { title: "Q3 benchmark report: what changed in B2B search", impressions: 4120, clicks: 286, engagement: "7.9%" },
      { title: "How we cut reporting time for 40 clients", impressions: 3360, clicks: 214, engagement: "6.4%" },
      { title: "Hiring: senior performance marketer", impressions: 2875, clicks: 167, engagement: "5.1%" },
      { title: "Webinar recap: attribution after cookies", impressions: 2010, clicks: 98, engagement: "4.2%" },
    ],
  },
  ads: {
    summary: {
      spend: 6240,
      impressions: 184200,
      clicks: 2310,
      ctr: "1.25%",
      cpc: "$2.70",
      leads: 138,
      cost_per_lead: "$45.22",
      conversions: 61,
    },
    trend: DAYS.map((date, i) => ({ date, spend: wave(i, 196, 38, 1.2), leads: Math.max(1, wave(i, 4, 2.2, 0.06)) })),
    campaigns: [
      { name: "Lead gen — benchmark report", objective: "Lead generation", spend: 2480, impressions: 68400, clicks: 942, ctr: "1.38%", leads: 71, cpl: "$34.93" },
      { name: "Retargeting — site visitors", objective: "Website conversions", spend: 1620, impressions: 41200, clicks: 618, ctr: "1.50%", leads: 32, cpl: "$50.63" },
      { name: "Brand — thought leadership", objective: "Engagement", spend: 1310, impressions: 52300, clicks: 497, ctr: "0.95%", leads: 21, cpl: "$62.38" },
      { name: "Hiring — performance roles", objective: "Job applicants", spend: 830, impressions: 22300, clicks: 253, ctr: "1.13%", leads: 14, cpl: "$59.29" },
    ],
  },
};
