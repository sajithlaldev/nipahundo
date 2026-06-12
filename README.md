# Nipah Route Map — Kozhikode

Brutalist, static **Next.js** site visualising the public route map of the confirmed
Nipah virus case in Kozhikode, Kerala (reported 12 June 2026).

All content lives in **`data/route.json`** — edit that one file to update patient
info, contacts, helpline numbers, locations, and the movement timeline.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build (static export)

```bash
npm run build    # outputs to ./out
```

## Deploy to Cloudflare Pages

This app uses `output: "export"` (pure static HTML), so no adapter is needed.

| Setting              | Value           |
| -------------------- | --------------- |
| Framework preset     | Next.js (Static Export) — or "None" |
| Build command        | `npm run build` |
| Build output directory | `out`         |

> Note: the map uses indicative landmark coordinates for awareness only.
> Always refer to official Kerala Health Department bulletins.
