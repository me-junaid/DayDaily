# apps/web: Customer PWA

The app households use to order by voice. Place this file at `apps/web/AGENTS.md`.
Root rules in `/AGENTS.md` still apply. UI rules live in `/docs/DESIGN.md`. Read both before changing UI.

## Who uses this

Households in small towns. Many use cheap Android phones, slow networks, and a regional language. Some are older or not comfortable with apps. Build for them, not for a developer's laptop.

## Commands

```bash
pnpm --filter @daydaily/web dev        # dev server
pnpm --filter @daydaily/web build      # production build
pnpm --filter @daydaily/web preview    # test the built PWA locally
pnpm --filter @daydaily/web test       # Vitest + React Testing Library
pnpm --filter @daydaily/web e2e        # Playwright (mobile viewport)
pnpm --filter @daydaily/web analyze    # bundle size report
```

## Structure

```
src/
  pages/        One file per route. Thin: compose features, no business logic
  features/     voice/  cart/  orders/  auth/   (each owns its UI, hooks, api calls)
  components/   App-specific shared components. Generic ones go in packages/ui
  hooks/        Shared hooks
  lib/          api client, socket, analytics, utils
  i18n/         en.json, hi.json, ml.json
  store/        Zustand stores
```

Features do not import from each other's internals. Share through `packages/shared` or a feature's `index.ts`.

## Mobile-first rules

- Design at **360px width** first. Then check 412px and a small tablet. Never rely on hover.
- **Touch targets at least 48 x 48px**, with 8px between them.
- Body text at least 16px. Never below 14px anywhere.
- Primary actions sit in the bottom thumb zone (the Speak dock, the Confirm bar), never in the top corners.
- Respect safe areas: `env(safe-area-inset-bottom)` for fixed bottom elements.
- Use `100dvh`, not `100vh`, so mobile browser bars do not hide content.
- Inputs use the right `inputmode` and `autocomplete` (`tel`, `numeric`, `one-time-code` for OTP).
- Lock font size at 16px on inputs so iOS does not zoom.
- Support text scaling up to 130% without layout breaks. Never fix the height of text containers.

## Voice-first UX flow

The screen order is fixed. Do not add steps.

1. **Home:** big Speak dock. Optional "Your usuals" row.
2. **Listening:** recording state with waveform, auto-stop after 2.5s of silence or 60s total.
3. **Understanding:** short processing state.
4. **Cart confirmation:** "Is this right?" with editable items, cart read aloud by TTS.
5. **Clarify (only if needed):** bottom sheet with 2 to 4 options for an ambiguous item.
6. **Checkout:** address, payment (UPI or cash on delivery), one Confirm button.
7. **Tracking:** order status steps.

Rules:
- **Never place an order without the user pressing Confirm.** No auto-submit after voice.
- Every voice step has a tap or type alternative. Always keep a visible "Type instead" button.
- Handle microphone permission denied with a friendly screen, not a blank error.
- Voice state is a finite state machine: `idle | recording | processing | review | error`. Use one hook, `useVoiceOrder`, as the single owner of this state. Do not scatter recording logic across components.
- Keep the recorded audio in memory only until upload finishes. Do not store audio in localStorage.
- When the user edits a parsed item, send the correction to the API so it can be logged.
- Haptic feedback (`navigator.vibrate`) on start and stop, only where supported.

## i18n: no hardcoded strings

- **Every user-visible string uses `t('key')`.** This includes buttons, errors, placeholders, `aria-label`, `alt` and page titles.
- Keys are grouped by feature: `voice.listening`, `cart.confirmTitle`, `order.status.packed`.
- Add every new key to **all** language files (`en`, `hi`, `ml`) in the same change. Never leave a missing key.
- No string concatenation for sentences. Use interpolation: `t('cart.total', { amount })`.
- Use `Intl.NumberFormat` for money (`INR`) and `Intl.DateTimeFormat` for dates. Money is stored as integer paise and converted only for display.
- Plurals use i18next plural keys, not `if` statements.
- Do not set fixed widths on text. Hindi and Malayalam strings are often longer than English.
- Speech language (STT and TTS) follows the user's chosen language setting.

## Performance budget (low-end Android)

Test target: a budget Android phone with a slow 3G or 4G connection.

| Metric | Budget |
|---|---|
| Initial JS, gzipped | 150 KB or less |
| Largest Contentful Paint | 2.5 s or less on slow 4G |
| Interaction to Next Paint | 200 ms or less |
| Layout shift (CLS) | 0.1 or less |
| Single image | 30 KB or less, WebP, with width and height set |

How:
- Route-level code splitting with `React.lazy`. Lazy-load the checkout, tracking and map code.
- Do not add a heavy dependency (more than 20 KB gzipped) without checking `pnpm analyze` and asking first. No moment.js, no lodash full import.
- Lazy-load images below the fold. Use skeletons, never blank screens.
- Avoid unnecessary re-renders. Memoize only where profiling shows a problem.
- Lists over 50 items must be virtualized.
- Animate only `transform` and `opacity`.
- Do not run the audio waveform at more than 30 fps.
- Fonts: self-host, subset, and use `font-display: swap`.

## PWA rules

- Built with `vite-plugin-pwa` (Workbox). The manifest has name, short name "DayDaily", icons (192, 512, maskable), `display: standalone`, and a `theme_color` matching `bg`.
- **Precache the app shell only.** Use network-first for API calls. Never cache authenticated API responses in the service worker.
- **Never cache or replay order placement offline.** If offline, keep the cart saved locally and show the offline banner. Let the user submit when back online.
- Show a friendly "Update available" prompt. Do not reload the page silently while the user is mid-order.
- Show an install prompt only after a successful first order, never on first visit.
- The offline page must work without any network and be translated.
- HTTPS is required for the microphone and service worker. Test with `pnpm preview`, not just `dev`.

## Data and state conventions

**TanStack Query = server state. Zustand = client state.** Never put server data in Zustand.

TanStack Query:
- All API calls go through `lib/api.ts` (typed with `packages/shared` Zod schemas). No raw `fetch` in components.
- Query keys come from a key factory per feature: `orderKeys.detail(id)`, never inline arrays.
- Set sensible `staleTime` (catalog: 5 min, orders: 0, usuals: 1 min).
- Mutations invalidate the related keys. Use optimistic updates only for cart edits.
- Always handle `isLoading`, `isError` and empty states with the patterns in `DESIGN.md`.
- Retry network errors up to 2 times. Do not retry 4xx errors.

Zustand:
- Small stores per concern: `useCartStore`, `useSessionStore`, `useLanguageStore`.
- Persist only the draft cart and language. Never persist tokens in localStorage if a safer option exists. Use httpOnly cookies when the API supports it.
- Select narrow slices: `useCartStore((s) => s.items)`. Never subscribe to the whole store.
- Keep stores free of side effects. Do async work in hooks or Query mutations.

Forms: React Hook Form with Zod resolvers using the shared schemas.

## Accessibility

- Every icon-only button has an `aria-label` via `t()`.
- Visible focus ring on all interactive elements (2px `ink`, 2px offset).
- Do not rely on colour alone. Pair it with text or an icon.
- Announce state changes to screen readers with `aria-live="polite"` (for example "Listening", "Cart ready").
- The recording state is exposed as a labelled button with `aria-pressed`.
- Respect `prefers-reduced-motion`.
- Use semantic HTML (`button`, `nav`, `main`, `ul`), not clickable `div`s.

## Security and privacy

- Never log phone numbers, addresses or transcripts to the console or analytics.
- Do not trust or compute prices on the client for ordering. Show them, but the API sets the final amount.
- Sanitize anything rendered from the API or from LLM output. No `dangerouslySetInnerHTML`.
- Ask for microphone permission only when the user taps Speak, not on page load.
- Analytics events are anonymous: no PII.

## Testing

- Unit test hooks and reducers (`useVoiceOrder`, cart logic).
- Component tests with React Testing Library: test what the user sees, not implementation.
- E2E (Playwright, 360x640 viewport): voice order happy path using a mocked recorder, ambiguous item, offline cart, permission denied.
- Mock STT and LLM responses with fixtures. Never call paid services in tests.

## Definition of done (web)

Everything in the root `AGENTS.md`, plus:

1. Checked at 360px and in a 130% text size.
2. No hardcoded strings. All keys exist in `en`, `hi` and `ml`.
3. Loading, empty, error and offline states are handled.
4. Touch targets are 48px or more.
5. `pnpm analyze` shows initial JS still within budget.
6. The user cannot place an order without pressing Confirm.