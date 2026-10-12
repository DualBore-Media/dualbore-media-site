# DualBore Media

React/Vite channel site with a red/cyan carbon-fiber theme using Teko and Inter and a Drop 01 merch preview. Orders are not open. All merch is labeled Coming soon without prices. Drop 01 alerts use Netlify Forms with explicit consent.

## Local development

From this application directory, run `npm ci`, then `npm run dev -- --host 127.0.0.1`. Run `npm run build` and `npm run test:sites` before publishing.

## Netlify deployment

Connect the existing `DualBoreMedia/dualbore-media-site` repository to the existing Netlify project. This folder's contents belong at the repository root. If the whole parent workspace is uploaded instead, set the Netlify base directory to `site`.

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


## Navigation and product previews
The site has four keyboard-accessible views: Garage Builds, Video Vault, Garage Merch (Drop 01), and About / Pit Crew. URLs use #garage, #vault, #merch, and #crew; older #films, #shop, and #about links still work. Arrow keys and Home/End switch tabs. The Video Vault includes all five verified video links and five category filters.

Merch Quick Views show real mockups and artwork notes. Fabric specifications, sizing measurements, and final availability are pending. The waitlist collects name, email, preferred style/size, and consent. No payments are collected. The site does not send emails automatically; the team manages drop updates and opt-out requests. Netlify static response headers disable unused camera/microphone/location permissions, content-type sniffing, object embedding, external base URLs, and cross-origin form submissions. Embedded players are restricted to youtube-nocookie.com. External YouTube links use descriptive accessible labels and noopener/noreferrer.



## Mobile media and waitlist
The video player opens only after a click and is removed on close. Durations were verified with vidIQ on October 12, 2026. Responsive 480/768px copies of the original merch artwork reduce downloads without replacing the originals.

Netlify Forms detection must remain enabled. `public/__forms.html` declares `drop-waitlist` and its exact fields for build-time detection. The React form posts URL-encoded data to this static path with a honeypot, required consent, validation, a timeout, and failure feedback. Localhost intentionally refuses submissions rather than interpreting Vite's fallback response as a saved lead. Submissions are managed in the existing Netlify project's Forms dashboard. Production is public; non-production deploys remain private.

Run `node --test tests/waitlist.test.mjs` in addition to the packaging checks. Test coverage includes bad input, unexpected preferences, missing consent, honeypots, encoding, local previews, network errors, and non-success responses. Browser checks cover native form validation, keyboard tabs, dialogs, and mobile layouts.

Canonical, social image, and structured data URLs use the verified Netlify URL until ownership and configuration of DualBoreMedia.com are confirmed. JSON-LD is non-executable metadata; there are no inline executable production scripts.

