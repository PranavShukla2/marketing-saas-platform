import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Compose class names, with later Tailwind classes correctly beating earlier
 * ones. Plain string concatenation doesn't do that — `"p-2" + " p-4"` leaves
 * both in the class list and the winner is decided by stylesheet order, not by
 * what the caller asked for. twMerge resolves the conflict properly, which is
 * what makes component-level overrides (`<Button className="px-6">`) reliable.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
