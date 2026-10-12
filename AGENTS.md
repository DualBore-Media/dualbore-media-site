# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable project decisions

- The current selected visual direction is the high-octane carbon-fiber identity from the brother-provided HTML: #0B0D10 background, #13161C cards, #232834 borders, #FF2A3B red and #00F0FF cyan, Teko 600/700 display titles and Inter body text. Use real channel thumbnails for vehicle cards and keep verified YouTube links. This supersedes the earlier orange/Anton/Barlow concept.
- The brother-provided merch HTML is a source reference for the future shop. Current merch is a preview only; do not enable live checkout until products, prices, shipping, tax, fulfillment, and policies are confirmed.
- Stripe must remain test mode during development. Keep the browser publishable key in a local environment file only; never commit a secret `sk_` key.
- Merch is an editorial Drop 01 preview, labeled Coming soon: E92 Coupe Line-Art Tee (`/assets/IMG_5076.jpg`), E90 Sedan Front-Clip Crewneck (`/assets/IMG_5077.jpg`), and SV1000S Silhouette Crewneck (`/assets/IMG_5078.jpg`). Use the supplied mockups without invented material specifications, prices, stock, or checkout controls. The user has now authorized a real Netlify Forms Drop 01 waitlist. Collect only name, email, style, size, and explicit email consent. Never simulate signup success.
- Netlify builds the application root (`site/` locally) with `npm run build` and publishes `dist/client`. Keep `public/_redirects` as the SPA fallback.


- Navigation uses four hash-addressable, keyboard-accessible tabs: Garage Builds, Video Vault, Garage Merch (Drop 01), and About / Pit Crew. Preserve legacy films/shop/about hash aliases. Arrow keys and Home/End move and activate tabs.
- Merch Quick Views show supplied artwork, design notes, and a clearly provisional S–2XL size guide. Do not invent garment measurements or material weights. Get Drop Alert uses Netlify Forms, with validation, a honeypot, and success only after an accepted submission. No payment collection.
- Public production is approved; keep non-production previews private. Keep static response security headers in public/_headers.

