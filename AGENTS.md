# DayDaily (daydaily.in)

Voice-first grocery and daily-needs ordering for households in small towns in India.
The user speaks their needs, AI builds the cart, the user confirms, a nearby partner kirana store fulfils the order.

Read `docs/PLAN.md` before starting any task. Read `docs/DESIGN.md` before touching any UI.

## Product rules (never break these)

1. **Never place an order without explicit user confirmation.** Voice builds the cart; the user confirms it.
2. **Voice first, not voice only.** Every voice action must also work by tap.
3. **Never guess silently.** If an item is ambiguous ("oil"), ask a short clarifying question.
4. **Log every transcript and every user correction.** They improve future matching.
5. **Users are not technical.** Plain words, big buttons, few choices per screen.

## Monorepo layout

```
apps/web              Customer PWA (React + Vite)
apps/store-dashboard  Shop owner panel (React)
apps/admin            Admin panel (React)
apps/api              Node.js backend (Express + Prisma)
packages/shared       Zod schemas, types, constants
packages/ui           Shared React components
packages/config       ESLint, TypeScript, Tailwind configs
docs/                 PLAN.md, DESIGN.md, notes
```

Each app has its own `AGENTS.md`. The closest file to the code you are editing wins.

## Tech stack

React 18, Vite, TypeScript, Tailwind, TanStack Query, Zustand, react-i18next.
Node.js, Express, Zod, Prisma, PostgreSQL, Redis, BullMQ, Socket.IO.
Speech-to-text and LLM sit behind interfaces so providers can be swapped.

## Commands

Package manager is **pnpm**. Do not use npm or yarn.

```bash
pnpm install                          # install all dependencies
docker compose up -d                  # start Postgres and Redis
pnpm dev                              # run everything
pnpm --filter @daydaily/web dev       # run one app
pnpm --filter @daydaily/api dev
pnpm lint                             # ESLint
pnpm typecheck                        # tsc --noEmit across the repo
pnpm test                             # unit tests (Vitest)
pnpm build                            # production build
pnpm --filter @daydaily/api prisma migrate dev --name <name>   # new migration
```

## Coding standards

- **TypeScript strict mode. No `any`.** Use `unknown` and narrow it. No `@ts-ignore` without a comment explaining why.
- **Zod schemas in `packages/shared` are the single source of truth** for API request and response types. Do not redefine them in apps.
- Validate every API input with Zod. Never trust client data, including prices and totals.
- Function components and hooks only. No class components.
- Named exports, except for route pages.
- Small files. If a file passes about 250 lines, split it.
- Prefer clear names over comments. Comment the "why", not the "what".
- No hardcoded UI text. Use `t('key')` and add keys to every language file (`en`, `hi`, `ml`).
- Money is stored as integer paise, never floats.
- No `console.log` in committed code. Use the logger.
- Do not add a dependency without a good reason. Check if the repo already has one that does the job.

## Design principles (summary)

Simple and minimal, so anyone understands it at first glance. Full rules are in `docs/DESIGN.md`.

- Near-white background, light grey rounded surfaces, black primary buttons with white text.
- Pill-shaped buttons and filter chips. Generous spacing. No visual clutter.
- **One primary action per screen.** On the customer app it is the big **Speak** button, fixed at the bottom centre.
- Red is used only for the recording state. Avoid extra accent colours.
- Large touch targets (at least 48px). Readable text (at least 16px). Works at 360px width.

## Git and commits

- Branch names: `feat/<name>`, `fix/<name>`, `chore/<name>`.
- Commit messages follow Conventional Commits: `feat(web): add voice cart screen`.
- One logical change per commit. Keep pull requests small.
- Never commit directly to `main`.
- Never force-push a shared branch.

## Never touch (ask first)

- Existing files in `apps/api/prisma/migrations/`. Create a new migration instead.
- `.env`, `.env.*` and any secrets. Only edit `.env.example`.
- `pnpm-lock.yaml` by hand.
- Payment webhook signature checks, auth middleware and rate limiting, unless the task is about them.
- Generated files (Prisma client, build output).

## Definition of done

A task is finished only when all of these pass:

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. New logic has tests. Bug fixes have a regression test.
5. UI works at 360px width and follows `docs/DESIGN.md`.
6. New text is added to all language files.
7. `docs/PLAN.md` checklist is updated.

If you cannot run a check, say so. Do not claim it passed.

## When unsure

Ask a short question instead of guessing, especially about money, orders, auth and database changes.