import type { Metadata } from "next";
import NotFoundScene from "../components/NotFoundScene";

// The scene needs hooks (physics, reduced-motion), so it's a client component —
// and client components can't export metadata. Keeping this wrapper on the
// server is what lets a 404 set its own title instead of inheriting the app's.
export const metadata: Metadata = {
    title: "404 — Page not found · ArbFlow",
    description: "That page doesn't exist. Head back to your ArbFlow workspace.",
};

export default function NotFound() {
    return <NotFoundScene />;
}
