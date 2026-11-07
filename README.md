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
| `CF_ANALYTICS_DATASET` | no | Dataset name on the Worker Analytics Engine binding (`dataset`, not the binding variable). Defaults to `link_clicks`. |

Nuxt also accepts `NUXT_CF_ACCOUNT_ID`, `NUXT_CF_ANALYTICS_API_TOKEN`, and `NUXT_CF_ANALYTICS_DATASET`.

`TINYBIRD_API_KEY` is no longer read. Clicks stored in Tinybird are not imported. Charts and the stats click total include only data points written after the Worker starts recording to Analytics Engine. The `all` interval still begins on 2022-09-22, so earlier buckets stay at zero.

The redirect Worker writes one data point per click:

```js
env.LINK_CLICKS.writeDataPoint({
  indexes: [key], // index1, sampling key
  blobs: [country, city, browser, os, device, referer]
  // blob1 country (ISO 3166-1 alpha-2)
  // blob2 city
  // blob3 browser
  // blob4 os
  // blob5 device
  // blob6 referer hostname, or "" when direct
})
```

```toml
[[analytics_engine_datasets]]
binding = "LINK_CLICKS"
dataset = "link_clicks"
```

`CF_ANALYTICS_DATASET` must match `dataset`. Counts use `SUM(_sample_interval)`, so the Worker should not put the link key in a per-event unique index.

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
