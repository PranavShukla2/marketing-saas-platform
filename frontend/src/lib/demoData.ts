// Rich, realistic demo dataset for the workspace. Mirrors the exact shape the
// backend's /analytics/dashboard returns, so the redesigned UI renders fully
// (and looks great) even before a live GA4 property is connected.

export type WorkspaceData = {
  status: string;
  demo?: boolean;
  company_name: string;
  active_property_id?: string;
  properties?: { id: string; name: string }[];
  summary: Record<string, string>;
  post_level: { source: string; users: number; views: number }[];
  device_data: { device: string; users: number }[];
  pages_data: { path: string; views: number; avg_duration: number }[];
  ecommerce_data: { name: string; purchases: number; revenue: number }[];
  funnel_data: { step: string; count: number }[];
  cohort_data: { week: string; new: number; returning: number }[];
  time_series: { date: string; raw: string; users: number; sessions: number; views: number }[];
  channel_data: { channel: string; users: number; sessions: number }[];
  geo_data: { country: string; users: number; sessions: number }[];
  browser_data: { browser: string; users: number }[];
  os_data: { os: string; users: number }[];
  events_data: { event: string; count: number }[];
  suggestions: { primary_focus: string; reason: string; action_item: string };
};

// Deterministic 30-day series with a gentle upward trend + weekly dip on weekends.
function buildTimeSeries() {
  const out = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6 ? 0.72 : 1;
    const trend = 1 + (29 - i) * 0.012;
    const wobble = 0.9 + (Math.sin(i * 1.7) + 1) * 0.12;
    const base = 1180;
    const users = Math.round(base * trend * weekend * wobble);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    out.push({
      date: `${mm}/${dd}`,
      raw: `${d.getFullYear()}${mm}${dd}`,
      users,
      sessions: Math.round(users * 1.34),
      views: Math.round(users * 3.1),
    });
  }
  return out;
}

const timeSeries = buildTimeSeries();
const totalUsers = timeSeries.reduce((a, b) => a + b.users, 0);
const totalSessions = timeSeries.reduce((a, b) => a + b.sessions, 0);
const totalViews = timeSeries.reduce((a, b) => a + b.views, 0);

export const demoData: WorkspaceData = {
  status: "active",
  demo: true,
  company_name: "Northwind Co.",
  active_property_id: "properties/demo",
  properties: [{ id: "properties/demo", name: "Northwind Co. — Web" }],
  summary: {
    active_users: String(totalUsers),
    new_users: String(Math.round(totalUsers * 0.61)),
    sessions: String(totalSessions),
    engaged_sessions: String(Math.round(totalSessions * 0.68)),
    page_views: String(totalViews),
    engagement_rate: "68.4%",
    bounce_rate: "31.6%",
    avg_duration: "2m 47s",
    events: String(Math.round(totalViews * 2.2)),
    views_per_session: "3.1",
    total_revenue: "48210.55",
    transactions: "1184",
    conversions: "1842",
  },
  post_level: [
    { source: "Google", users: 14820, views: 46180 },
    { source: "Direct", users: 8610, views: 24130 },
    { source: "Instagram", users: 5240, views: 13980 },
    { source: "Newsletter", users: 3110, views: 9240 },
    { source: "Bing", users: 1420, views: 3880 },
    { source: "Referral", users: 980, views: 2510 },
  ],
  channel_data: [
    { channel: "Organic Search", users: 16240, sessions: 21980 },
    { channel: "Direct", users: 8610, sessions: 11240 },
    { channel: "Organic Social", users: 5240, sessions: 6980 },
    { channel: "Email", users: 3110, sessions: 4020 },
    { channel: "Paid Search", users: 2480, sessions: 3310 },
    { channel: "Referral", users: 980, sessions: 1240 },
  ],
  device_data: [
    { device: "Mobile", users: 18240 },
    { device: "Desktop", users: 12980 },
    { device: "Tablet", users: 2140 },
  ],
  geo_data: [
    { country: "United States", users: 12480, sessions: 16920 },
    { country: "United Kingdom", users: 4210, sessions: 5640 },
    { country: "India", users: 3890, sessions: 5120 },
    { country: "Germany", users: 2340, sessions: 3010 },
    { country: "Canada", users: 2110, sessions: 2780 },
    { country: "Australia", users: 1620, sessions: 2090 },
    { country: "France", users: 1180, sessions: 1490 },
    { country: "Netherlands", users: 940, sessions: 1170 },
  ],
  browser_data: [
    { browser: "Chrome", users: 19840 },
    { browser: "Safari", users: 8420 },
    { browser: "Edge", users: 2610 },
    { browser: "Firefox", users: 1480 },
    { browser: "Samsung Internet", users: 720 },
    { browser: "Opera", users: 290 },
  ],
  os_data: [
    { os: "iOS", users: 11240 },
    { os: "Android", users: 9180 },
    { os: "Windows", users: 8420 },
    { os: "Macintosh", users: 3980 },
    { os: "Linux", users: 540 },
  ],
  pages_data: [
    { path: "/", views: 18420, avg_duration: 84 },
    { path: "/pricing", views: 9240, avg_duration: 132 },
    { path: "/product/aurora-kit", views: 7110, avg_duration: 167 },
    { path: "/blog/scaling-analytics", views: 5230, avg_duration: 211 },
    { path: "/checkout", views: 4180, avg_duration: 96 },
    { path: "/about", views: 3020, avg_duration: 73 },
    { path: "/contact", views: 2110, avg_duration: 58 },
    { path: "/blog/ga4-guide", views: 1880, avg_duration: 245 },
  ],
  events_data: [
    { event: "page_view", count: 98420 },
    { event: "session_start", count: 42180 },
    { event: "scroll", count: 31240 },
    { event: "click", count: 18610 },
    { event: "add_to_cart", count: 6240 },
    { event: "begin_checkout", count: 3110 },
    { event: "purchase", count: 1184 },
    { event: "sign_up", count: 842 },
  ],
  funnel_data: [
    { step: "Page View", count: 32450 },
    { step: "Add to Cart", count: 6240 },
    { step: "Begin Checkout", count: 3110 },
    { step: "Purchase", count: 1184 },
  ],
  ecommerce_data: [
    { name: "Aurora Starter Kit", purchases: 412, revenue: 18540.0 },
    { name: "Northwind Pro (annual)", purchases: 286, revenue: 14300.0 },
    { name: "Flow Analytics Add-on", purchases: 198, revenue: 7920.0 },
    { name: "Team Seat", purchases: 164, revenue: 4920.0 },
    { name: "Onboarding Session", purchases: 124, revenue: 2530.55 },
  ],
  cohort_data: [
    { week: "W1", new: 3120, returning: 1840 },
    { week: "W2", new: 3340, returning: 2210 },
    { week: "W3", new: 3580, returning: 2640 },
    { week: "W4", new: 3810, returning: 3020 },
  ],
  time_series: timeSeries,
  suggestions: {
    primary_focus: "Scale up Organic Search",
    reason:
      "Organic Search is your strongest channel, driving 16,240 users and the best engagement rate on site at 71%.",
    action_item:
      "Double down on the blog content cluster — the GA4 guide post alone holds visitors for 4+ minutes. Reallocate 15% of paid budget here.",
  },
};
