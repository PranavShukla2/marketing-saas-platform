// Shared auth helpers for the OAuth sign-in flow.

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

// After Google sign-in, the backend redirects with a single-use `?auth_code=`.
// Exchange it for the real JWT (which never travels in the URL), store the
// token, and strip the code from the URL. Returns true on success.
export async function consumeAuthCode(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  const code = params.get("auth_code");
  if (!code) return false;

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
