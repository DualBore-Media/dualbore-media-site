# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable project decisions

- The selected visual direction is the dark garage editorial concept: orange accents, large display type, real channel links, and illustrative build cards.
- The brother-provided merch HTML is a source reference for the future shop. Current merch is a preview only; do not enable live checkout until products, prices, shipping, tax, fulfillment, and policies are confirmed.
- Stripe must remain test mode during development. Keep the browser publishable key in a local environment file only; never commit a secret `sk_` key.
- Merch is an editorial Drop 01 preview: E92 Tee (`/assets/IMG_5076.jpg`), E90 Crewneck (`/assets/IMG_5077.jpg`), and SV1000S Silhouette (`/assets/IMG_5078.jpg`). Use the supplied mockups without invented material specifications, prices, stock, or checkout controls. Drop alerts link to the confirmed YouTube channel.
- Netlify builds the application root (`site/` locally) with `npm run build` and publishes `dist/client`. Keep `public/_redirects` as the SPA fallback.
