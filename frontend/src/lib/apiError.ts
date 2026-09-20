/**
 * Turning a failed request into a sentence a person can act on.
 *
 * Both halves of this lived as byte-identical copies in the login and register
 * pages, and nowhere else — so every other page that talked to the API
 * rendered whatever the server happened to hand back, including FastAPI's
 * `{detail: [{msg, loc}]}` arrays, which stringify to "[object Object]".
 */

/**
 * `fetch` rejects with "Failed to fetch" for everything from a dropped
 * connection to a CORS refusal — accurate, and useless to the person reading
 * it. Browsers disagree on the wording, hence the three patterns.
 */
export function friendlyError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return "Can't reach the server right now. Check your connection and try again.";
  }
  return msg || fallback;
}

/**
 * FastAPI returns a plain string `detail` for handled errors and a list of
 * `{msg, loc, type}` objects for 422 validation failures. Pull the first
 * readable message out of either shape.
 */
export function detailToMessage(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    // Pydantic prefixes custom validators with "Value error, " — that's an
    // implementation detail of the server, not something a user should read.
    if (first?.msg) return first.msg.replace(/^Value error,\s*/i, "");
  }
  return fallback;
}

/** Read an error out of a failed Response, whatever shape it came in. */
export async function messageFromResponse(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return detailToMessage(body?.detail, fallback);
}
