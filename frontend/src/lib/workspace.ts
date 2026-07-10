// Which workspace the user is currently viewing. "own" (or absent) = their own
// account; otherwise the numeric id of an owner whose workspace they're a
// member of. Persisted so it survives navigation; cleared on logout.
const KEY = "arbflow_active_workspace";

export function getActiveWorkspace(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    return v && v !== "own" ? v : null;
  } catch {
    return null;
  }
}

export function setActiveWorkspace(id: string | null): void {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {}
}

// Append ?workspace=<id> to a path when a non-own workspace is active. Takes a
// path that may already have a query string.
export function withWorkspace(path: string): string {
  const id = getActiveWorkspace();
  if (!id) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}workspace=${encodeURIComponent(id)}`;
}
