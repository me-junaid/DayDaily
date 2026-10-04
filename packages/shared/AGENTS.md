# packages/shared: Shared Schemas, Types and Constants

The contract between the API and every frontend. Place this file at `packages/shared/AGENTS.md`.
Root rules in `/AGENTS.md` still apply. Package name: `@daydaily/shared`.

**Golden rule: if the API and a frontend both need to agree on it, it is defined here, once, as a Zod schema. Types are inferred from the schema, never written by hand.**

## What belongs here

- Zod schemas for API requests and responses
- Types inferred from those schemas (`z.infer`)
- Enums and constants used by more than one app (order statuses, languages, units, roles)
- Error codes (the API contract with the frontends)
- Permission capabilities (used by the API and the admin panel)
- Small, pure helper functions (money formatting, phone normalisation, unit conversion)

## What does NOT belong here

- React components or hooks (those go in `packages/ui` or the app)
- Prisma models or any database code (stays in `apps/api`)
- Business logic that decides things (pricing, stock checks, order transitions stay in `apps/api` services)
- Anything that reads `process.env`, the filesystem, the network, or the DOM
- Secrets, URLs, or provider SDKs

If you are unsure, ask: "Do two or more packages need this to be identical?" If not, keep it in the app.

## Structure

```
src/
  index.ts              Public exports only. Re-exports from the folders below
  common/               ids, pagination, money, phone, language, dates
  auth/                 otp, tokens payload, roles
  permissions/          capabilities.ts, role-capabilities.ts
  catalog/              product, category, alias
  voice/                extraction output, draft cart, questions, corrections
  cart/
  orders/               order, order item, status enum, status labels keys
  payments/             payment method, status enum, create-order and verify schemas
  stores/               store, inventory, opening state
  notifications/
  errors/               error-codes.ts, error-response.ts
  constants/            limits.ts (max items, max audio seconds), headers.ts
  utils/                money.ts, phone.ts, units.ts (pure functions only)
  *.test.ts             Tests next to the code
```

One folder per domain. Each folder has its own `index.ts`. Apps import from `@daydaily/shared` or a documented subpath, never from deep internal files.

## Zod schemas are the single source of truth

- **Define the schema first, then infer the type:**

```ts
export const OrderItemSchema = z.object({ ... }).strict();
export type OrderItem = z.infer<typeof OrderItemSchema>;
```

- Never write a TypeScript `interface` or `type` by hand for something that crosses the API boundary. Do not duplicate a schema in an app.
- Use `.strict()` on request schemas so unknown fields are rejected. Response schemas may be tolerant when frontends should survive additive changes.
- Separate **request** and **response** schemas: `CreateOrderRequestSchema`, `OrderResponseSchema`. Do not reuse database-shaped objects as responses.
- Compose with `.pick()`, `.omit()`, `.extend()` and `z.discriminatedUnion()` rather than copying fields.
- Use `z.discriminatedUnion` for states with different shapes (for example voice item `state: 'matched' | 'needs_clarification' | 'unmatched'`).
- Every string has sensible limits (`.min()`, `.max()`). Every number has a range. Arrays have `.max()`.
- Use `.brand()` for ids when mixing them up would be dangerous (`OrderId`, `ProductId`, `StoreId`).
- Validation messages are **error codes or keys**, not English sentences, so the frontend can translate them.
- Schema changes are API changes. Adding an optional field is safe. Removing, renaming or tightening a field breaks clients and needs a `v2` plan (ask first).

## Naming rules

| Thing | Rule | Example |
|---|---|---|
| Schema constants | `PascalCase` + `Schema` | `CreateOrderRequestSchema` |
| Inferred types | `PascalCase`, no suffix | `CreateOrderRequest` |
| Enum schemas | `PascalCase` + `Schema`, values in `snake_case` strings | `OrderStatusSchema` -> `'placed' \| 'accepted'` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_AUDIO_SECONDS` |
| Error codes | `SCREAMING_SNAKE_CASE`, stable | `ORDER_OUT_OF_STOCK` |
| Capabilities | `domain.action` lowercase | `orders.refund`, `payouts.approve` |
| Functions | `camelCase`, verbs | `formatPaise`, `normalizePhone` |
| Files | `kebab-case.ts` | `create-order.schema.ts` |
| JSON field names | `camelCase` | `totalPaise`, `createdAt` |

- Request suffix `Request`, response suffix `Response`, list responses `ListResponse`.
- Money fields end with `Paise` (`totalPaise`, `unitPricePaise`). Never an unlabeled `price` or `amount`.
- Time fields end with `At` (ISO 8601 UTC strings): `createdAt`, `deliveredAt`. Durations end with `Ms` or `Seconds`.
- Booleans start with `is`, `has` or `can`.
- Do not use abbreviations unless universal (`id`, `url`).

## Common building blocks (define once, reuse everywhere)

- `MoneyPaiseSchema`: integer, non-negative, max sensible limit. No floats.
- `PhoneSchema`: normalised to E.164 (`+91...`), validated length and country rules.
- `LanguageCodeSchema`: `'en-IN' | 'hi-IN' | 'ml-IN'` and so on. One list used by the web, voice and WhatsApp.
- `IdSchema` helpers (uuid or cuid, as the database uses).
- `PaginationQuerySchema` (`page`, `pageSize` max 100) and `PaginatedResponse(schema)` helper.
- `IsoDateTimeSchema`: ISO 8601 UTC string.
- `UnitSchema`: `kg | g | l | ml | piece | packet | dozen | bottle | box`.
- `IdempotencyKeyHeader` constant and schema.

## Error codes

- All API error codes are in `errors/error-codes.ts` as a const object plus a Zod enum.
- **Codes are a public contract.** Never rename or reuse one. Add new codes, and deprecate old ones in a comment instead of deleting.
- `ErrorResponseSchema` matches the API error shape: `{ error: { code, message, details?, requestId } }`.
- The web app maps each code to an `i18n` key. When you add a code here, also add its key in the web and dashboard locale files (en, hi, ml).

## Permissions

- `permissions/capabilities.ts` lists every capability once. `role-capabilities.ts` maps roles to capabilities.
- The API enforces them and the admin UI uses them to hide actions. Both import from here, so they can never disagree.
- Adding a capability needs a test that checks every role against it.

## Utility functions

- Pure and deterministic: same input, same output. No randomness, no current time without it being passed in, no I/O.
- Examples: `formatPaise(paise, locale)`, `paiseFromRupees(string)`, `normalizePhone(input)`, `normalizeUnit(text)`.
- Money math uses integers. Rounding rules are explicit and tested.
- Keep it small. If a helper is used by only one app, it does not live here.

## No runtime dependencies on apps (strict)

- **`packages/shared` must never import from `apps/*`.** Dependencies point one way: apps depend on shared, never the reverse. A lint rule (`no-restricted-imports` or `eslint-plugin-boundaries`) enforces this.
- Allowed runtime dependencies: **`zod` only.** Adding any other package needs approval. Dev dependencies (TypeScript, Vitest, tsup) are fine.
- No Node-only or browser-only APIs: no `fs`, `path`, `crypto`, `window`, `document`, `localStorage`, `process.env`. The package must run in the browser, in Node and in tests. For hashing or randomness, do it in `apps/api`.
- No side effects at import time. Mark `"sideEffects": false` in `package.json` so bundlers can drop unused code (important for the web performance budget).
- No circular imports between domain folders. If two domains need each other, move the shared part to `common/`.

## Build and exports

- TypeScript strict. Build with `tsup` (or `tsc`) to ESM with type declarations. Add CJS only if the API needs it.
- `package.json` uses an `exports` map, with types included. Keep subpaths few and documented (for example `@daydaily/shared`, `@daydaily/shared/permissions`).
- Within the monorepo, apps consume the package through the pnpm workspace (`"@daydaily/shared": "workspace:*"`). In dev, use TypeScript project references or a watch build so changes appear without manual rebuilds.
- **Bundle size matters.** Keep schemas lean. Large zod unions or giant constant tables ship to the phone. Prefer subpath imports and never put big lookup data (the full catalog, translations) in this package.
- Public API is whatever `index.ts` exports. Do not export internals "just in case".

## Changing the contract safely

1. Change the schema here first.
2. Update the API (route, service, tests) and every frontend that uses it **in the same change** when possible.
3. Run `pnpm typecheck` at the repo root. A broken consumer shows up as a type error. Do not silence it with `any` or casts.
4. Breaking change (remove, rename, make required)? Stop and ask. Prefer adding an optional field, keeping the old one, then removing it later.
5. Never change an error code or a status enum value without checking every consumer.

## Testing

- Unit test each schema with valid cases, invalid cases, boundary values and unknown fields (rejected by `.strict()`).
- Test utility functions with many examples, especially money, phone numbers (with and without `+91`, spaces, leading zero) and units.
- Test `role-capabilities`: every role against every capability, and that no role has an undefined capability.
- Test that `index.ts` exports match expectations, so deleting a public export fails a test.
- Tests are pure and fast. No network, no database, no mocks of other packages.

## Do and don't

| Do | Don't |
|---|---|
| Define a schema once and infer the type | Write the same type in the API and the web app |
| Name money fields `...Paise` | Use floats or an unlabeled `price` |
| Add new error codes | Rename or reuse existing codes |
| Keep only `zod` as a runtime dependency | Import from `apps/*` or add heavy libraries |
| Keep helpers pure | Read env, time, DOM or Node APIs |
| Ask before breaking changes | Silence type errors in consumers |

## Definition of done (shared)

Everything in the root `AGENTS.md`, plus:

1. Types are inferred from Zod schemas. Nothing is hand-duplicated.
2. Names follow the table above, with `Paise` and `At` suffixes.
3. No import from `apps/*`, no new runtime dependency besides `zod`, no Node or DOM APIs.
4. Schema tests cover valid, invalid, boundary and unknown-field cases.
5. All consumers compile (`pnpm typecheck` at the repo root passes).
6. Error codes and capabilities are only added, never renamed, and new codes have locale keys.
7. Breaking changes were discussed first.