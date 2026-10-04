# DayDaily Plan

Place this file at `docs/PLAN.md`. Read it before starting any task. Update it when a task is finished.

## Current status

- **Current phase:** Phase 1 - Foundation
- **Current focus:** Monorepo setup, database schema, phone login
- **Do not build yet:** delivery partner app, admin panel, WhatsApp channel, multi-city support
- **Target town / language:** _to be decided_ (set in Phase 0)

## Decisions log

Record decisions here so they are not re-debated. Add a date.

| Date | Decision | Why |
|---|---|---|
| _yyyy-mm-dd_ | Speech-to-text provider: _TBD_ | Choose after testing real voice samples |
| _yyyy-mm-dd_ | LLM for item extraction: _TBD_ | Strict JSON output, low cost |
| _yyyy-mm-dd_ | Launch language: _TBD_ | Decides the STT provider and seed aliases |

## How to use this file

- Work on one phase at a time, top to bottom.
- Mark tasks `[x]` only when they meet the Definition of Done in the root `AGENTS.md`.
- If you add a task, put it under the right phase. Do not start a later phase early.
- Keep this file short. Move long notes to `docs/`.

---

## Phase 0: Validation (2 to 3 weeks, mostly no code)

Goal: prove people in one town will order this way, before building much.

- [ ] Pick one town and one launch language
- [ ] Sign up 5 to 10 partner kirana stores
- [ ] Collect orders through WhatsApp voice notes and fulfil them manually
- [ ] Record 50+ real voice samples and test speech-to-text accuracy
- [ ] Track repeat rate, average basket size, delivery cost per order
- [ ] Register domain daydaily.in and check the name is easy to say aloud
- [ ] Check GST and FSSAI requirements

**Exit check:** households reorder, baskets cover delivery cost, and at least one STT provider handles the local language well.

## Phase 1: Foundation (2 weeks)

- [ ] Set up monorepo (pnpm workspaces + Turborepo)
- [ ] Add shared configs: ESLint, TypeScript strict, Tailwind with design tokens
- [ ] Add `docker-compose.yml` for Postgres and Redis
- [ ] Set up GitHub Actions: lint, typecheck, test
- [ ] Design the Prisma schema (users, addresses, stores, products, product_aliases, store_inventory, orders, order_items, payments, voice_logs, user_preferences)
- [ ] Seed 500 to 1,000 common items with aliases in the launch language
- [ ] Phone OTP login with JWT
- [ ] PWA shell: manifest, icons, install prompt, offline page
- [ ] i18n setup with English plus launch language
- [ ] Build base UI components in `packages/ui` from `docs/DESIGN.md`

**Exit check:** a user can install the PWA, log in with a phone OTP, and see an empty Home screen with the Speak dock.

## Phase 2: Voice Ordering Core (3 to 4 weeks)

- [ ] Mic recording with MediaRecorder, silence auto-stop, permission handling
- [ ] Audio upload endpoint
- [ ] STT service behind a swappable interface
- [ ] LLM extraction prompt with strict JSON output and Zod validation
- [ ] Fuzzy matching with `pg_trgm` plus product aliases
- [ ] Use past purchases to resolve ambiguity ("rice" means the usual brand)
- [ ] Clarifying question flow ("Which oil: sunflower or coconut?")
- [ ] Cart confirmation screen with editable items
- [ ] Text-to-speech read-back of the cart
- [ ] "Type instead" fallback
- [ ] Log every transcript, parsed result and user correction in `voice_logs`
- [ ] Evaluation set of real voice samples with an accuracy score script

**Exit check:** at least 85% of test orders produce a correct cart with at most one correction.

## Phase 3: Orders, Store Side and Payments (3 weeks)

- [ ] Order lifecycle: placed, accepted, packed, out for delivery, delivered, cancelled
- [ ] Store dashboard: login, incoming orders, accept/reject with sound alert
- [ ] Store inventory and price management
- [ ] Real-time updates (Socket.IO or SSE)
- [ ] Address entry, map pin and delivery radius check
- [ ] Cash on delivery
- [ ] Razorpay UPI with verified webhooks and idempotency
- [ ] Order tracking screen
- [ ] SMS or WhatsApp status notifications
- [ ] Minimum order value and delivery fee rules

**Exit check:** a full order goes from voice to delivered, with payment recorded, without manual intervention.

## Phase 4: Pilot Launch (2 to 4 weeks)

- [ ] Onboard 30 to 50 real households in the one town
- [ ] "Order my usual" reorder and order history
- [ ] Sentry error tracking and PostHog (or GA) analytics
- [ ] Fix voice errors found in real use and add new aliases
- [ ] Test on low-end Android phones and slow networks
- [ ] Support contact (phone or WhatsApp) shown in the app
- [ ] Weekly review of metrics: orders per day, repeat rate, voice accuracy, delivery cost

**Exit check:** steady weekly repeat orders and delivery cost per order under control.

## Phase 5: WhatsApp Channel (2 to 3 weeks)

- [ ] Connect WhatsApp Business Cloud API and verify webhook
- [ ] Accept voice notes and text messages
- [ ] Reuse the same voice pipeline
- [ ] Reply with a confirmation list and quick-reply buttons
- [ ] Send order updates and payment links using approved templates
- [ ] Respect the 24-hour session window

## Phase 6: Scale and Optimize (ongoing)

- [ ] Personalization: learn each household's usual brand and quantity
- [ ] Delivery partner assignment (and app if needed)
- [ ] Delivery slots
- [ ] Admin panel: stores, catalog, orders, payouts
- [ ] Credit / khata for trusted regular customers
- [ ] pgvector semantic search
- [ ] More languages
- [ ] Expand town by town, and evaluate ONDC integration

---

## Key risks to watch

| Risk | How to check |
|---|---|
| Speech-to-text accuracy in local dialects | Evaluation set score in Phase 0 and 2 |
| Store adoption | Number of stores actively accepting orders each week |
| Delivery cost per order | Track per order from Phase 0 |
| Competing with the local shopkeeper on WhatsApp | Repeat rate and reasons for churn |

## Session notes

Use this section as a short handoff between coding sessions. Keep only the latest few notes.

- _Last session:_ 
- _Next step:_ 
- _Blockers:_