// Charts go through these wrappers, never straight to recharts — so tooltips,
// axes, grids and motion all read from the token system, and swapping the
// library later means touching this folder rather than every page.
export { ChartTooltip } from "./ChartTooltip";
export { AreaTrend, type Series } from "./AreaTrend";
export { DonutBreakdown, CATEGORY_COLORS } from "./DonutBreakdown";
