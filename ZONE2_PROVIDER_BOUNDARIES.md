# Zone 2 Provider Boundary Planning / Payment Authority Design

Phase: V3-Z2-0
Scope: Documentation and planning only
Status: Planning document for approval before Git promotion

## 1. Client vs Server Authority

Future provider integrations must treat the server as the only authority for payment state, credit grants, entitlement decisions, provider reconciliation, and any durable user-facing balance. Client surfaces may present offers, explain checkout intent, and navigate users toward approved flows, but they must never become the source of truth for a successful payment or a granted credit.

The client may eventually receive server-rendered or server-issued display state, but that state remains informational only. Display state is not itself an entitlement grant, credit grant, or durable balance. Durable authority remains server-verified and server-controlled, and any browser-visible state is considered untrusted input unless it has been resolved through server authority.

## 2. Why Checkout Stays Non-Authoritative

Checkout pages exist to initiate or describe a purchase path. They are not ledger systems, payment processors, entitlement authorities, or credit issuers. A checkout screen can say what a user is attempting to buy, but it cannot prove that the purchase succeeded.

Future checkout pages must therefore avoid granting credits, unlocking gameplay, persisting entitlements, or interpreting provider redirects as final truth. A success-looking browser state is only a navigation outcome unless the server has verified the provider event through an isolated authority path.

## 3. Future Webhook Isolation

If provider webhooks are introduced in a later phase, they must live behind server-side boundaries that are isolated from gameplay, dossier, and client route behavior. Webhook handling must be treated as infrastructure-facing authority, not as UI behavior.

Webhook concerns must not bleed into templates, front-end scripts, gameplay modules, dossier views, or `/play` routes. Provider event interpretation, signature verification, reconciliation, retry handling, and idempotency belong in a server-only boundary reserved for payment authority.

## 4. Credit-Grant Authority Boundaries

Credit grants must eventually occur only after server-side provider verification and only through a dedicated authority boundary. No checkout UI, browser callback, route parameter, local session flag, wallet state, or client-side storage value may grant or imply credits.

The credit-grant boundary should remain narrow and auditable. It should receive verified facts from the server-side payment authority layer and produce durable credit state through controlled server mechanisms only. Gameplay systems may consume only read-only derived state after that state has crossed the approved authority boundary. Gameplay layers must not participate in entitlement resolution, payment interpretation, provider verification, or account authority.

## 5. Runtime vs Git-Authority Separation

Git defines intended architecture, allowed boundaries, and reviewed source changes. Runtime provider state defines actual payment facts only after server-side verification. These authorities must not be confused.

A committed checkout page, route, or UI affordance does not create transaction authority. Likewise, runtime provider events must not rewrite architectural rules or cause ad hoc coupling across gameplay, dossier, or client systems. Monetization architecture must remain reviewable in Git while payment truth remains verified at runtime by server-only systems.

## 6. Why Gameplay Systems Cannot Trust Checkout UI State

Gameplay systems must assume checkout UI state is untrusted. Browser navigation, success messages, query strings, local flags, and interrupted client sessions can be spoofed, replayed, cached, or reached without a completed transaction.

For that reason, gameplay must never infer credits, inventory, access, progression, rewards, or unlocks from checkout presentation. If gameplay ever needs monetization-derived state, it must receive already-authorized state from a server-side entitlement or credit boundary introduced in a later approved phase.

## 7. Why `/play` and Dossier Remain Isolated

`/play` and dossier surfaces are gameplay and presentation areas, not payment authority areas. They must remain isolated from provider SDKs, checkout callbacks, webhook logic, wallet state, and transaction interpretation.

Future monetization work must not make `/play` or dossier responsible for validating purchases, granting credits, reading provider responses, or resolving account/payment identity. These systems may display only state that has already been authorized elsewhere by approved server-side boundaries.

## 8. Future Provider Abstraction Goals

Provider integration should eventually be hidden behind a server-side abstraction that prevents Stripe, Coinbase, wallet, or any other provider-specific details from leaking into gameplay or content systems. Any reference to payment intent in this document is an internal, provider-neutral planning concept, not an assumption about a specific provider workflow. Future abstraction names and concepts must remain implementation-agnostic and avoid provider-shaped assumptions while describing verification status, reconciliation outcome, and authorized credit decisions without exposing provider SDK concepts broadly.

The goal is replaceability and containment. Provider-specific code should be limited to provider adapter boundaries, while shared payment authority rules remain provider-neutral and server-controlled.

## 9. Anti-Drift Doctrine for Monetization Phases

Monetization phases must advance through explicit boundaries, not opportunistic UI shortcuts. Each phase should preserve the rule that payment truth is server-side, provider-specific behavior is isolated, and gameplay systems remain consumers of authorized state rather than interpreters of payment events.

Any future change that introduces transaction handling, checkout behavior, provider SDKs, persistence, entitlement logic, routes, webhooks, wallet coupling, or gameplay unlocks must be treated as a separate implementation phase with its own review. Documentation-only phases must not smuggle in runtime behavior. Success pages are navigation outcomes only, browser-visible state is non-authoritative, and frontend caches or session state must never become entitlement truth.

## 10. Explicit Forbidden Patterns

The following patterns are forbidden for this architecture boundary:

- Client-side credit grants.
- `localStorage` entitlements or credit state.
- Fake success states that imply payment completion without server verification.
- Wallet or session coupling to gameplay authority.
- Provider SDK bleed into gameplay systems.
- Checkout routes granting credits directly.
- `/play` reading checkout state as proof of payment.
- Dossier surfaces interpreting provider or wallet state.
- Browser redirects treated as durable transaction truth.
- Query strings, cookies, or client flags used as entitlement authority.
- Provider webhook logic placed in UI, gameplay, or dossier code.
- Provider-specific objects passed into gameplay systems.

## Validation Notes

This document is Markdown only. It introduces no runtime behavior, no provider integration, no routes, no JavaScript logic, no persistence, no entitlement implementation, no database schema change, and no Drupal cache rebuild requirement.

