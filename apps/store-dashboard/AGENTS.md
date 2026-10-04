# apps/store-dashboard: Shop Owner Panel

The screen a kirana shopkeeper keeps open all day to receive and fulfil orders. Place this file at `apps/store-dashboard/AGENTS.md`.
Root rules in `/AGENTS.md` still apply. Visual rules live in `/docs/DESIGN.md`; this file only lists what differs for the dashboard.

## Who uses this

A busy shopkeeper, often not tech-savvy, working in a noisy shop with wet or dusty hands. They glance at a tablet or old PC on the counter between customers. They may have a basic phone and an unstable connection.

**The golden rule: a new order must never be missed, and the next action must always be obvious.**

## Commands

```bash
pnpm --filter @daydaily/store-dashboard dev
pnpm --filter @daydaily/store-dashboard build
pnpm --filter @daydaily/store-dashboard test
pnpm --filter @daydaily/store-dashboard e2e      # Playwright at tablet viewport
```

## Structure

```
src/
  pages/
    Orders.tsx        Home. Incoming, in progress, done (tabs)
    OrderDetail.tsx   Items, customer, address, actions
    Inventory.tsx     Stock on/off and prices
    Settings.tsx      Shop open/close, sound, language
    Login.tsx
  features/
    orders/           list, cards, status actions, alert logic
    alerts/           sound, wake lock, notifications, connection status
    inventory/
    auth/
  components/  hooks/  lib/  i18n/  store/
```

Same data conventions as `apps/web`: TanStack Query for server state, Zustand for client state, Zod schemas from `packages/shared`.

## Layout rules

- **Tablet first (768 to 1024px), then desktop (1280px and up).** It must also stay usable at 360px as a fallback.
- Same colours, radius and tokens as `DESIGN.md`. Only the type and spacing scale up:
  - Base text **18px**, titles 24px, order total 32px.
  - Touch targets at least **56 x 56px** for main actions, 48px for the rest.
- Two-column layout on tablet and desktop: order list on the left, selected order detail on the right. Single column on phones.
- Maximum 4 navigation items: **Orders, Inventory, Settings**. No hidden menus, no hamburger.
- Never put the main action inside a menu, dropdown or hover state.
- Landscape and portrait must both work.
- Use plain words a shopkeeper uses: "New order", "Accept", "Ready", "Out for delivery". No technical terms like "status", "payload" or "ID" in the UI.

## Real-time order alerts (most important)

This is the core of the app. Treat it as safety critical.

**Connection**
- Use Socket.IO (or SSE) with automatic reconnect and exponential backoff.
- On every reconnect and on tab focus, refetch the orders list so nothing is missed while disconnected.
- As a fallback, poll the orders endpoint every 20 seconds if the socket is down.
- Always show a **connection indicator** in the header: green "Online", amber "Reconnecting...", red "No internet". If not online, show a clear banner: "You may miss new orders".

**Alert behaviour**
1. A new order triggers a **looping sound** until the shopkeeper acts. It must not stop on its own.
2. The new order card appears at the top with a strong visual cue (highlighted border, "New order" label), never hidden behind a tab or scroll.
3. Update the page title and favicon badge: `(2) New orders`.
4. Show a browser notification when the tab is in the background (ask permission after login with a clear explanation).
5. Sound stops when the order is accepted or rejected, or after the shopkeeper taps "Mute for now" (it resumes for the next new order).
6. If an order stays unanswered for **2 minutes**, repeat louder and highlight it in `warn`. At **5 minutes**, auto-flag it for admin follow-up. Never silently auto-reject.

**Browser rules for sound and screen**
- Browsers block audio until the user interacts. On login, show a big **"Start taking orders"** button that unlocks audio. Do not show orders without it.
- Request a **Screen Wake Lock** so the tablet does not sleep while the shop is open. Re-acquire it when the tab becomes visible.
- Preload the sound file. Keep it small (under 100 KB) and loud and clear. Provide a "Test sound" button in Settings.
- Add a volume setting but never allow fully silent while "Open for orders" is on. Warn the shopkeeper if the device volume is muted.
- Keep a short service worker only for notifications. Do not cache API responses.

## Order actions

Each order card shows: customer first name, item count, total, time waiting, delivery or pickup, payment type (UPI paid or Cash on delivery).

**Status flow, one big button for the next step only:**

`New` -> **Accept** or **Reject** -> `Accepted` -> **Mark packed** -> `Packed` -> **Out for delivery** -> `Delivered`

Rules:
- **Accept and Reject** are the two largest buttons on a new order. Accept is black, Reject is `surface` with `danger` text. Side by side, each at least 64px high, with space between them so they are not tapped by mistake.
- **Reject requires a reason** from a short list (Out of stock, Shop closing, Too far, Other). One tap, no typing needed.
- Show only the next valid action. Do not show buttons for steps that cannot happen yet.
- Confirm destructive actions (Reject, Cancel) with a simple confirm sheet. Do not confirm Accept, because speed matters.
- **Optimistic UI with rollback.** Update the screen instantly, then confirm with the server. If it fails, revert and show "Couldn't update. Try again."
- Actions are idempotent. Double taps must not create duplicate updates. Disable the button while saving.
- Item list on the order shows a **tickable checklist** so the shopkeeper can pack item by item. Out-of-stock items can be marked "Not available" with one tap, which tells the customer.
- Show the customer's note, spoken transcript text and delivery address clearly. Offer a **Call customer** button (`tel:` link).
- Allow reprinting or sharing the order list as plain text for packing slips.

## Inventory and prices (keep it simple)

- Default view: a searchable list of the shop's items with a big **In stock / Out of stock** toggle per item.
- Tap an item to change its price. Numeric keypad only (`inputmode="numeric"`).
- Show the price in rupees. Store as integer paise.
- Quick actions: "Mark all out of stock for today", "Open for orders" and "Closed" switch at the top of Settings and visible in the header.
- Bulk changes need a confirm step. Show how many items will change.
- Never let the shopkeeper set a price of zero or an unreasonable price without a warning.
- Hide fields the shopkeeper does not need. No SKUs, barcodes or categories unless asked later.

## i18n

- Same rules as `apps/web`: no hardcoded strings, every key in `en`, `hi`, `ml`, no string concatenation.
- Let the shopkeeper choose the language at login and in Settings.
- Use short labels. Test long Hindi and Malayalam text on buttons so nothing is cut off.
- Sound alerts must not depend on language.

## Performance and reliability

- Must run well on a low-end Android tablet and an old Windows PC with Chrome.
- Initial JS budget: **200 KB gzipped**. Lazy-load Inventory and Settings.
- The orders page must stay responsive with 100+ orders in the day. Virtualize long lists and show only today's orders by default.
- Works on a weak connection. Show a skeleton, then data. Keep the last loaded orders visible with a "Last updated" time if the network drops.
- Do not let the page leak memory over a full 12-hour day (clean up socket listeners, timers and audio objects).
- Handle the browser tab being left open for days: refresh auth silently, and reload on a new version at a quiet moment (when no new order is waiting).

## Security and data

- Login with phone OTP. A shop user can only see **their own shop's** orders and inventory. The API enforces this; the UI must never assume it.
- Show only the customer data needed to fulfil an order (first name, phone for calling, address). No order history of other shops.
- Do not log customer phone numbers or addresses to the console or analytics.
- Auto-log out after a long period of inactivity on shared devices, but never while the shop is marked open and orders are active. Use a long-lived session with silent refresh instead.

## Accessibility

- Contrast of at least 4.5:1, since the screen is often seen in bright light.
- Do not rely on colour alone. New orders also have a text label and an icon.
- Visible focus ring and full keyboard support for desktop use.
- Sound is paired with a visual alert, and the visual alert is paired with sound, so either channel works alone.
- Use `aria-live="assertive"` for new order announcements.

## Testing

- Unit test the alert logic (loop start and stop, escalation timers, reconnect refetch).
- Playwright at 1024x768 and 768x1024: new order arrives, sound starts, accept stops sound, reject needs reason, reconnect catches up on missed orders.
- Mock the socket and audio. Never use the real payment or notification services in tests.
- Simulate offline, slow network and tab in the background.

## Definition of done (store dashboard)

Everything in the root `AGENTS.md`, plus:

1. Checked at 1024x768, 768x1024 and 360px.
2. A new order can never be missed: sound, visual cue, title badge and refetch on reconnect all work.
3. Accept and Reject are visible without scrolling and at least 64px high.
4. Every state is handled: loading, empty ("No orders yet. We'll alert you when one arrives."), offline and error.
5. No hardcoded strings. All keys exist in `en`, `hi` and `ml`.
6. A shop can only ever see its own data.