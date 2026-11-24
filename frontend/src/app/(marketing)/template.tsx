import RouteTransition from "../../components/motion/RouteTransition";

/**
 * `template.tsx`, not `layout.tsx`: a layout is preserved across navigations
 * within its segment, so an entrance animation there plays once and never
 * again. A template re-mounts on every route change, which is exactly the
 * hook a route transition needs.
 */
export default function MarketingTemplate({ children }: { children: React.ReactNode }) {
  return <RouteTransition>{children}</RouteTransition>;
}
