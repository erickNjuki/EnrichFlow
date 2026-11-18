# ◈ EnrichFlow

**A Clay.com-style GTM data workbench** — spreadsheet-based lead enrichment with waterfall providers, AI columns, formulas, and lead scoring. Built with vanilla HTML/CSS/JS, zero dependencies, no build step.

> All enrichment providers are **simulated** with deterministic mock data — no API keys, no network calls. It's a fully interactive demo of Clay's core workflow, not a wrapper around real data vendors.

## Features

| Capability               | How it works                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Spreadsheet tables**   | Editable cells, add/delete rows & columns, filter/search, three table templates (Outbound leads, Target accounts, Inbound scoring)                                       |
| **Waterfall enrichment** | Work-email column tries Prospeo → Hunter → Dropcontact in order, live per-provider progress in the cell, stops at first hit, only charges credits for providers that ran |
| **Enrichment columns**   | Company firmographics (industry / headcount / HQ / funding), LinkedIn profile finder, tech-stack detection — each result stamped with a provider badge                   |
| **AI columns**           | Prompt editor with `{{Column}}` references; generates personalized icebreakers that use enriched row data                                                                |
| **Formula columns**      | Sandboxed expressions with `{{Column}}` refs, e.g. `{{Title}}.match(/VP\|Head\|Founder/) ? "Senior" : "IC"`                                                              |
| **Lead scoring**         | 0–100 bar computed from data completeness and title seniority                                                                                                            |
| **CSV import / export**  | Import any CSV as a new table, add enrichment columns onto it, export results                                                                                            |
| **Credits system**       | Header pill + sidebar usage meter; every enrichment call deducts credits                                                                                                 |

## Run it

Any static file server works:

```bash
python -m http.server 4173
# then open http://localhost:4173
```

Or just open `index.html` in a browser.

## Try this first

1. Click **▶ Run all columns** and watch enrichment cascade down the table — some rows fall through email providers, like real waterfalls do.
2. Click the **Icebreaker** column header to edit its AI prompt.
3. Click a row number to open the record panel and enrich a single row.
4. Import your own CSV and add enrichment columns onto it.

## Structure

```
index.html   — layout: sidebar, grid, right panel, add-column modal
styles.css   — design tokens (warm paper + charcoal + ember palette)
app.js       — state, mock enrichment engines, waterfall runner, rendering
vercel.json  — security headers (see below)
```

## Security

Everything runs client-side: no backend, no auth, no network calls. The two
things worth being careful about are formula evaluation and what the browser is
allowed to load.

**Formula columns are parsed, not `eval`'d.** Formulas are user-authored
expressions, so running them through `new Function()` would hand arbitrary JS
this page's origin — and would force `'unsafe-eval'` into the CSP, defeating
most of its value. Instead `app.js` tokenizes and parses a small expression
language (literals, regexes, arithmetic, comparison, logic, ternaries,
indexing) and walks the resulting tree. Method calls are limited to a
whitelist, property access to `length`, and no identifier resolves except
`{{Column}}` refs — so there is no reachable path to `window`, `document`,
`fetch`, or `constructor`.

**Headers** (`vercel.json`, applied to every route):

| Header                                             | Why                                                                                                                                                                                                                                          |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy`                          | `script-src 'self'` with **no** `'unsafe-inline'` or `'unsafe-eval'` — all JS is in `app.js` and there are no inline `<script>` tags. `style-src` allows `'unsafe-inline'` because score bars render via `style=` attributes in `innerHTML`. |
| `X-Frame-Options: DENY` / `frame-ancestors 'none'` | No other site may iframe this one (clickjacking)                                                                                                                                                                                             |
| `X-Content-Type-Options: nosniff`                  | Browsers must trust declared content types                                                                                                                                                                                                   |
| `Referrer-Policy`                                  | Outbound links only learn the origin                                                                                                                                                                                                         |
| `Permissions-Policy`                               | Camera/mic/geolocation/payment etc. explicitly disabled                                                                                                                                                                                      |
| `Strict-Transport-Security`                        | HTTPS only, two years, preload-eligible                                                                                                                                                                                                      |

---
