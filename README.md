# About

Url3.cc is a service that generates short links

# Feature
- 🔗 Generate Short URLs: Easily convert long URLs into short, shareable links.
- 🖼️ Image Link Shortening: Turn image URLs into concise, easy-to-share links.
- 📊 Link Management: Conveniently manage all your shortened links in one place.
- 📈 Analytics: Track and analyze link clicks and performance data.
- 💼 Efficient Promotion: Ideal for more effective online marketing campaigns.

## Environment variables

Link stats are read from Cloudflare Workers Analytics Engine. Set these on the Vercel server. Do not put them in `runtimeConfig.public` or give them a `NUXT_PUBLIC_` / `NEXT_PUBLIC_` name; the browser never receives the token.

| Name | Required | Purpose |
| --- | --- | --- |
| `CF_ACCOUNT_ID` | yes | Cloudflare account that owns the Analytics Engine dataset. The same value is already used for R2. |
| `CF_ANALYTICS_API_TOKEN` | yes | Cloudflare API token with **Account / Account Analytics / Read**. The stats route uses it only for the Analytics Engine SQL API. |
| `CF_ANALYTICS_DATASET` | no | Analytics Engine dataset name. Defaults to `url3-cc`. The Worker binding name stays `CLICK_EVENTS`. |
| `ADMIN_EMAILS` | for `/admin` | Comma-separated allowlist of account emails that can open `/admin`. Checked on the server and in the admin route middleware. Do not commit addresses. |
| `ADMIN_USER_IDS` | no | Optional comma-separated Supabase user UUIDs, for the same allowlist when email is missing. |

Nuxt also accepts `NUXT_CF_ACCOUNT_ID`, `NUXT_CF_ANALYTICS_API_TOKEN`, `NUXT_CF_ANALYTICS_DATASET`, `NUXT_ADMIN_EMAILS`, and `NUXT_ADMIN_USER_IDS`. None of these belong in `runtimeConfig.public`.

## Guest link admin

New guest creates (`POST /api/demo/links`) still redirect from Redis. After Redis accepts the key, the server also inserts a `links` row with `is_guest=true`, `user_id=null`, `expires_at`, a random `visitor_id`, and the client IP. A Supabase failure is logged and the short link is still returned. Older Redis-only guest links are not imported.

`/admin` lists those rows for the allowlist above. Click totals reuse the Analytics Engine query (`queryLinkStats`, interval `all`) and fall back to `links.clicks` when Analytics Engine is not configured. `last_visited_at` is stored for a later Worker update and stays empty until that exists.

Apply `supabase/migrations/20261109120000_guest_link_admin.sql` before relying on the list. Guest rows are not readable by `anon` or by a signed-in user's own-row policies. The insert uses the service role.

`TINYBIRD_API_KEY` is no longer read. Clicks stored in Tinybird are not imported. Charts and the stats click total include only data points written after the Worker starts recording to Analytics Engine. The `all` interval still begins on 2022-09-22, so earlier buckets stay at zero.

The redirect Worker records one click per data point on binding `CLICK_EVENTS` with dataset `url3-cc`. `index1` is the link key used for sampling and may be truncated to 96 bytes. `blob20` stores the full link key. Stats queries filter on `blob20`, and use `index1` only when `blob20` is empty. Counts use `SUM(_sample_interval)` over the Analytics Engine timestamp.

| Column | Field |
| --- | --- |
| `blob1` | country (ISO 3166-1 alpha-2) |
| `blob2` | city |
| `blob3` | region |
| `blob4` | latitude |
| `blob5` | longitude |
| `blob6` | ua |
| `blob7` | browser |
| `blob8` | browser_version |
| `blob9` | engine |
| `blob10` | engine_version |
| `blob11` | os |
| `blob12` | os_version |
| `blob13` | device |
| `blob14` | device_vendor |
| `blob15` | device_model |
| `blob16` | cpu_architecture |
| `blob17` | bot (`true` or `false`) |
| `blob18` | referer |
| `blob19` | referer_url |
| `blob20` | full link key |

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm run preview

# yarn
yarn preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
