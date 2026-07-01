// Rich demo dataset for the Meta workspace (Facebook Page + Instagram + Ads).
// Structured to mirror what a real Meta Graph API integration would return, so
// swapping in live data later is a drop-in. Everything here is sample data.

export type MetaData = {
  demo?: boolean;
  facebook: {
    summary: Record<string, string>;
    trend: { date: string; reach: number; engagement: number; impressions: number }[];
    top_posts: { title: string; type: string; reach: number; reactions: number; comments: number; shares: number }[];
    age: { bucket: string; value: number }[];
    gender: { label: string; value: number }[];
    countries: { country: string; value: number }[];
  };
  instagram: {
    summary: Record<string, string>;
    trend: { date: string; followers: number; reach: number; engagement: number }[];
    top_posts: { type: string; caption: string; reach: number; likes: number; comments: number; saves: number }[];
    age: { bucket: string; value: number }[];
    gender: { label: string; value: number }[];
    cities: { city: string; value: number }[];
  };
  ads: {
    summary: Record<string, string>;
    trend: { date: string; spend: number; conversions: number }[];
    campaigns: { name: string; spend: number; impressions: number; clicks: number; ctr: string; conversions: number; roas: string }[];
  };
};

function series(base: number, growth: number, wobble: number, len = 30) {
  const out: { date: string; a: number; b: number; c: number }[] = [];
  const today = new Date();
  for (let i = len - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6 ? 0.85 : 1;
    const trend = 1 + (len - 1 - i) * growth;
    const w = 0.9 + (Math.sin(i * 1.6) + 1) * wobble;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const a = Math.round(base * trend * weekend * w);
    out.push({ date: `${mm}/${dd}`, a, b: Math.round(a * 0.42), c: Math.round(a * 2.3) });
  }
  return out;
}

const fbSeries = series(9200, 0.008, 0.1);
const igSeries = series(14800, 0.01, 0.12);
const adSeries = series(640, 0.006, 0.14);

export const metaDemo: MetaData = {
  demo: true,
  facebook: {
    summary: {
      followers: "48,210",
      reach: "312,480",
      impressions: "684,220",
      engagement_rate: "5.8%",
      post_reach: "184,900",
      video_views: "96,340",
      page_views: "22,140",
      net_new_followers: "+1,284",
    },
    trend: fbSeries.map((d) => ({ date: d.date, reach: d.a, engagement: d.b, impressions: d.c })),
    top_posts: [
      { title: "Spring launch teaser 🌸", type: "Video", reach: 42180, reactions: 3120, comments: 486, shares: 812 },
      { title: "Behind the scenes at HQ", type: "Photo", reach: 28940, reactions: 2210, comments: 312, shares: 401 },
      { title: "Customer story: Northwind", type: "Link", reach: 19820, reactions: 1440, comments: 198, shares: 256 },
      { title: "Weekend flash sale ⚡", type: "Photo", reach: 17240, reactions: 1980, comments: 274, shares: 620 },
      { title: "Team AMA recap", type: "Video", reach: 12110, reactions: 940, comments: 402, shares: 88 },
    ],
    age: [
      { bucket: "18–24", value: 22 },
      { bucket: "25–34", value: 38 },
      { bucket: "35–44", value: 24 },
      { bucket: "45–54", value: 10 },
      { bucket: "55+", value: 6 },
    ],
    gender: [
      { label: "Women", value: 54 },
      { label: "Men", value: 43 },
      { label: "Other", value: 3 },
    ],
    countries: [
      { country: "United States", value: 18240 },
      { country: "United Kingdom", value: 6420 },
      { country: "Canada", value: 4110 },
      { country: "Australia", value: 3280 },
      { country: "Germany", value: 2140 },
    ],
  },
  instagram: {
    summary: {
      followers: "72,540",
      reach: "428,900",
      impressions: "912,300",
      profile_views: "38,210",
      engagement: "6.9%",
      saves: "14,820",
      reels_plays: "286,400",
      website_taps: "9,240",
      accounts_engaged: "62,180",
      net_new_followers: "+2,640",
    },
    trend: igSeries.map((d) => ({ date: d.date, followers: 72540 - d.b, reach: d.a, engagement: Math.round(d.a * 0.069) })),
    top_posts: [
      { type: "Reel", caption: "3 ways to scale your agency 🚀", reach: 128400, likes: 9820, comments: 642, saves: 3120 },
      { type: "Carousel", caption: "Our brand refresh, swipe →", reach: 68200, likes: 6210, comments: 388, saves: 2440 },
      { type: "Reel", caption: "POV: reports that write themselves", reach: 54900, likes: 5140, comments: 512, saves: 1980 },
      { type: "Photo", caption: "New office, who dis 👀", reach: 31240, likes: 4020, comments: 210, saves: 640 },
      { type: "Carousel", caption: "GA4 tips you'll actually use", reach: 28810, likes: 3210, comments: 296, saves: 2210 },
    ],
    age: [
      { bucket: "18–24", value: 34 },
      { bucket: "25–34", value: 41 },
      { bucket: "35–44", value: 16 },
      { bucket: "45–54", value: 6 },
      { bucket: "55+", value: 3 },
    ],
    gender: [
      { label: "Women", value: 61 },
      { label: "Men", value: 36 },
      { label: "Other", value: 3 },
    ],
    cities: [
      { city: "New York", value: 8420 },
      { city: "London", value: 5210 },
      { city: "Los Angeles", value: 4180 },
      { city: "Toronto", value: 3110 },
      { city: "Sydney", value: 2640 },
    ],
  },
  ads: {
    summary: {
      spend: "$18,420",
      impressions: "2,140,800",
      clicks: "48,210",
      ctr: "2.25%",
      cpc: "$0.38",
      cpm: "$8.60",
      conversions: "1,842",
      roas: "4.2x",
      reach: "684,200",
      frequency: "3.1",
    },
    trend: adSeries.map((d) => ({ date: d.date, spend: d.a, conversions: Math.round(d.a * 0.09) })),
    campaigns: [
      { name: "Spring Sale — Prospecting", spend: 6240, impressions: 842000, clicks: 18420, ctr: "2.19%", conversions: 684, roas: "4.8x" },
      { name: "Retargeting — Cart Abandon", spend: 4180, impressions: 312000, clicks: 12480, ctr: "4.00%", conversions: 512, roas: "6.1x" },
      { name: "Reels Awareness", spend: 3620, impressions: 684000, clicks: 9240, ctr: "1.35%", conversions: 288, roas: "2.4x" },
      { name: "Lookalike — Purchasers", spend: 2810, impressions: 210000, clicks: 5240, ctr: "2.50%", conversions: 246, roas: "5.2x" },
      { name: "Brand — Always On", spend: 1570, impressions: 92800, clicks: 2830, ctr: "3.05%", conversions: 112, roas: "3.1x" },
    ],
  },
};
