# packages/ui: Shared Component Library

The building blocks for the customer PWA, store dashboard and admin panel. Place this file at `packages/ui/AGENTS.md`.
Root rules in `/AGENTS.md` still apply. Package name: `@daydaily/ui`. Visual rules live in `/docs/DESIGN.md`: **read it before building or changing any component.**

**Golden rule: a component here is generic, token-driven and has no knowledge of the app.** If it fetches data, reads a store, or mentions "order" or "cart" in its logic, it belongs in the app, not here.

## What belongs here

- Generic UI: `Button`, `Chip`, `Card`, `Input`, `Sheet` (bottom sheet), `Dialog`, `Toast`, `Skeleton`, `Banner`, `Badge`, `Stepper`, `Switch`, `EmptyState`, `Spinner`, `Tabs`
- DayDaily-specific but still generic in data: `SpeakDock` (the mic button UI), `Waveform`, `QuantityStepper`, `StatusSteps`, `DataTable` shell (admin)
- Layout helpers: `Stack`, `Screen`, `StickyBar`
- Icon wrapper around Lucide

## What does NOT belong here

- API calls, TanStack Query, Zustand, routing, or i18n lookups. Components receive data and text as **props**.
- Business logic (pricing, stock, voice parsing).
- Anything used by only one app. Keep it in that app until a second app needs it.

## Structure

```
src/
  tokens/            tokens.css (CSS variables), tailwind-preset.ts
  components/
    Button/
      Button.tsx
      Button.test.tsx
      Button.stories.tsx      (or examples/ page entry)
      index.ts
    Chip/ Card/ Input/ Sheet/ SpeakDock/ ...
  hooks/             useReducedMotion, useFocusTrap, useMediaQuery
  utils/             cn() class merge helper
  index.ts           Public exports only
```

One folder per component, with its test and story next to it. Every component is exported from `src/index.ts`. Apps import from `@daydaily/ui` only, never deep paths.

## Built on the design tokens

- **Tokens come from `docs/DESIGN.md`.** Define them once in `tokens/tokens.css` as CSS variables and expose them through the Tailwind preset. Components use token classes only (`bg-surface`, `text-ink`, `rounded-full`).
- **Never hardcode** hex colours, pixel sizes outside the spacing scale (`4, 8, 12, 16, 24, 32, 48`), radii, shadows, or font sizes. If a token is missing, add it to the tokens file and `DESIGN.md` together, after asking.
- Allowed shadows: only `shadow-dock` and `shadow-sheet`. No other shadows.
- `rec` red appears in `SpeakDock` and `Waveform` recording state only.
- Use `cn()` (clsx + tailwind-merge) for class composition. No inline `style` except for dynamic values like waveform height.
- Animate only `transform` and `opacity`. Durations 150ms (taps) and 250ms (sheets). Respect `prefers-reduced-motion` through `useReducedMotion`.
- No dark mode in the first release.
- Fonts are loaded by the apps, not by this package. Components use the font stack from tokens.
- Store dashboard and admin scale up through a `size` or `density` prop and CSS variables (for example `--text-base: 18px`), not by copying components.

## Component API rules

Make components predictable. Every component follows the same conventions.

**Props**
- TypeScript strict. Export a `<Name>Props` type. No `any`.
- Extend the native element props (`ComponentPropsWithoutRef<'button'>`) so `onClick`, `disabled`, `aria-*`, `data-*` work.
- **Forward refs** (`forwardRef`) on every interactive or focusable component.
- Accept `className` and merge it last. Do not spread props before your own required ones.
- Use small, named variants, not boolean pile-ups:

```tsx
<Button variant="primary" size="lg" />     // good
<Button primary large rounded bold />      // bad
```

- Standard variants: `variant`: `primary | secondary | text | danger`, `size`: `md | lg`. Do not invent new ones per component. Add to the shared scale.
- Prefer **composition** over many props: `<Card><Card.Header/>...</Card>` or children, not `headerTitle`, `headerIcon`, `headerAction`.
- Controlled by default for stateful components (`value` + `onChange`), with an optional `defaultValue` for uncontrolled use. Never mix both in one instance.
- Event props are named `onX` and pass useful values (`onChange(value)`), not raw events, unless it wraps a native input.
- Defaults must be safe and visible. A component works with only its required props.
- Required props are few. If a component needs more than 5, it is probably doing too much.

**Text and i18n**
- **No hardcoded user-visible strings inside components.** Labels, `aria-label`s, placeholders and error text all arrive as props (already translated by the app). For example `<SpeakDock label={t('voice.speak')} listeningLabel={t('voice.listening')} />`.
- No fixed widths or heights on text. Hindi and Malayalam are longer and need more line height. Let containers grow.
- Use logical CSS (`ps-`, `pe-`, `ms-`, `me-`) where practical, so right-to-left can be added later.

**Behaviour**
- Components are **presentational and stateless where possible.** Internal state only for UI concerns (open or closed, focus, pressed).
- No side effects on import. No global listeners left behind: clean up in `useEffect`.
- Do not fetch, log, track analytics or read `localStorage` inside components.
- Loading, empty, disabled and error states are part of the API (`loading`, `disabled`, `invalid` props) and appear in the stories.
- Every component renders correctly at **360px**, with text scaled to 130%.
- Touch targets are **48 x 48px minimum** (56px for store dashboard main actions through `size="lg"`), with 8px between targets.

**Dependencies**
- Allowed: `react`, `lucide-react`, `clsx`, `tailwind-merge`, and a headless accessibility primitive library (for example Radix UI) for Dialog, Sheet, Tabs and Switch so focus handling and keyboard behaviour are correct. `react` is a peer dependency.
- Anything else needs approval. No other UI kits, no animation libraries, no date libraries.
- Never import from `apps/*`. `packages/ui` may import types from `packages/shared` only when truly needed (for example `OrderStatus` for `StatusSteps`). Prefer plain string props.
- Mind bundle size. Keep each component small, make everything tree-shakeable, set `"sideEffects": ["*.css"]`, and export named components (no default exports).

## Storybook or example page (required)

Every component has a visible, runnable example before it is considered done.

- **Preferred: Storybook** (`pnpm --filter @daydaily/ui storybook`). Use CSF stories next to the component.
- **Lightweight alternative:** a `/playground` Vite page that renders every component, grouped by name, if Storybook is too heavy for now. Pick one approach and use it for all components.
- Each component documents, as stories or sections:
  1. **Default**
  2. Every **variant** and **size**
  3. **States:** hover, pressed, focus, disabled, loading, invalid, empty
  4. A **long text** example (Hindi and Malayalam strings) to prove nothing breaks
  5. A **360px** viewport view and a **130% text scale** view
  6. Reduced motion behaviour where there is motion
- Include a story set for the key screens' building blocks: `SpeakDock` in all five states (idle, recording, processing, done, error), `QuantityStepper`, `Sheet` with options, `StatusSteps`.
- Stories use the real tokens and real components, with fake data. No API calls.
- Add a toggle for "large text" and "Hindi/Malayalam sample text" in the Storybook toolbar.
- The Storybook accessibility addon (`@storybook/addon-a11y`) must show **zero violations** for each story.
- Stories are also the visual reference for the agent: look at them before making a similar new component.

## Accessibility checklist (every component)

Check each item before marking a component done:

- [ ] Uses the right **semantic element** (`button`, `a`, `input`, `ul`, `nav`). No clickable `div`s.
- [ ] **Keyboard works:** Tab reaches it, Enter and Space activate it, Escape closes overlays, arrow keys move inside tabs, lists and menus.
- [ ] **Visible focus ring** (2px `ink` outline, 2px offset). Never `outline: none` without a replacement.
- [ ] **Accessible name:** icon-only buttons have `aria-label` (passed in as a prop, already translated). Inputs have a visible label or `aria-labelledby`.
- [ ] **Colour contrast** at least 4.5:1 for text and 3:1 for icons and borders. Colour is never the only signal: pair with text or an icon.
- [ ] **Touch target** 48 x 48px or more, with spacing.
- [ ] **States are announced:** `aria-disabled` or `disabled`, `aria-busy` for loading, `aria-invalid` and `aria-describedby` for errors, `aria-pressed` or `aria-expanded` where relevant.
- [ ] **Live updates** use `aria-live="polite"` (status) or `"assertive"` (urgent alerts such as a new order). `SpeakDock` announces "Listening", "Understanding", and errors.
- [ ] **Dialogs and sheets** trap focus, restore focus on close, close on Escape, and set `aria-modal`. Background content is inert.
- [ ] **Reduced motion:** no movement when `prefers-reduced-motion` is on. Use a simple fade.
- [ ] **Text scaling** to 130% does not clip, overlap or hide content.
- [ ] **Images** have `alt` text (or `alt=""` if decorative). Icons that are decorative use `aria-hidden`.
- [ ] **Screen reader tested** at least once on Android TalkBack for `SpeakDock`, `Sheet` and `Dialog`.
- [ ] Automated checks pass: `jest-axe` (or `vitest-axe`) in the unit test and the Storybook a11y addon.

## Testing

- **React Testing Library + Vitest.** Test what the user sees and does: render, click, type, press keys. Do not test class names or implementation details.
- Each component has tests for: renders with required props, variants render, disabled and loading block interaction, keyboard use, `ref` forwarding, `className` merging, and `axe` has no violations.
- Test that overlays trap and restore focus, and close on Escape.
- Snapshot tests only for small, stable pieces. Prefer explicit assertions.
- Visual regression (Storybook with Chromatic or Playwright screenshots) is optional but recommended once the design settles.
- Test that the package builds and `src/index.ts` exports match expectations.

## Commands

```bash
pnpm --filter @daydaily/ui storybook          # component workshop
pnpm --filter @daydaily/ui build              # build the package
pnpm --filter @daydaily/ui test               # Vitest + RTL + axe
pnpm --filter @daydaily/ui lint
pnpm --filter @daydaily/ui typecheck
```

## Versioning and changes

- Changing a component's props affects every app. Run `pnpm typecheck` and `pnpm test` at the repo root, and fix all consumers in the same change.
- Adding an optional prop is safe. Removing or renaming a prop, or changing default behaviour, is a breaking change: ask first and update every usage.
- Do not copy a component into an app to avoid a change here. Fix or extend the shared one.
- If the design changes, update `docs/DESIGN.md` and the tokens first, then the components.

## Do and don't

| Do | Don't |
|---|---|
| Use token classes (`bg-surface`, `text-ink`) | Hardcode hex, pixel or shadow values |
| Pass all text in as translated props | Put English strings inside components |
| Extend native element props and forward refs | Wrap elements and drop `aria-*` or `ref` |
| Use small variant sets (`variant`, `size`) | Add boolean flag props for every look |
| Keep components presentational | Fetch data or read stores in a component |
| Write a story and an a11y test for each component | Ship a component nobody can see or test |

## Definition of done (ui)

Everything in the root `AGENTS.md`, plus:

1. Uses tokens only. No hardcoded colours, sizes or shadows.
2. Props follow the API rules: typed, native props extended, ref forwarded, `className` merged, variants named.
3. No hardcoded strings. All labels arrive as props.
4. A story (or playground entry) shows every variant and state, long Hindi and Malayalam text, 360px and 130% text size.
5. The accessibility checklist is complete, and axe and the Storybook a11y addon show zero violations.
6. Tests pass, including keyboard and focus behaviour.
7. Exported from `src/index.ts`, no new dependency without approval, and all consuming apps still typecheck.