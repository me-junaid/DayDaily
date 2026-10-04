# DayDaily Design System

Simple, calm, minimal. Anyone should understand a screen in two seconds without reading.
Reference style: near-white canvas, light grey rounded surfaces, black pill buttons, one big primary action.

Place this file at `docs/DESIGN.md`. Used by `apps/web`, `apps/store-dashboard`, `apps/admin` and `packages/ui`.

## Principles

1. **One primary action per screen.** On the customer app it is **Speak**.
2. **Less is more.** If an element does not help the user order, remove it.
3. **Big and readable.** Users may be older, on cheap phones, in bright light.
4. **Black and white first.** Colour is rare, so when it appears it means something.
5. **Show, don't explain.** Prefer a clear picture, number or icon over a paragraph.

## Colour tokens

Define once in `packages/config/tailwind` and use only the tokens. Never hardcode hex values in components.

| Token | Hex | Use |
|---|---|---|
| `bg` | `#FFFFFF` | Page background |
| `surface` | `#F4F4F4` | Cards, inputs, inactive chips |
| `surface-2` | `#EBEBEB` | Hover, pressed, dividers |
| `ink` | `#0D0D0D` | Primary text, primary buttons |
| `ink-2` | `#6B6B6B` | Secondary text, hints |
| `ink-3` | `#A3A3A3` | Disabled text, placeholders |
| `line` | `#E5E5E5` | Borders |
| `on-ink` | `#FFFFFF` | Text on black |
| `rec` | `#EF4A3C` | **Recording state only** |
| `success` | `#1B8A4B` | Order confirmed, delivered |
| `warn` | `#C27A00` | Needs attention |
| `danger` | `#C62828` | Errors, destructive actions |

Rules:
- `rec` is used only for the recording dot and live waveform. Nowhere else.
- `success`, `warn` and `danger` appear as small text, icons or thin badges, never as large filled areas.
- Text on `bg` or `surface` must meet a 4.5:1 contrast ratio.
- Dark mode is out of scope for the first release. Do not add it.

## Typography

- **Font:** Inter for English. Fallbacks for local languages: `Noto Sans Devanagari` (Hindi), `Noto Sans Malayalam` (Malayalam). Add other Noto Sans scripts per language.
- Local scripts need more line height. Never clip or fix the height of text containers.
- Weights: 400 regular, 500 medium, 600 semibold. No other weights.

| Style | Size / line height | Weight | Use |
|---|---|---|---|
| `display` | 28 / 36 | 600 | Screen headline, order total |
| `title` | 20 / 28 | 600 | Section titles |
| `body` | 16 / 24 | 400 | Default text. Minimum size anywhere |
| `body-strong` | 16 / 24 | 500 | Item names, buttons |
| `caption` | 14 / 20 | 400 | Hints, timestamps, units |

Never use text below 14px. Use sentence case, not ALL CAPS.

## Spacing, radius, shadow

**Spacing scale (4px base):** `4, 8, 12, 16, 24, 32, 48`. Use only these. Screen side padding is `16`. Gap between sections is `24`.

**Radius**

| Token | Value | Use |
|---|---|---|
| `r-sm` | 12px | Inputs, small cards |
| `r-md` | 20px | Cards, sheets |
| `r-full` | 9999px | Buttons, chips, avatars, the dock |

**Shadow:** almost none. Use a border or a surface colour first.
- `shadow-dock`: `0 8px 24px rgba(0,0,0,0.08)` for the floating bottom dock only.
- `shadow-sheet`: `0 -8px 32px rgba(0,0,0,0.10)` for bottom sheets only.

## Components

**Primary button:** black (`ink`) pill, white text, 56px high, full width on mobile. One per screen.
**Secondary button:** `surface` pill, `ink` text, 48px high.
**Text button:** no background, `ink` text, underline on press.
**Chip:** pill, 40px high. Inactive is `surface` with `ink-2` text. Active is `ink` with white text.
**Card:** `surface` background, `r-md`, 16px padding, no border, no shadow.
**Input:** `surface` background, `r-sm`, 52px high, no border. A 2px `ink` outline on focus.
**Icons:** Lucide, 24px, 1.75 stroke, `ink` colour. Pair with a text label whenever space allows.
**Product image:** square, `r-sm`, on `surface`. Show a neutral placeholder when missing.

Touch targets are at least 48 x 48px, with 8px spacing between targets.

## The Speak button (hero component)

The most important element in the app. Fixed at the bottom centre of the Home screen, inside a floating white dock.

**Dock**
- White pill, `shadow-dock`, 16px padding, 16px from the bottom edge plus safe-area inset.
- Contains the button and one caption line below it (for example "Tap and say what you need").

**Button states**

| State | Look | Label |
|---|---|---|
| Idle | Black pill, 64px high, white text, small white mic icon | "Speak" |
| Recording | Black pill with a pulsing `rec` dot and a live waveform | "Listening... tap to stop" |
| Processing | Black pill, animated three dots, not tappable | "Understanding your order" |
| Done | Dock slides away, cart screen takes over | none |
| Error | `surface` pill with `danger` text, plus a retry button | "Couldn't hear you. Try again" |

**Behaviour**
- Tap to start, tap to stop. Do not require press-and-hold.
- Give haptic feedback on start and stop where supported.
- Auto-stop after 2.5 seconds of silence or 60 seconds total.
- Always show a small "Type instead" text button near the dock for noisy places.
- If the microphone permission is denied, show a short, friendly screen explaining how to enable it, with a "Type instead" fallback.

## Key screens

**Home:** greeting, a few chips for common categories, a "Your usuals" row for fast reorder, Speak dock at the bottom. Nothing else.

**Cart confirmation (after voice):**
- Heading: "Is this right?"
- One row per item: image, name, quantity stepper (48px buttons), price, remove icon.
- Ambiguous items show an amber "Choose one" chip that opens a bottom sheet with 2 to 4 options.
- Sticky bottom bar: total plus black **Confirm order** button.
- Read the cart aloud when it appears, with a speaker icon to replay it.

**Order tracking:** vertical steps (Placed, Accepted, Packed, On the way, Delivered). The current step is bold and `ink`, past steps use `success`, future steps use `ink-3`.

**Store dashboard:** same tokens, larger type (18px base), tablet first. Incoming orders appear as large cards with giant **Accept** and **Reject** buttons and a looping sound. New orders are never hidden behind a menu.

## Motion

- Duration: 150ms for taps, 250ms for sheets and transitions. Nothing over 400ms except the recording pulse.
- Easing: `cubic-bezier(0.2, 0, 0, 1)`.
- Allowed motion: press scale to 0.97, sheet slide-up, dock slide-down, fade, recording pulse and waveform.
- No parallax, bouncing, confetti or page-flip animation.
- Respect `prefers-reduced-motion`: replace movement with a simple fade.

## Empty, loading and error states

- **Loading:** `surface` skeleton blocks with a soft shimmer. Never a blank screen. Never a full-page spinner.
- **Empty:** one simple line icon, one short sentence, one action. Example: "No orders yet. Tap Speak to place your first one."
- **Offline:** a slim `surface` banner at the top: "No internet. We'll retry when you're back." Keep the cart saved.
- **Error:** say what happened and what to do, in one sentence, with a retry button. Never show codes or stack traces.

## Tone of voice

Warm, short, and respectful, like a friendly local shopkeeper.

- Use everyday words. Say "Order", not "Checkout flow". Say "Is this right?", not "Please verify your cart".
- Keep sentences under 10 words where possible.
- Do not blame the user. Say "Couldn't hear you", not "Invalid input".
- Use "you" and "your". No slang, no emoji in core flows.
- Buttons are verbs: "Speak", "Confirm order", "Add item", "Try again".
- Every string goes through `t('key')`. Write the English first, then translate naturally, not word for word. Have a native speaker review Hindi and Malayalam copy.

## Accessibility

- Every icon-only button has an `aria-label`.
- Visible focus ring (2px `ink` outline, 2px offset) on all interactive elements.
- Never use colour alone to show state. Pair it with text or an icon.
- All voice actions have a tap or type alternative.
- Support text scaling up to 130% without breaking the layout.
- Test on a 360px wide screen and a low-end Android phone.

## Do and don't

| Do | Don't |
|---|---|
| One black primary button per screen | Several competing buttons |
| Use tokens from this file | Hardcode colours, sizes or spacing |
| Large, plain labels | Tiny text or icon-only controls |
| Soft grey surfaces | Heavy borders and drop shadows |
| Short copy | Paragraphs of explanation |