# apps/api: Backend

Node.js + Express + TypeScript + Prisma + PostgreSQL + Redis. Serves the customer PWA, store dashboard, admin panel and WhatsApp webhook. Place this file at `apps/api/AGENTS.md`.
Root rules in `/AGENTS.md` still apply. Voice, payments and WhatsApp have their own `AGENTS.md` inside `src/modules/`.

## Commands

```bash
docker compose up -d                                   # Postgres + Redis (from repo root)
pnpm --filter @daydaily/api dev                        # dev server with reload
pnpm --filter @daydaily/api build
pnpm --filter @daydaily/api test                       # Vitest + Supertest
pnpm --filter @daydaily/api test:watch
pnpm --filter @daydaily/api prisma migrate dev --name <name>   # create + apply a migration
pnpm --filter @daydaily/api prisma migrate deploy      # apply in staging/production only
pnpm --filter @daydaily/api prisma generate
pnpm --filter @daydaily/api prisma db seed
pnpm --filter @daydaily/api prisma studio
```

## Structure

```
src/
  server.ts            Starts the HTTP server and workers. No business logic
  app.ts               Builds the Express app (middleware, routes). Easy to test
  config/              env.ts (validated with Zod), constants
  middleware/          auth, validate, rateLimit, errorHandler, requestId
  modules/
    <module>/
      <module>.routes.ts       HTTP only
      <module>.controller.ts   Reads request, calls service, sends response
      <module>.service.ts      Business logic
      <module>.repository.ts   All Prisma queries
      <module>.schemas.ts      Zod schemas (or import from packages/shared)
      <module>.test.ts
      index.ts                 Public exports of the module
  jobs/                BullMQ queues and workers
  sockets/             Socket.IO setup and event handlers
  lib/                 prisma client, redis, logger, http client wrappers
  utils/
```

## Layering rules (strict)

Request flow: **route -> middleware -> controller -> service -> repository -> database.**

- **Routes** declare paths, attach middleware (auth, validate, rate limit). Nothing else.
- **Controllers** are thin: take validated input, call one service function, return the result. No Prisma, no business rules.
- **Services** hold business logic. They never touch `req` or `res`. They call repositories and other modules' services.
- **Repositories** are the only place that imports Prisma. Return plain typed objects. No business decisions.
- A module never imports another module's repository or internals. Call its service through `index.ts`.
- Cross-cutting side effects (notifications, WhatsApp messages, emails) are queued as BullMQ jobs, not done inline in a request.
- Use database **transactions** (`prisma.$transaction`) for anything that changes more than one table, such as placing an order with its items and payment record.

## Zod validation on every endpoint

- **Every route validates `body`, `query` and `params` with Zod** through the `validate()` middleware. No endpoint reads `req.body` unvalidated.
- Request and response schemas live in `packages/shared` when the frontend uses them. Module-only schemas stay in `<module>.schemas.ts`.
- Use `.strict()` on input objects so unknown fields are rejected, not silently accepted.
- Parse environment variables with Zod at startup in `config/env.ts`. The app must fail fast if one is missing. Never read `process.env` anywhere else.
- Validate responses from external services (STT, LLM, Razorpay, WhatsApp) with Zod before using them. Treat LLM output as untrusted.
- Money is **integer paise**. Quantities and IDs have explicit types. Phone numbers are normalised to E.164 (`+91...`).

## API conventions

- REST, JSON, base path `/api/v1`. Resource names are plural nouns: `/orders`, `/stores/:id/inventory`.
- Methods: `GET` read, `POST` create or action, `PATCH` partial update, `DELETE` remove. Actions use clear verbs: `POST /orders/:id/accept`.
- Status codes: `200`, `201` (created), `204` (no body), `400` (validation), `401` (not logged in), `403` (no permission), `404`, `409` (conflict), `422` (valid shape but business rule failed), `429` (rate limited), `500`.
- Lists are **paginated** (`?page=&pageSize=` or cursor). Maximum page size 100. Always sort deterministically.
- Never return database models directly. Map to response schemas so internal fields (password hashes, internal ids, flags) never leak.
- Dates in ISO 8601 UTC. IDs are UUIDs or cuid, never sequential numbers exposed to clients.
- Mutations that can be retried (placing an order, payments) accept an **`Idempotency-Key`** header and are safe to repeat.
- Version breaking changes under a new prefix (`/api/v2`). Do not break `v1` once the PWA is live.

## Error format

All errors use one shape, produced by the central `errorHandler` middleware:

```json
{
  "error": {
    "code": "ORDER_OUT_OF_STOCK",
    "message": "Some items are no longer available.",
    "details": [{ "field": "items[1]", "issue": "out_of_stock" }],
    "requestId": "req_8f3a..."
  }
}
```

Rules:
- Throw typed errors from services (`AppError` subclasses such as `NotFoundError`, `ConflictError`, `ForbiddenError`, `ValidationError`) with a stable machine-readable `code`. Never throw raw strings.
- **Codes are an API contract.** The frontend maps them to translated messages. Do not rename a code without updating the clients.
- `message` is short, plain English and safe to show. Never include stack traces, SQL, file paths, secrets or provider error bodies in responses.
- Unknown errors return `500` with code `INTERNAL_ERROR` and the `requestId`. The full error goes to the logs only.
- Convert Prisma errors in one place: unique violation -> `409`, record not found -> `404`.
- Every response includes the `requestId`, also sent as the `X-Request-Id` header.
- Async route handlers must be wrapped (or use `express-async-errors`) so rejected promises reach the error handler.

## Auth and JWT rules

Login is **phone number + OTP** for customers, shop users and admin (admin adds 2FA).

OTP:
- 6 digits, generated with a cryptographically secure random function, valid for **5 minutes**, single use.
- Store only a **hash** of the OTP (with a per-record salt). Never store or log the plain code.
- Limit **5 OTP requests per phone per hour** and **5 wrong attempts** per code. Lock out with `429` after that.
- Same response whether or not the phone is registered, to avoid account probing.
- OTP sending goes through a queue and a provider interface (MSG91, Twilio). In development, print to the console and never call the real provider.

JWT:
- **Access token: 15 minutes.** Algorithm `HS256` or `RS256`, set explicitly. Reject `none`. Keys come from env, never from code.
- **Refresh token: 30 days, opaque random string stored hashed in the database**, rotated on every use. Reuse of an old refresh token revokes the whole session.
- Send refresh tokens in an `httpOnly`, `Secure`, `SameSite=Lax` cookie when possible. Do not put tokens in URLs.
- Token payload is minimal: `sub` (user id), `role`, `shopId` (for shop users), `jti`, `iat`, `exp`. No phone numbers, names or addresses.
- Always verify the token, then **load permissions from the role**. Do not trust claims for sensitive actions such as payouts or refunds.
- Roles: `customer`, `shop`, `admin` with sub-roles for admin (see `apps/admin/AGENTS.md`). Use a `requireRole()` and `requireCapability()` middleware.
- **Ownership checks are mandatory.** A customer can only read their own orders and addresses. A shop user can only read their own shop's orders and inventory. Always filter by the authenticated user's id in the query, never trust an id from the URL alone.
- Log out revokes the refresh token.

## Prisma and migration workflow

- The schema lives in `prisma/schema.prisma`. Use `snake_case` for table and column names via `@map` and `@@map`, `camelCase` in code.
- Every table has `id`, `createdAt`, `updatedAt`. Use soft delete (`deletedAt`) for users, stores and products.
- Add indexes for fields used in filters and joins. Add a `pg_trgm` GIN index on product names and aliases for fuzzy search.
- Money columns are `Int` (paise). Never use `Float` for money.
- **Workflow for a schema change:**
  1. Edit `schema.prisma`.
  2. Run `prisma migrate dev --name <short_description>` to generate and apply the migration.
  3. Read the generated SQL. Check it is safe.
  4. Commit the schema and the new migration folder together.
- **Never edit or delete an existing migration** that has been committed. Create a new one.
- **Never run `prisma migrate reset` or `db push` against staging or production.** Production uses `migrate deploy` only.
- Destructive changes (drop column, change type) use the expand and contract pattern: add new, migrate data, switch code, remove old in a later migration. Ask before doing one.
- Raw SQL (needed for `pg_trgm` extension and indexes) goes inside a migration file with a clear comment.
- Keep `seed.ts` idempotent (safe to run twice). Seed data is fake except the catalog.
- Prisma queries: select only needed fields, avoid N+1 (use `include` or batched queries), and never run unbounded `findMany`.

## Rate limiting

Use Redis-backed limits (`rate-limiter-flexible` or `express-rate-limit` with a Redis store). Return `429` with code `RATE_LIMITED` and a `Retry-After` header.

| Area | Limit |
|---|---|
| General API, per IP | 300 requests per 15 min |
| General API, per logged-in user | 120 requests per min |
| OTP request, per phone and per IP | 5 per hour |
| OTP verify, per phone | 5 attempts per code |
| Voice upload (costs money), per user | 20 per hour, 100 per day |
| Order placement, per user | 10 per hour |
| Webhooks (Razorpay, WhatsApp) | Verified by signature, high limit, no user limit |

- Voice and LLM endpoints also have a **max audio length** (60 s) and **max file size** (about 2 MB). Reject larger uploads early.
- Add a global per-day cost guard for paid providers (STT and LLM). Alert when 80% is reached.
- Set request body size limits (`1mb` for JSON). Set `helmet`, a strict CORS allowlist (only our own origins), and `trust proxy` correctly behind the host.

## Logging

- Use **pino** (structured JSON). No `console.log` in committed code.
- Every request gets a `requestId` (use the incoming `X-Request-Id` or generate one) attached to all logs through `AsyncLocalStorage`.
- Log levels: `error` (needs attention), `warn` (unexpected but handled), `info` (important events like order placed), `debug` (development only).
- Log one line per request: method, route, status, duration, userId. No bodies.
- **Never log:** OTPs, tokens, passwords, API keys, full phone numbers, addresses, payment details, raw audio, or full transcripts. Mask phones (`+91••••••3210`). Use pino `redact` paths as a safety net.
- Log external calls (STT, LLM, Razorpay, WhatsApp) with provider, latency and outcome, not payloads.
- Send errors to Sentry with the `requestId`. Strip personal data before sending.
- Expose `GET /health` (process up) and `GET /ready` (database and Redis reachable). No auth, no sensitive info.

## Jobs and realtime

- BullMQ jobs are **idempotent** and retried with backoff. Each job has a unique id so duplicates do not run twice.
- Failed jobs after the retry limit go to a dead-letter queue and raise an alert.
- Socket.IO connections require a valid access token. Join rooms by authorised ids only (`shop:<id>`, `order:<id>`). Never let a client join an arbitrary room.
- Emit events after the database transaction commits, never before.

## Testing

- **Vitest + Supertest** against a real test Postgres (Docker), not mocks of Prisma. Reset data between tests.
- Test each endpoint for: success, validation failure, unauthenticated (`401`), wrong role (`403`), accessing someone else's data (`403` or `404`), and rate limit where relevant.
- Unit test services with business rules (stock checks, order totals, status transitions).
- Mock external providers (STT, LLM, Razorpay, WhatsApp, SMS) behind their interfaces. Tests never call paid services or send real messages.
- Use fixtures for LLM and STT responses, including bad or malformed output.

## Security checklist

- Validate input, escape output, and use parameterised queries only (Prisma). No string-built SQL.
- Passwords are not used. Keep secrets only in environment variables. Never commit them.
- Check ownership on every read and write.
- Totals, prices and delivery fees are **always calculated on the server** from the database, never taken from the client.
- File uploads (product images): check type and size, store in object storage, never on the server disk.
- Keep dependencies updated. Run `pnpm audit` in CI.

## Definition of done (api)

Everything in the root `AGENTS.md`, plus:

1. Route uses `validate()` with Zod for body, query and params.
2. Auth and ownership are enforced, with tests for `401`, `403` and cross-user access.
3. Errors use the standard shape with a stable `code`.
4. Layering respected: Prisma only in repositories, no business logic in controllers.
5. Schema changes come with a new migration, never an edited old one.
6. Sensitive data is not logged. Rate limits are set for new costly or abusable endpoints.
7. Tests cover success and failure paths and pass against the test database.