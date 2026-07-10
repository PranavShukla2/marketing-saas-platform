// Shared auth helpers.
//
// All API calls go through the same-origin proxy (/api/backend/* — a Next.js
// rewrite to the FastAPI backend, see next.config.ts). Same-origin is what lets
// the session live in an httpOnly first-party cookie that works in every
// browser: JS never sees the token, so an XSS can't steal the session the way
// it could when we kept a JWT in localStorage.

export function getApiUrl(): string {
  // Same-origin proxy prefix. Call sites append /api/v1/... as before.
  return "/api/backend";
}

// Dedupe in-flight / repeat calls for the same code. React can mount AuthGuard
// twice (Strict Mode / re-renders), and the auth code is single-use — without
// this the second call would spend an already-consumed code and fail.
let pending: { code: string; promise: Promise<boolean> } | null = null;

async function exchange(code: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiUrl()}/api/v1/auth/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) return false;

    // The session arrives as an httpOnly Set-Cookie on this response; there is
    // nothing to store client-side.

    // Remove the (now-spent) code from the URL + history, keep other params.
    const params = new URLSearchParams(window.location.search);
    params.delete("auth_code");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (query ? `?${query}` : "")
    );
    return true;
  } catch {
    return false;
  }
}

// After Google sign-in, the backend redirects with a single-use `?auth_code=`.
// Exchange it for the session cookie and strip the code from the URL.
export async function consumeAuthCode(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const code = new URLSearchParams(window.location.search).get("auth_code");
  if (!code) return false;

  // Same code already being handled (or just handled) this session — reuse it.
  if (pending && pending.code === code) return pending.promise;

  const promise = exchange(code);
  pending = { code, promise };
  return promise;
}

// Access tokens are short-lived (30 min); a rotating refresh cookie renews
// them. Dedupe concurrent refreshes so five parallel 401s don't spend five
// refresh tokens (rotation makes each single-use).
let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/v1/auth/refresh`, { method: "POST" });
        return res.ok;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

// fetch() for authenticated API calls: on a 401 (expired access token), renew
// through the refresh cookie once and retry. A second 401 is a real signout.
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;
  const renewed = await refreshSession();
  if (!renewed) return res;
  return fetch(input, init);
}

// Is there a live session? The cookie is httpOnly (invisible to JS), so the
// only way to know is to ask the backend (renewing via refresh if needed).
export async function fetchSession(): Promise<boolean> {
  try {
    const res = await apiFetch(`${getApiUrl()}/api/v1/auth/me`);
    return res.ok;
  } catch {
    return false;
  }
}

// Clear the session cookie server-side, plus any legacy localStorage token
// from the pre-cookie era.
export async function logout(): Promise<void> {
  try {
    await fetch(`${getApiUrl()}/api/v1/auth/logout`, { method: "POST" });
  } catch {
    // Even if the network call fails, fall through to the redirect — the
    // cookie will expire on its own.
  }
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("arbflow_active_workspace");
  } catch {}
}
