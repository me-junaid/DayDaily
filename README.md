# DayDaily (daydaily.in)

> Voice-first grocery ordering PWA for small towns in India.

## Monorepo Layout
- `apps/web`: Customer PWA (React + Vite)
- `apps/store-dashboard`: Shop Owner Panel (React + Vite)
- `apps/admin`: Admin Operations Panel (React + Vite)
- `apps/api`: Backend REST & WebSocket API (Express + Prisma + Postgres + Redis)
- `packages/shared`: Zod schemas & types
- `packages/ui`: Shared UI design system & components
- `packages/config`: Shared configs (TS, ESLint, Tailwind)

## Getting Started

### Prerequisites
- Node.js `>= 20` (`.nvmrc` provided)
- `pnpm >= 9`
- Docker & Docker Compose

### Setup
```bash
# Install dependencies
pnpm install

# Start local Postgres + Redis
docker compose up -d

# Copy environment variables
cp .env.example .env

# Run database migrations & seed
pnpm --filter @daydaily/api db:migrate
pnpm --filter @daydaily/api db:seed

# Start all apps in dev mode
pnpm dev
```
# DayDaily
