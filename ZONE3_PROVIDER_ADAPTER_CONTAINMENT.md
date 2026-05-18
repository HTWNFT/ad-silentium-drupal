# Zone 3 Provider Adapter Containment Doctrine

Phase: V3-Z3-01
Scope: Documentation and planning only
Status: Provider adapter containment foundation

## 1. Provider Containment Principle

Future provider integrations must remain isolated infrastructure layers. A provider may supply external payment facts, but it must not become application authority for gameplay, dossier state, credit grants, entitlement truth, or user-facing balances.

Application authority must remain internal, server-controlled, and provider-neutral. Gameplay systems must remain provider-agnostic and must not depend on the presence, absence, naming, state model, or behavior of any specific provider.

## 2. Shared Terminology Containment

Shared application terminology must remain provider-neutral. Internal names should describe application concepts, authority boundaries, and verified outcomes without inheriting the vocabulary of Stripe, Coinbase, wallets, chains, sessions, payment SDKs, or any other provider-specific system.

Provider-specific terms and object vocabulary may exist only inside the future adapter boundary that is responsible for translating external facts. They must not spread into gameplay, dossier, checkout presentation, entitlement authority, or shared application language. Shared application systems must not inherit provider event naming, provider lifecycle terminology, or provider-specific utility concepts as reusable abstractions.

## 3. Adapter Boundary Principle

Future adapters must translate provider facts into internal neutral concepts that can be evaluated by server-side authority boundaries. Adapter outputs are informational inputs to server authority decisions only; they are not entitlement decisions, credit decisions, account decisions, or gameplay decisions. Adapters may interpret external provider facts only within their isolated boundary, and they must not expose raw provider state directly into gameplay systems, dossier systems, checkout UI, or frontend logic.

Adapters cannot independently define entitlement truth, credit truth, account authority, gameplay access, or durable balances. They are translation and containment boundaries, not authority systems or final authority layers.

## 4. Gameplay Isolation Principle

`/play`, dossier systems, mission systems, and UI atmosphere systems must remain isolated from provider SDK state, wallet state, webhook state, transaction state, and provider event terminology.

These systems must not read provider-shaped state, branch on provider outcomes, infer purchase success, or participate in payment interpretation. If future gameplay-facing state is ever needed, it must arrive only as read-only derived state from an approved server authority boundary, not from a provider adapter or checkout surface.

## 5. Checkout Presentation Containment

Checkout presentation layers remain informational and navigation-only. They may describe available actions or direct users through approved flows, but they cannot establish entitlement truth, credit truth, durable balances, or gameplay access.

Provider redirects, success pages, cancellation pages, browser-visible messages, query strings, frontend-visible provider state, and session-visible presentation states are not authority. Checkout success or cancellation presentation cannot become entitlement signals. A success page remains a navigation outcome only unless separate server-side authority has verified and resolved the relevant facts.

## 6. Future Implementation Safety

Any future implementation phase must preserve auditability, provider neutrality, adapter isolation, and server-side authority. Provider-specific logic must remain contained so that shared systems do not acquire SDK-shaped assumptions or provider-specific state models.

Future work must avoid turning adapter convenience into shared application dependency. Adapter outputs must support reviewable server authority decisions as inputs only, without creating provider coupling in gameplay, dossier, checkout presentation, entitlement authority, or frontend systems.

## 7. Anti-Drift Notes

The following drift patterns are forbidden for this doctrine boundary:

- Stripe-first naming in shared application concepts.
- Coinbase-first naming in shared application concepts.
- Provider-shaped schemas or shared data terminology.
- Wallet-derived gameplay authority.
- SDK utility reuse across gameplay systems.
- Adapter helper reuse across gameplay systems.
- Provider convenience abstractions promoted into shared infrastructure.
- SDK utility migration outside adapter boundaries.
- Raw provider states exposed into frontend gameplay logic.
- Provider event names used as gameplay or entitlement concepts.
- Checkout success states treated as entitlement proof.
- Adapter-local terminology promoted into shared architecture.
- Provider-specific assumptions embedded in mission, dossier, or `/play` behavior.

## Validation Notes

This document is Markdown only. It introduces no runtime behavior, no provider integration, no SDK snippets, no provider APIs, no routes, no webhook examples, no database schemas, no persistence design, no entitlement implementation, no gameplay logic, no provider configuration, and no environment variable work.

