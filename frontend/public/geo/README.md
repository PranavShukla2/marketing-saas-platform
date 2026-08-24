# Vendored world atlas

`countries-110m.json` is Natural Earth's 1:110m country geometry, TopoJSON-encoded,
copied verbatim from the `world-atlas` package (kept in devDependencies as its
provenance — refresh with `cp node_modules/world-atlas/countries-110m.json .`).

It lives in `public/` rather than being imported, for two reasons:

1. **Bundle.** A 108KB `import()` of JSON becomes a JS chunk the browser has to
   parse. As a static asset it's fetched once, cached by the CDN, and never
   touches the JS bundle.
2. **Typecheck cost.** `resolveJsonModule` makes TypeScript infer a literal type
   for the whole file. On a topology this size that is measurably slow on every
   `tsc` run, for a type nobody reads — we cast to the topojson types instead.

Fetched on demand by `components/workspace/GeoMap.tsx`, so it only loads when
someone opens the Audience section.
