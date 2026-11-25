import type { Metadata } from "next";
import NotFoundCalm from "../components/NotFoundCalm";

// The page is a client component (the water scene needs the browser), and
// client components can't export metadata. Keeping this wrapper on the
// server is what lets a 404 set its own title instead of inheriting the app's.
export const metadata: Metadata = {
    title: "Page not found",
    description: "That page doesn't exist. Head back to your ArbFlow workspace.",
};

export default function NotFound() {
    return <NotFoundCalm />;
}
