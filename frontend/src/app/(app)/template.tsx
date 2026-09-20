import RouteTransition from "../../components/motion/RouteTransition";

/** See the marketing template for why this is a template and not a layout. */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <RouteTransition>{children}</RouteTransition>;
}
