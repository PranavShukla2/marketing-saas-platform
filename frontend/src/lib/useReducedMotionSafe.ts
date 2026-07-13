"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Hydration-safe replacement for framer-motion's useReducedMotion.
 *
 * The original returns null on the server and resolves on the client, so any
 * component that branches a className (or rendered markup) on it produces
 * different HTML server-side vs client-side under OS reduced-motion — tripping
 * Next's hydration mismatch overlay in dev.
 *
 * This returns false on the server AND on the client's first render (so both
 * sides match), then the real preference right after mount. Animations start
 * one frame later for reduced-motion users, which is exactly the frame we're
 * turning them off anyway.
 */
export function useReducedMotionSafe(): boolean {
  const real = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? !!real : false;
}
