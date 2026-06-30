// Shared auth helpers for the OAuth sign-in flow.

// Production backend (Render). Used as the fallback when NEXT_PUBLIC_API_URL is
// not set, so a deployed frontend never silently calls localhost.
const PROD_API_URL = "https://arbflow-backend.onrender.com";

export function getApiUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  // Only fall back to the local backend when actually running on localhost.
  if (
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)/.test(window.location.hostname)
  ) {
    return "http://localhost:8000";
  }
  return PROD_API_URL;
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

    const data = await res.json();
    if (!data.access_token) return false;

    localStorage.setItem("token", data.access_token);

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
// Exchange it for the real JWT (which never travels in the URL), store the
// token, and strip the code from the URL. Returns true on success.
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
