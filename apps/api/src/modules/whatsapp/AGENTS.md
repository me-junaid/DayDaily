# modules/whatsapp: WhatsApp Business Channel

Second ordering channel plus order notifications, using the WhatsApp Business Cloud API. Place this file at `apps/api/src/modules/whatsapp/AGENTS.md`.
Root rules in `/AGENTS.md` and `apps/api/AGENTS.md` still apply. Voice rules from `modules/voice/AGENTS.md` and money rules from `modules/payments/AGENTS.md` apply to everything that flows through here.

**Build this in Phase 5**, after the PWA pilot works. Do not start it earlier.

> Meta changes API versions, template rules and pricing often. Before implementing, confirm webhook fields, header names, limits and template categories against the current WhatsApp Cloud API docs. Pin the Graph API version in config (`WHATSAPP_GRAPH_VERSION`) and never hardcode it in code paths.

## Why this channel matters

Small-town users already order from shopkeepers by WhatsApp voice notes. This channel meets them where they are: send a voice note, get a cart back, tap Confirm. It must feel like chatting with a helpful shopkeeper, not filling a form.

## The non-negotiables

1. **Verify every inbound webhook.** Handshake token on setup, HMAC signature on every POST.
2. **Respect the 24-hour window.** Free-form messages only inside it. Outside it, approved templates only.
3. **Reuse the voice pipeline.** No second copy of STT, extraction or matching in this module.
4. **Never place an order without an explicit Confirm tap** on a cart the user was shown, with the server-calculated total.
5. **Only message people who opted in,** and honour STOP immediately.
6. **Be idempotent.** Meta retries webhooks. The same message must never create two carts or two orders.

## Structure

```
whatsapp/
  whatsapp.routes.ts            GET + POST /webhooks/whatsapp
  webhook/
    verify.ts                   GET handshake + signature check
    parser.ts                   Zod schemas for inbound payloads
    dispatcher.ts               Routes message / status events to handlers
  handlers/
    audio.handler.ts            Voice notes -> voice pipeline
    text.handler.ts             Typed orders and commands
    interactive.handler.ts      Button and list replies
    location.handler.ts         Shared delivery location
    status.handler.ts           sent / delivered / read / failed
  session/
    session.store.ts            Redis conversation state
    window.ts                   24-hour window logic
  outbound/
    sender.ts                   Only place that calls the Graph API to send
    templates.registry.ts       Approved templates and their variables
    messages.ts                 Builders for text, buttons, lists
    media.ts                    Download inbound media
  whatsapp.service.ts  whatsapp.repository.ts  whatsapp.test.ts  fixtures/
```

Only `outbound/sender.ts` and `outbound/media.ts` talk to the Graph API. Everything else uses them, so the provider can be mocked in tests.

## Webhook verification

**Setup handshake (GET `/webhooks/whatsapp`)**
- Meta sends `hub.mode`, `hub.verify_token` and `hub.challenge`.
- If `hub.mode === 'subscribe'` and `hub.verify_token` equals `WHATSAPP_VERIFY_TOKEN`, respond `200` with the `hub.challenge` value as plain text. Otherwise `403`.
- Compare the token in constant time.

**Every event (POST `/webhooks/whatsapp`)**
- Verify the `X-Hub-Signature-256` header: `sha256=` followed by an HMAC SHA256 of the **raw request body** using the **App Secret** (`WHATSAPP_APP_SECRET`).
- Mount the route with `express.raw({ type: 'application/json' })` **before** the global JSON parser. Never verify against re-stringified JSON.
- Compare with `crypto.timingSafeEqual` on equal-length buffers. On failure return `401`, log a warning with the request id (no body), and do nothing else.
- Validate the parsed body with Zod. Ignore unknown fields and unknown event types, but return `200`.
- **Respond `200` fast.** Enqueue the work in BullMQ and return. Do not run STT or LLM inside the request. Meta retries slow or failing webhooks, which causes duplicates.
- **Deduplicate by message id** (`wamid...`). Store processed ids in Redis with a TTL (7 days) and in the database with a unique constraint. A repeat returns `200` and does nothing.
- Status events (sent, delivered, read, failed) are processed separately and update the outbound message log.
- Ignore events for phone number ids that are not ours.

## 24-hour session window

- A **user-initiated** message opens or refreshes a 24-hour customer service window. Save `lastInboundAt` per phone number.
- `window.ts` exports `isWindowOpen(phone)`, based on the last inbound message and a fake-able clock for tests.
- **Inside the window:** free-form text, buttons, lists, and media are allowed.
- **Outside the window:** only **approved template messages** can be sent. The sender checks the window before every send and **refuses** free-form messages when it is closed. This is enforced in `sender.ts`, not left to callers.
- Order updates (accepted, out for delivery, delivered) are likely to arrive outside the window, so they must use templates. Do not assume the window is open.
- If a template send is rejected or fails, fall back to SMS through the notifications module, and log it.
- Never try to bypass the window by sending dummy messages or asking users to reply "Hi" repeatedly. If a reply is genuinely needed, include it in the template as a quick-reply button.
- Marketing or promotional messages are **not** part of the first release. Only transactional messages about the user's own orders.

## Message templates

- All templates are defined in `templates.registry.ts`: name, language, category, variable count, and a sample. The registry is the single source of truth. No template name appears as a string anywhere else.
- Templates must be **created and approved in Meta Business Manager** before use. Approval takes time, so submit them early. Each language is a separate version (`en`, `hi`, `ml`).
- Starter set (utility category):

| Template | Used for | Variables |
|---|---|---|
| `order_received` | Order placed, waiting for the shop | order short id, total |
| `order_accepted` | Shop accepted | order short id, ETA |
| `order_out_for_delivery` | On the way | order short id, ETA |
| `order_delivered` | Delivered | order short id |
| `order_cancelled` | Cancelled or rejected | order short id, reason |
| `payment_link` | Pay by UPI | order short id, amount, link |
| `reorder_prompt` | User opted in to reminders | none (quick-reply buttons) |

- Variables are plain text, validated for length and no newlines or special characters. Money is formatted from paise by a shared helper.
- Do not put sensitive data in templates (full address, full phone numbers, payment details).
- Sender validates variable count against the registry and throws before calling Meta if it does not match.
- Pick the language from the user's saved preference, then fall back to the language they last wrote in, then English.

## Reusing the voice pipeline

This module is a **thin adapter**. The business logic lives in `modules/voice`.

**Voice note (audio) flow**
1. Webhook delivers an audio message with a media id.
2. Handler checks the user is allowed to order, the rate limits pass, and the audio is within limits (60 seconds, about 2 MB). If too long, reply asking for a shorter note.
3. `media.ts` fetches the media URL from the Graph API using the access token, then downloads the file with the same authorisation. **Media URLs expire quickly**, so download immediately in the job. Keep the audio in memory only.
4. Call `voiceService.parseAudio({ audio, mimeType, language?, source: 'whatsapp', userId })`. WhatsApp voice notes are usually `audio/ogg` with Opus. Convert only if the chosen STT provider needs it, inside the voice module, not here.
5. Receive a `DraftCart` with questions. Render it as WhatsApp messages (below).

**Text flow**
- Typed orders call `voiceService.parseText()`, which skips STT and runs the same extraction and matching.
- Simple commands (see below) are handled before the pipeline.

**Rules**
- **Do not** import STT, LLM or matching internals. Only the public functions of the voice module.
- Voice logs are written by the voice module with `source: 'whatsapp'`. Corrections made in chat (changed item, removed item) are sent back through the same corrections function.
- The same rate limits, spend guard and error codes apply. On `VOICE_NOT_UNDERSTOOD`, reply: "Sorry, I couldn't hear that. Please send it again or type your list."
- Questions come back as structured data. This module maps them to **interactive reply buttons** (up to 3 options) or **list messages** (up to 10 rows). Always include a "Something else" choice, and let the user answer by voice or text too.
- Message text is built from translation keys in the user's language. Do not let an LLM write chat replies.

## Conversation flow

Session state lives in Redis (`wa:session:<phone>`, TTL 24 hours, refreshed on each message). States:

`idle` -> `awaiting_clarification` -> `awaiting_confirmation` -> `awaiting_address` -> `awaiting_payment` -> `idle`

1. **Greeting or first voice note:** if the number is new, ask for consent and language once, create the user record linked to the E.164 phone number, and continue.
2. **Cart shown:** list items, quantities and the **server-calculated total** in one message with buttons **Confirm** and **Edit**.
3. **Edit:** user can reply with a voice note or text ("remove soap", "make rice 5 kg"). Run it through the pipeline against the existing draft.
4. **Address:** use the saved default. If none, ask them to share their location or type an address. Confirm the address in one tap.
5. **Payment:** buttons **Pay by UPI** and **Cash on delivery**. UPI sends the payment link template or message. COD follows the COD rules in the payments module.
6. **Confirm only creates the order** when the user taps Confirm on the **latest** cart.

**Confirmation safety**
- The Confirm button payload carries `{ cartId, cartVersion }` (or a hash). If the cart changed after that message was sent, reject the tap and re-send the updated cart. Stale buttons must never confirm a different cart.
- A button tap is explicit confirmation. Free text like "ok" or "yes" is **not** accepted as confirmation for placing an order, unless it replies to the cart message with a Confirm button flow that was already shown. Prefer buttons.
- Confirming calls the orders module with an idempotency key built from the message id (`wa:<wamid>`), so a duplicate webhook cannot place a second order.
- Prices and totals come from the server. Never repeat a price the user typed.
- Cart expires after 30 minutes of inactivity. Say so politely and offer to start again.

**Commands** (case-insensitive, translated, in `text.handler.ts`):
- `STOP` / `UNSUBSCRIBE`: opt out, confirm once, stop all non-essential messages immediately.
- `START`: opt back in.
- `HELP`: show how to order and a support contact.
- `STATUS` or "where is my order": reply with the latest order status.
- `REORDER` or "my usual": build a draft cart from the user's usual items and ask for confirmation.
- `CANCEL`: cancel the current draft.

## Opt-in, privacy and compliance

- Record **opt-in** (time, source, wording shown) before sending messages. Messaging someone who has not started a chat or opted in is not allowed.
- Honour opt-out immediately and keep it saved. Opt-out must also stop template messages except legally required order messages for orders already in progress, and tell the user how this works.
- Store only what is needed: phone number, message ids, types, timestamps, status. **Do not store message bodies**, transcripts excepted (which live in voice logs with the retention rules).
- Never log full phone numbers (mask as `+91••••••3210`), tokens, media URLs or message text.
- Never echo secrets or internal ids in messages. Use short order codes.
- Keep the access token (`WHATSAPP_ACCESS_TOKEN`), app secret, verify token and phone number id in env only. Use a system-user permanent token on production, not a personal temporary one.

## Outbound sending

- All sends go through `sender.ts`, which: checks opt-in, checks the window, validates the template, builds the request, retries on `429` and `5xx` with backoff, and records the message in `whatsapp_messages`.
- Outbound sends are **queued** (BullMQ) and idempotent: unique job id from `(orderId, event, channel)` so a status change fires one message only.
- Track delivery from status webhooks: `sent`, `delivered`, `read`, `failed`. On `failed`, read the error code, fall back to SMS if it matters (order updates), and alert if failures spike.
- Respect Meta's rate and messaging limits. Add a per-number throttle and avoid bursts.
- Typing and read receipts are optional. If used, mark the incoming message as read after it is queued.

## Errors and abuse

- Errors from Meta are mapped to our own codes. Never forward Meta error bodies to the user.
- If the pipeline fails, reply with a short friendly message and a text fallback. The user should never be left without a reply.
- Rate limit per phone number: for example 30 inbound messages per hour and 20 voice notes per hour. Over the limit, send one polite notice and then ignore until the window resets.
- Ignore unsupported types (images, stickers, documents, contacts) with a short reply saying what is supported.
- Block and ignore repeated spam. Provide an admin tool to block a number.
- Share the daily STT and LLM spend guard with the voice module.

## Testing

- Keep real webhook payload fixtures in `fixtures/` (text, audio, interactive reply, location, status, unsupported types).
- Unit test signature verification (valid, wrong secret, modified body) and the GET handshake.
- Unit test `window.ts` with a fake clock around the 24-hour boundary.
- Test that `sender.ts` refuses free-form messages outside the window and wrong template variable counts.
- Integration tests with mocked Graph API and mocked voice service:
  - Duplicate webhook (same `wamid`) creates one cart.
  - Voice note leads to a draft, Confirm tap creates exactly one order, duplicate Confirm tap creates none.
  - Stale Confirm button is rejected.
  - STOP stops outbound messages.
  - Order status change outside the window sends a template, not free text.
- Never call the real WhatsApp API or send real messages in tests. Use Meta's test number and test recipients for manual checks only.

## Ask first

Stop and ask the human before:
- Changing signature verification, window enforcement, or opt-in handling.
- Adding a new template, or sending any marketing or promotional message.
- Changing confirmation behaviour (what counts as Confirm).
- Storing new kinds of message data.
- Upgrading the Graph API version.

## Definition of done (whatsapp)

Everything in the root and API `AGENTS.md`, plus:

1. Webhook GET and POST verification are in place, with tests.
2. Free-form sends are blocked outside the 24-hour window and templates are used instead.
3. Voice and text go through the voice module's public functions only.
4. Orders can only be placed by a Confirm tap on the latest cart, and are idempotent.
5. Opt-in is recorded, STOP is honoured, and nothing sensitive is logged.
6. New templates are in the registry, have all three languages, and are approved in Meta before release.
7. Duplicate webhooks, stale buttons and failures are covered by tests.