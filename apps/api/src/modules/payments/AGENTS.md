# modules/payments: Razorpay (UPI) and Cash on Delivery

Handles money. Place this file at `apps/api/src/modules/payments/AGENTS.md`.
Root rules in `/AGENTS.md` and `apps/api/AGENTS.md` still apply. **A bug here loses real money or double-charges a customer. Be slow and careful, and ask before changing anything marked "ask first".**

> Razorpay details below reflect the Orders API, Checkout and webhooks as commonly documented. Before implementing, confirm field names, header names and event names against the current Razorpay docs.

## The non-negotiables

1. **Never trust the client for money.** The client sends cart or order ids, never amounts. The server calculates every amount from the database.
2. **Verify every signature.** Checkout callbacks and webhooks are both verified before any state change.
3. **Everything is idempotent.** Retries, double taps and repeated webhooks must never charge twice, refund twice or mark an order paid twice.
4. **The webhook is the source of truth for payment status.** The browser callback only speeds up the UI.
5. **Money is integer paise.** No floats, ever. Currency is always `INR`.
6. **Secrets stay in env.** Never log, return or commit them.

## Structure

```
payments/
  payments.routes.ts / .controller.ts / .service.ts / .repository.ts / .schemas.ts
  providers/
    razorpay.client.ts        Only file that imports the Razorpay SDK
    payment-provider.ts       Interface (createOrder, fetchPayment, refund, verify...)
  webhooks/
    razorpay.webhook.ts       Route + signature check + event dispatch
    handlers/                 One handler per event type
  cod/
    cod.service.ts            Cash on delivery logic
  amounts.ts                  Server-side total calculation helpers
  payments.test.ts  fixtures/
```

Only `providers/razorpay.client.ts` may import the Razorpay SDK. The rest of the app uses the `PaymentProvider` interface, so the provider can change.

## Server-side amounts (never trust the client)

- The client calls `POST /payments/razorpay/orders` with `{ orderId }` only.
- The server loads the order from the database, **recomputes** items, delivery fee, discounts and total from current DB prices, and ignores any amount in the request.
- The computed total is saved on the order (`totalPaise`) **before** creating the Razorpay order, and the Razorpay order is created with exactly that amount.
- Reject any request that includes an `amount` field (Zod `.strict()`).
- On payment verification, **compare the amount Razorpay reports with `order.totalPaise`**. If they differ, do not mark the order paid. Flag it for review and alert.
- Check currency is `INR` and the payment belongs to the Razorpay order we created for this order.
- If the cart or prices change after the Razorpay order was created, create a new Razorpay order. Do not reuse an old one with a stale amount.
- Minimum online amount is 100 paise (check current Razorpay limits).

## Online payment flow (UPI)

1. App calls `POST /payments/razorpay/orders` with `{ orderId }` and an `Idempotency-Key`.
2. Server verifies the order belongs to the logged-in user and is `pending_payment`.
3. Server creates a Razorpay order (`amount` in paise, `currency: 'INR'`, `receipt: order.id`, `notes: { orderId }`). If a valid unpaid Razorpay order already exists for this order, return it instead of making another.
4. Server returns `{ razorpayOrderId, amountPaise, keyId }`. The `key_id` is public; the **key secret is never sent**.
5. App opens Razorpay Checkout.
6. On success, Checkout returns `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`. App calls `POST /payments/razorpay/verify` with those three values.
7. Server verifies the signature (below). If valid, it marks the payment `authorized_pending_webhook` or `paid` only if allowed by the state machine, and the UI shows "Payment received".
8. **The webhook finalises the state.** Order moves to `placed` and the shop is notified only once the payment is confirmed as paid or captured.
9. If the user closes the app mid-payment, the webhook still completes the order. If no webhook arrives within a few minutes, a reconciliation job fetches the payment status from Razorpay.

### Checkout signature verification

```ts
// HMAC SHA256 of "<razorpay_order_id>|<razorpay_payment_id>" using the API KEY SECRET
const expected = crypto
  .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
  .update(`${orderId}|${paymentId}`)
  .digest('hex');
// Compare with crypto.timingSafeEqual on equal-length buffers
```

- Use **constant-time comparison** (`timingSafeEqual`). Never `===`.
- Verify that `razorpay_order_id` matches the Razorpay order stored for this order.

## Webhooks

Route: `POST /webhooks/razorpay`. No user auth; security comes from the signature.

**Signature verification (critical)**
- The signature is in the `X-Razorpay-Signature` header. It is an HMAC SHA256 of the **raw request body** using the **webhook secret**, which is **different from the API key secret**. Keep them as separate env vars (`RAZORPAY_WEBHOOK_SECRET`).
- Mount this route with `express.raw({ type: 'application/json' })` **before** the global JSON parser. If the body is parsed and re-stringified, the signature will fail. Never verify against `JSON.stringify(req.body)`.
- Verify first. If invalid, return `400` and log a warning with the request id (no body). Do nothing else.
- Parse and validate the body with Zod after verifying.

**Processing**
- Respond `200` quickly (Razorpay expects a fast reply and retries failures for a long time). Do the heavy work in a BullMQ job, or keep handlers very small and fast.
- **Deduplicate by event id** (`X-Razorpay-Event-Id` header). Store each processed event id in `payment_events` with a unique constraint. If it already exists, return `200` and do nothing.
- Handlers must be **order-independent**. Events can arrive late or out of order (for example `order.paid` before `payment.captured`). Use the state machine to ignore stale or invalid transitions, not crash.
- Handle at least: `payment.authorized`, `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`, `refund.failed`. Log and acknowledge unknown events with `200`.
- Always re-check the amount, currency and order mapping before marking anything paid.
- Unknown order or payment reference: store the event, return `200`, and raise an alert for manual review.
- Never trust data in the webhook alone for money decisions if it looks inconsistent. When in doubt, fetch the payment from the Razorpay API and compare.

## Idempotency

- Every mutating endpoint (`create order`, `verify`, `refund`, `mark COD collected`) accepts an `Idempotency-Key` header. Store the key with the request hash and result. A repeat with the same key and same body returns the saved result. Same key with a different body returns `409`.
- Database constraints back it up: unique on `(provider, providerPaymentId)`, unique on `(provider, providerEventId)`, unique on refund idempotency key.
- State changes use transactions with row locking (`SELECT ... FOR UPDATE` or an optimistic version column) so two simultaneous webhooks cannot both move an order forward.
- Calls to Razorpay that create things (orders, refunds) use our own idempotency key or a deterministic `receipt` so a retry does not create duplicates.
- A paid order can be marked paid only once. Marking paid again is a no-op, not an error.

## Payment state machine

One place defines allowed transitions (`payment.state.ts`). Nothing sets status directly.

```
created -> attempted -> authorized -> captured (paid)
                     \-> failed
captured -> refund_pending -> refunded | partially_refunded
COD:  cod_pending -> cod_collected | cod_failed
```

- Terminal states never move back.
- Every transition writes an **append-only `payment_events` row** (who or what caused it, old state, new state, provider ids, timestamp). Never edit or delete these rows.
- The order status depends on payment status through the orders service. The payments module emits an event after the transaction commits. It does not edit orders directly.
- Prefer Razorpay auto-capture. If manual capture is used, capture explicitly, with idempotency, and handle uncaptured payments that will auto-refund.

## Cash on Delivery (COD)

- COD is a payment method on the order, not a separate flow. The payment row starts as `cod_pending`.
- The order is `placed` immediately, since no online payment is needed. Because of fraud and refusal risk, apply rules from config (`cod.rules.ts`), never hardcoded in UI:
  - Maximum COD order value (start with a low limit, for example Rs 2,000, and tune later).
  - Lower limit for first-time users.
  - COD disabled for users with repeated refusals or fake orders.
  - COD only within the delivery area, as set by the store.
- **Totals are still computed on the server.** The amount to collect is shown to the customer, shop and delivery person from the same server value.
- Collection:
  - Delivery person or shop taps **"Cash collected"** in the app with the amount. The server checks that it equals `totalPaise`. A different amount needs a reason and is flagged.
  - Moves the payment to `cod_collected` once, idempotently, and writes an audit entry.
  - If the customer refuses or is absent, mark `cod_failed` with a reason, and update the order through the orders service.
- Rounding: charge the exact total. If the shop wants to round cash, that is a recorded discount, not a hidden change.
- **Daily COD reconciliation:** a job lists COD collected per shop and per delivery person for the admin to settle. Differences are flagged. Money flow to shops is handled by payouts (admin, finance role), not here.
- COD orders cannot be refunded to a card or UPI. Refunds for COD are recorded as manual adjustments, approved by finance, and audited.

## Refunds

- Only `finance` or `owner` capability can approve (`payments.refund`). Support can only request.
- Refund amount cannot exceed `captured - already refunded`. Check inside a transaction.
- Create refunds through the provider interface with an idempotency key. The final state arrives by `refund.processed` or `refund.failed` webhooks.
- Every refund needs a reason and writes an audit entry.
- Cancel flow: if an order is cancelled after payment, create the refund automatically, flagged for finance review above a set amount.

## Test mode rules

- Two env sets: `RAZORPAY_KEY_ID` starting `rzp_test_` for development and staging, and `rzp_live_` for production only. Validate this in `config/env.ts`:
  - If `NODE_ENV=production` and the key is not `rzp_live_`, **refuse to start**.
  - If `NODE_ENV` is not production and the key is `rzp_live_`, **refuse to start**.
- Live keys are **never** present on a developer machine, in CI, or in `.env.example`. Only the production host holds them.
- Use a separate webhook secret and a separate webhook URL for test and live.
- Show a visible "TEST MODE" banner in the app and admin when running with test keys.
- Use Razorpay's test cards and test UPI details from the docs. Never use real payment details in tests.
- Automated tests mock `PaymentProvider`. They do not call Razorpay. For webhook tests, generate signatures with a test secret in the test code.
- Use a tunnel (for example ngrok) for local webhook testing, and remove it after.
- Going live is a checklist, not a code change: live keys in the host env, live webhook configured, one real small payment and refund tested end to end.

## Security and logging

- Never log: card or UPI details, key secrets, webhook secrets, full signatures, or full payloads. Log provider ids (`order_...`, `pay_...`), our order id, amount, state change and request id.
- Never return provider error bodies to the client. Map to our error codes (`PAYMENT_FAILED`, `PAYMENT_AMOUNT_MISMATCH`, `PAYMENT_ALREADY_PAID`, `PAYMENT_SIGNATURE_INVALID`).
- Rate limit payment endpoints per user. The webhook is not rate limited by user, but verify the signature before any work. Optionally allowlist Razorpay IPs at the proxy as an extra layer, not as a replacement.
- Ownership checks: a user can only create or verify payments for their own orders.
- Alert (Sentry or similar) on: signature failures spike, amount mismatches, webhooks for unknown orders, payments stuck in `attempted` over 15 minutes, failed refunds.

## Reconciliation job

- Runs every few minutes (BullMQ): finds payments in `created`, `attempted` or `authorized` older than 10 minutes, fetches the real status from Razorpay, and applies the same state machine.
- Runs daily: compares our captured totals with Razorpay's settlement report and flags differences for finance.
- This job must also be idempotent and safe to run twice.

## Testing

- Unit test the state machine: every valid and invalid transition.
- Unit test signature verification with known good and bad signatures, including modified body and wrong secret.
- Integration tests (real test Postgres, mocked provider):
  - Amount from the client is ignored. Cart changes force a new Razorpay order.
  - Duplicate webhook (same event id) changes nothing.
  - Out-of-order webhooks end in the correct state.
  - Two simultaneous webhooks for one payment do not double-process.
  - Amount mismatch is not marked paid.
  - COD limit enforced, COD collected twice is a no-op, wrong amount is flagged.
  - Refund above the paid amount is rejected, duplicate refund request returns the same refund.
- Test that the app refuses to start with mismatched test and live keys.

## Ask first

Stop and ask the human before:
- Changing signature verification, the state machine, or amount calculation.
- Changing webhook handling, idempotency storage, or the `payment_events` table.
- Adding a new payment provider or method.
- Changing refund rules or COD limits.
- Any migration touching payment tables.

## Definition of done (payments)

Everything in the root and API `AGENTS.md`, plus:

1. No amount from the client is used anywhere. Totals come from the database.
2. Signatures are verified with constant-time comparison. The webhook uses the raw body and the webhook secret.
3. Every mutating path is idempotent, with database constraints and a test proving it.
4. State changes go through the state machine and write an append-only event row.
5. Test and live key rules are enforced at startup.
6. Nothing sensitive is logged. Errors use our own codes.
7. Tests cover duplicates, out-of-order events, mismatches and race conditions.