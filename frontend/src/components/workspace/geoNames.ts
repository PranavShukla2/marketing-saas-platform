/**
 * GA4 country names vs. Natural Earth country names.
 *
 * The two datasets disagree in three ways: Natural Earth abbreviates to fit a
 * map label ("Dem. Rep. Congo", "Bosnia and Herz."), the two sides sit on
 * different sides of several renamings (Türkiye, North Macedonia, Eswatini),
 * and Google hands back a couple of dual names ("Myanmar (Burma)").
 *
 * `normalise` handles the boring half — case, accents, ampersands, punctuation
 * — so only genuine disagreements need an entry below. Anything that still
 * doesn't match is simply left unshaded, which is also what happens to the
 * ~40 microstates and city-states (Singapore, Hong Kong, Malta, Bahrain…) that
 * have no polygon at all at 1:110m. They still appear in the ranked list
 * beside the map, so their traffic is never hidden.
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

/** GA4 (normalised) → Natural Earth `properties.name`. */
const ALIASES: Record<string, string> = {
  "united states": "United States of America",
  "usa": "United States of America",
  "us": "United States of America",
  "bosnia and herzegovina": "Bosnia and Herz.",
  "central african republic": "Central African Rep.",
  "democratic republic of the congo": "Dem. Rep. Congo",
  "dr congo": "Dem. Rep. Congo",
  "congo kinshasa": "Dem. Rep. Congo",
  "republic of the congo": "Congo",
  "congo brazzaville": "Congo",
  "dominican republic": "Dominican Rep.",
  "equatorial guinea": "Eq. Guinea",
  "falkland islands": "Falkland Is.",
  "falkland islands islas malvinas": "Falkland Is.",
  "south sudan": "S. Sudan",
  "solomon islands": "Solomon Is.",
  "western sahara": "W. Sahara",
  "north macedonia": "Macedonia",
  "macedonia fyrom": "Macedonia",
  "swaziland": "eSwatini",
  "myanmar burma": "Myanmar",
  "burma": "Myanmar",
  "czech republic": "Czechia",
  "ivory coast": "Côte d'Ivoire",
  "turkiye": "Turkey",
  "east timor": "Timor-Leste",
  "palestinian territories": "Palestine",
  "state of palestine": "Palestine",
  "vatican city": "Italy", // no polygon of its own at 110m
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
