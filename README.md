# DualBore Media

React/Vite channel site with a red/cyan carbon-fiber theme using Teko and Inter and a Drop 01 merch preview. Orders are not open. All merch is labeled Coming soon without prices. The Drop 01 Alert dialog links to the confirmed YouTube channel.

## Local development

From this application directory, run `npm ci`, then `npm run dev -- --host 127.0.0.1`. Run `npm run build` and `npm run test:sites` before publishing.

## Netlify deployment

Connect the existing `DualBore-Media/dualbore-media-site` repository to the existing Netlify project. This folder's contents belong at the repository root. If the whole parent workspace is uploaded instead, set the Netlify base directory to `site`.

- Production branch: `main`.
- Build command: `npm run build`.
- Publish directory: `dist/client`.
- Configuration: `netlify.toml` and `public/_redirects`.
- Required build environment variables: none for the current preview.
- The Sites worker and hosting manifest are generated alongside the static site for compatibility; Netlify publishes only `dist/client`.

Keep `node_modules`, `dist`, `.netlify`, and environment files out of Git. The `.env.example` contains an empty Stripe publishable-key placeholder. A `VITE_` variable is public browser configuration and must never hold a Stripe secret key. The preview does not initialize Stripe or collect payments.

The source, scripts, tests, hosting manifest, worker, and public assets are stored in GitHub. Creating a Netlify project alone does not establish Git deployment. Confirm a successful deploy tied to the expected commit before declaring the connection complete.

## Working together

Each contributor uses their own GitHub account and local checkout. Make changes on separate branches, review them in pull requests, and merge approved work into `main`. Once Git deployment is connected, merges to `main` trigger production builds. Avoid sharing a live checkout through OneDrive.

## Custom domain

`DualBoreMedia.com` is the planned custom domain, referenced in application metadata without an unverified canonical URL; availability, ownership, and checkout price have not been confirmed. Compare registration and renewal totals at the chosen registrar rather than treating example prices as a quote. Domain purchase is a separate step.

After registration and a successful Netlify deploy, add the domain in the project's Domain management. For Netlify DNS, copy the exact assigned nameservers from Netlify to the registrar; do not use example nameservers. Preserve existing email and verification records when changing DNS providers.

For external DNS on Netlify's standard network, Netlify recommends an ALIAS/ANAME/flattened CNAME at the apex to `apex-loadbalancer.netlify.com`; if unsupported, use an A record at `@` to `75.2.60.5`. Set `www` as a CNAME to `dualbore-media-site.netlify.app`. Verify the project's current recommendations before applying changes. HTTPS provisioning follows successful DNS validation, with no fixed completion time promised.

References: [Netlify external DNS](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/), [Netlify HTTPS](https://docs.netlify.com/manage/domains/secure-domains-with-https/https-ssl/), [Porkbun registration and renewal comparison](https://porkbun.com/about/domain-cost-calculator/com).

