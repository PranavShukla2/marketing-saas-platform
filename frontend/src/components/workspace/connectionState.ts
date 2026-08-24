/**
 * One description of the GA4 connection, in one place.
 *
 * The workspace used to answer "why aren't these my numbers?" in three
 * different voices: a badge next to the title, a banner above the content, and
 * a separate prompt inside empty panels — each with its own wording, each
 * derived from the same `status` field by its own inline ternary chain. They
 * drifted, and two of them stacked on top of each other and pushed the page
 * down as they appeared.
 *
 * This maps the backend's status code to a single descriptor. The island shows
 * `summary`, empty panels show `detail`, and both offer the same `cta` — so
 * the answer is consistent wherever the user happens to look.
 */
export type ConnectionState = {
  /** Are we looking at the user's real numbers? */
  live: boolean;
  /** How the status island should carry it. */
  tone: "idle" | "alert" | "error";
  /** Short chip beside the workspace title. */
  badge: string;
  /** One line, for the island. */
  summary: string;
  /** A sentence or two, for an empty panel that has room to explain. */
  detail: string;
  /** Label for the action that fixes it, when there is one. */
  cta?: string;
};

export function describeConnection(
  status: string | undefined,
  message?: string
): ConnectionState {
  switch (status) {
    case "active":
      return {
        live: true,
        tone: "idle",
        badge: "Live",
        summary: "Live Google Analytics data",
        detail: "Connected to Google Analytics.",
      };

    case "reauth_required":
      return {
        live: false,
        tone: "error",
        badge: "Reconnect",
        summary: "Google session expired — showing sample data",
        detail:
          "Your Google session expired, so this is sample data. Reconnect and your own numbers load straight back in.",
        cta: "Reconnect",
      };

    case "no_properties":
      return {
        live: false,
        tone: "alert",
        badge: "No GA4",
        summary: "No GA4 property on this Google account",
        detail:
          "That Google account has no Google Analytics property attached, so this is sample data. Sign in with the account that owns the property.",
        cta: "Use another account",
      };

    case "no_access":
      return {
        live: false,
        tone: "alert",
        badge: "No GA4",
        summary: message || "Google Analytics isn't available for this account",
        detail:
          message ||
          "We reached Google but couldn't read any Analytics data for this account — usually the Admin or Data API isn't enabled on the project. Showing sample data meanwhile.",
        cta: "Reconnect",
      };

    // `pending_integration`, and anything the backend adds later that we don't
    // recognise yet: a first-run account that simply hasn't connected.
    default:
      return {
        live: false,
        tone: "alert",
        badge: "Sample data",
        summary: "Sample data — connect Google Analytics for your own",
        detail:
          "This is a fully worked example so you can see what the workspace does. Connect Google Analytics and every panel here fills with your own numbers.",
        cta: "Connect Google Analytics",
      };
  }
}
