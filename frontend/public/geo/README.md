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
  -simplify variable percentage="name == 'India' ? '20%' : '1.5%'" keep-shapes \
  -rename-layers countries \
  -o countries-ind-110m.json format=topojson quantization=1e5
```

Only a 1:10m POV file is published, hence the simplify step. `keep-shapes` is
what stops small island nations being simplified out of existence — without it
the Bahamas, Singapore and Hong Kong disappear.

### Why India is simplified less than everywhere else

A single 1.5% pass got the boundary wrong in exactly the place this file exists
to get right. Simplification moves shared arcs, and it moved the Bhutan–India
arc ~0.25° east — enough to put **Tawang inside Bhutan**. It also reduced India
to one polygon, so **Andaman & Nicobar were dropped** (`keep-shapes` keeps only
the largest part of each country). Raising detail globally doesn't fix it
cheaply: at 2–3% Muzaffarabad, ~0.1° from the boundary, falls out instead, and
only 5% passes — at 272KB.

So India's arcs (which are shared, so its neighbours' borders with India get the
same detail) are kept at 20%, and the rest of the world stays at 1.5%: 129KB,
and India's outline drifts from the 1:10m source by ~0.2% of its area, mostly
coastline.

Checked by point-in-polygon against the source, and any regeneration should
re-check the same places: Muzaffarabad, Mirpur, Gilgit, Skardu, the Khunjerab
tip, Siachen, Aksai Chin (centre and north-east), the Shaksgam valley, Tawang,
Itanagar and Port Blair must all fall in India; Islamabad in Pakistan; Kashgar
in China; and no point in South Asia may fall in two countries.

## Why it lives in public/ rather than being imported

1. **Bundle.** A 113KB `import()` of JSON becomes a JS chunk the browser has to
   parse. As a static asset it is fetched once, cached by the CDN, and never
   touches the JS bundle.
2. **Typecheck cost.** `resolveJsonModule` makes TypeScript infer a literal type
   for the whole file — measurably slow on every `tsc` run, for a type nobody
   reads. We cast to the topojson types instead.

Fetched on demand by `components/workspace/GeoMap.tsx`, so it only loads when
someone opens the Audience section.
