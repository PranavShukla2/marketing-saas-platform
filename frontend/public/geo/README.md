# Vendored world atlas — India point of view

`countries-ind-110m.json` is Natural Earth's **India point-of-view** country
geometry (`ne_10m_admin_0_countries_ind`), simplified to roughly 1:110m detail
and TopoJSON-encoded.

## Why the point-of-view variant

Natural Earth's default `admin_0_countries` draws South Asia on the de-facto
Line of Control: Gilgit-Baltistan and Azad Kashmir fall inside Pakistan, Aksai
Chin inside China, and India stops at 35.5°N. The `_ind` variant is Natural
Earth's own rendering of the boundary as the Government of India defines it —
the whole of Jammu & Kashmir and Ladakh within India, which takes India's
northern extent to 37.0°N.

Using Natural Earth's published variant rather than editing polygons by hand
means the boundary is drawn by cartographers, is reproducible from the command
below, and stays consistent with the rest of the world's coastlines.

Consequences of this point of view, all of them intended: Kosovo is drawn
within Serbia and Western Sahara within Morocco, since India recognises
neither. Countries the atlas has no polygon for are simply left unshaded and
keep their row in the ranked list beside the map, so no traffic is hidden.

## Regenerating

```sh
curl -L -o ne_ind.geojson \
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_ind.geojson

npx mapshaper ne_ind.geojson \
  -filter-fields NAME \
  -rename-fields name=NAME \
  -simplify 1.5% keep-shapes \
  -rename-layers countries \
  -o countries-ind-110m.json format=topojson quantization=1e5
```

Only a 1:10m POV file is published, hence the simplify step. `keep-shapes` is
what stops small island nations being simplified out of existence — without it
the Bahamas, Singapore and Hong Kong disappear.

## Why it lives in public/ rather than being imported

1. **Bundle.** A 113KB `import()` of JSON becomes a JS chunk the browser has to
   parse. As a static asset it is fetched once, cached by the CDN, and never
   touches the JS bundle.
2. **Typecheck cost.** `resolveJsonModule` makes TypeScript infer a literal type
   for the whole file — measurably slow on every `tsc` run, for a type nobody
   reads. We cast to the topojson types instead.

Fetched on demand by `components/workspace/GeoMap.tsx`, so it only loads when
someone opens the Audience section.
