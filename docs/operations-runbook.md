# Pre-deployment operations and cutover

No deployment, main merge, public payment or marketing broadcast is authorized. Keep server `PAYMENTS_ENABLED=false` and `TRANSACTIONAL_EMAILS_ENABLED=false`. A build does not establish provider readiness. The sandbox has real local PostgreSQL, Stripe test keys and owner-only Resend delivery. Production needs separate empty managed storage and production provider instances. Never copy sandbox orders/customers/shipments/stock. The $30 and $7 values remain test settings.

## Accounts and authorization

See [auth setup](auth-setup.md). Clerk owns sign-in, verification, recovery, sessions and MFA. APIs verify Bearer tokens, exact authorized origin, current active session and current verified primary email. Impersonated/deleted/unverified accounts fail closed. Admin private metadata and a recent enrolled second factor are mandatory. Clerk's reverification UI cannot override the server's second-factor check. Real Clerk sign-in, recovery, MFA and CSP remain unverified until an owner signs in and configures the instance.

Guest checkout remains available. Authenticated checkout associates an order only when the verified paid receipt matches the verified account email. Guest claims use freshly verified primary email, never browser email or guessed order/session identifiers. Customers receive no address, internal order ID or Stripe reference. Account deletion requests suppress marketing and block ordinary account access pending retention review. The owner must complete managed-account deletion/revocation according to approved retention obligations; there is no arbitrary delete-data API.

## Database and recovery

Migrations 001, 002 and 003 are transactional/checksummed. Do not edit applied files. Run `npm run db:migrate` against the deliberately selected environment with a migration-only owner role. Production application credentials need DML only, no schema ownership/alteration; audit history needs SELECT/INSERT only. Use verified TLS and managed encrypted backups/PITR with approved retention. Back up before migration. Restore into an isolated database, compare orders/inventory and exercise reads/writes before cutover. The local pg_dump/pg_restore rehearsal restored three migrations and fifteen variants into a disposable database; managed production recovery is not yet verified.

All writers use one transaction advisory lock. This favors correctness for low volume and is not a high-throughput architecture. Real PostgreSQL tests cover final-unit locking, stale stock edits, split allocation, append-only audit and competing refunds. Never point destructive QA at production.

## Fulfillment, tracking and attention

Payment and fulfillment are separate. Forward fulfillment is received, making, packing, ready_to_ship. Shipped/delivered derive from recorded packages. Holds resume only their prior stage. Holds/cancellation require exact boolean confirmation and a reason. Fully refunded orders cannot progress to shipment. Refunds/cancellation never silently restock.

Package quantities cannot exceed order quantities across split shipments. Packages move draft -> packed -> shipped -> delivered. Shipping requires ready_to_ship and carrier/service/tracking with HTTPS links and no embedded credentials. Delivery requires recorded manual confirmation, never a date estimate. Actor/time/previous/new events are audited. Legacy sandbox shipments appear as earlier shipments without invented delivery events.

Manual tracking is the enabled provider. The server never fetches arbitrary tracking URLs. Future carrier adapters must authenticate/normalize provider events. [Shippo API pricing](https://goshippo.com/pricing/api) includes a free starter but tracking has fees; no paid service was created.

Needs attention includes failed/uncertain email, failed verified webhooks, stale reservations, inventory inconsistencies, tracking gaps, pending/failed refunds, long-stage orders and deletion requests. Use authenticated Stripe reconciliation or `npm run orders:recover`. Never release stock merely because local time expired. Ambiguous checkout creation without a session ID needs review of the original Stripe request; never create a second purchase to repair uncertainty.

Refunds require admin MFA, confirmation, bounded remaining amount and an immutable idempotency key. Pending requests reserve refundable amount atomically. Stripe Refund objects have no livemode: mode is checked on the original PaymentIntent. State follows authenticated Stripe responses or signed refund events. Keep the same key after uncertainty. Private Help tickets require verified accounts and independently authorized order context. Internal support notes remain admin-only. Ticket tools do not send email or promise a response time before a monitored support workflow exists.

## Email and marketing

Order/merchant, making, shipped, delivered, cancellation and verified refund messages use durable identities. Packing/ready emails are optional (`CUSTOMER_PROGRESS_EMAILS=true`), off by default. Each package/refund has its own identity. Templates escape HTML and include plain text. Payment/fulfillment survive delivery failure. Retry queued/failed records only; ambiguous delivery outside the provider's deduplication window requires manual review.

Production email domain required. No owned custom domain or verified Resend domain is established. Do not assume ownership of the planned .com. After the owner identifies an owned domain, create its sending resource and use the exact returned DKIM/Return-Path/SPF records; records cannot be invented before resource creation. Verify DNS/TLS, use a scoped sending key and confirmed monitored reply-to, and have the domain administrator review DMARC alignment. No production DNS or Netlify secrets were changed.

Marketing is separate; broadcasts are absent. Netlify Forms remains signup source of truth. Configured production storage records explicit consent source/time/policy after the verified event. Account opt-out and confirmed-POST opaque unsubscribe capabilities persist suppression. New purchases/signups cannot silently resubscribe. Before future marketing, check suppression, persist immutable send payloads including unsubscribe links, and add provider List-Unsubscribe headers. Never regenerate changing links inside retries. Hosted form delivery and future campaigns require real validation.

## Future cutover, requiring separate approval

1. Confirm owned domain, legal identity/address, public support/reply-to, returns, processing time, shipping, product descriptions, final prices, counted stock and tax decisions. Approve policies.
2. Configure owner-controlled production Clerk, private admin roles and MFA. Verify sign-in/recovery/revocation. Set exact `CLERK_FRONTEND_ORIGIN`; generated auth-route CSP permits required vendor challenges and inline styles, never inline scripts/eval. Verify actual provider UI.
3. Provision clean managed production storage with TLS/backups and separate roles. Apply migrations and seed only approved live data. Keep test `stripePriceId` distinct from `liveStripePriceId` and `productionPriceCents`; Checkout independently checks live mode/currency/amount.
4. Live Stripe authentication required. Only sandbox is connected. Complete onboarding and tax/shipping. Do not reuse test prices. Dynamic payment methods remain Stripe-managed, with no custom card inputs.
5. Configure verified Resend and server environment declarations from .env.example. Keep both switches false. Only Clerk's publishable key is public; never VITE-prefix secrets.
6. Rerun tests/audit/browser QA and strict launch checks. Obtain approval for the exact deployment commit before any deploy marker, merge or deploy.
7. After an approved deployment, configure live webhook signing/delivery for completion, expiry, async and refund events. Verify replay/recovery; separately approve payment/email activation and recovery scheduling.

A green checklist or this runbook grants no deployment approval. Production is still blocked by actual provider, business and post-deployment checks.
