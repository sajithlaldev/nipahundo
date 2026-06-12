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

This app uses `output: "export"` (pure static HTML → `./out`), so no adapter is
needed. Deployment runs via **GitHub Actions Direct Upload**
(`.github/workflows/deploy.yml`) to the Cloudflare Pages project **`kuzhiyundo`**:

- push to `main` → production deployment
- pull request to `main` → preview deployment (URL commented on the PR)

### Required GitHub repository secrets

Settings → Secrets and variables → Actions:

| Secret                  | What it is                                          |
| ----------------------- | --------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Token with the **Cloudflare Pages: Edit** permission |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID                          |

> Use **either** this Actions workflow **or** Cloudflare's Git integration — not
> both, or you'll get double deployments.

> Note: the map uses indicative landmark coordinates for awareness only.
> Always refer to official Kerala Health Department bulletins.
