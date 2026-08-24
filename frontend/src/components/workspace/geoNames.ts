/**
 * GA4 country names vs. the atlas's country names.
 *
 * The two disagree in three ways: the atlas abbreviates to fit a map label
 * ("Dominican Rep.", "Bosnia and Herz."), the two sides sit on different sides
 * of several renamings (Türkiye, Eswatini, Cabo Verde), and Google hands back
 * a couple of dual names ("Myanmar (Burma)").
 *
 * `normalise` handles the boring half — case, accents, ampersands, punctuation
 * — so only genuine disagreements need an entry below. Anything that still
 * doesn't match is left unshaded but keeps its row in the ranked list beside
 * the map, so no traffic is ever hidden.
 */

export function normalise(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining accents
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * GA4 (normalised) → the atlas's `properties.name`.
 *
 * These are only the genuine disagreements; anything the normaliser already
 * reconciles (case, accents, "&", punctuation) is deliberately absent. Several
 * entries the standard Natural Earth build needed have gone: the India
 * point-of-view file spells the United States, North Macedonia and both Congos
 * the way GA4 does, so they now match without help.
 */
const ALIASES: Record<string, string> = {
  usa: "United States",
  us: "United States",
  "united states of america": "United States",
  "bosnia and herzegovina": "Bosnia and Herz.",
  "central african republic": "Central African Rep.",
  "dr congo": "Democratic Republic of the Congo",
  "congo kinshasa": "Democratic Republic of the Congo",
  congo: "Republic of the Congo",
  "congo brazzaville": "Republic of the Congo",
  "dominican republic": "Dominican Rep.",
  "equatorial guinea": "Eq. Guinea",
  "falkland islands": "Falkland Is.",
  "falkland islands islas malvinas": "Falkland Is.",
  "south sudan": "S. Sudan",
  "solomon islands": "Solomon Is.",
  "marshall islands": "Marshall Is.",
  "cayman islands": "Cayman Is.",
  "british virgin islands": "British Virgin Is.",
  "us virgin islands": "U.S. Virgin Is.",
  "turks and caicos islands": "Turks and Caicos Is.",
  "northern mariana islands": "N. Mariana Is.",
  "cook islands": "Cook Is.",
  // Both Koreas are spelled formally in this file.
  "north korea": "Dem. Rep. Korea",
  "south korea": "Republic of Korea",
  korea: "Republic of Korea",
  "macedonia fyrom": "North Macedonia",
  swaziland: "eSwatini",
  "myanmar burma": "Myanmar",
  burma: "Myanmar",
  "czech republic": "Czechia",
  "ivory coast": "Côte d'Ivoire",
  turkiye: "Turkey",
  "east timor": "Timor-Leste",
  "cape verde": "Cabo Verde",
  "palestinian territories": "Palestine",
  "state of palestine": "Palestine",
  "sao tome and principe": "Sao Tome and Principe",
  // India's point of view draws these inside Serbia and Morocco respectively,
  // so traffic from them shades the containing country rather than vanishing.
  kosovo: "Serbia",
  "western sahara": "Morocco",
};

/**
 * Build a lookup from Natural Earth name → the caller's rows, so painting a
 * country is a single map read rather than a scan per shape.
 */
export function indexByAtlasName<T>(
  rows: T[],
  getName: (row: T) => string,
  atlasNames: string[]
): Map<string, T> {
  const atlas = new Map(atlasNames.map((n) => [normalise(n), n]));
  const out = new Map<string, T>();
  for (const row of rows) {
    const raw = getName(row);
    if (!raw) continue;
    const key = normalise(raw);
    const match = ALIASES[key] ?? atlas.get(key);
    if (match) out.set(match, row);
  }
  return out;
}
