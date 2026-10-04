# apps/admin: Admin Panel

Internal tool for the DayDaily team to manage stores, catalog, orders, customers and payouts. Place this file at `apps/admin/AGENTS.md`.
Root rules in `/AGENTS.md` still apply. Same colour tokens, radius and typography as `/docs/DESIGN.md`; this file covers what differs for an internal, data-heavy tool.

**Build this late.** It belongs to Phase 6 in `docs/PLAN.md`. Until then, use the database console and seed scripts. Do not start this app early.

## Who uses this

A small trusted team (founder, operations, support) on a desktop or laptop. They work with lots of data and need speed, accuracy and safety. They are not shoppers, so density beats whitespace here.

**Golden rules:** every action is permission-checked, every change is audited, and nothing destructive happens without confirmation.

## Commands

```bash
pnpm --filter @daydaily/admin dev
pnpm --filter @daydaily/admin build
pnpm --filter @daydaily/admin test
pnpm --filter @daydaily/admin e2e        # Playwright at desktop viewport
```

## Structure

```
src/
  pages/
    Dashboard.tsx        Key numbers for today
    Orders/              List, detail, refunds, manual actions
    Stores/              Onboarding, status, inventory view
    Catalog/             Products, categories, aliases
    Customers/           Search, order history, support notes
    Payouts/             Store settlements
    VoiceLogs/           Transcripts, corrections, accuracy
    Team/                Admin users, roles
    AuditLog/            Read-only history of changes
  features/              One folder per area above (api, hooks, components)
  components/            DataTable, FilterBar, ConfirmDialog, PermissionGate
  lib/  i18n/  store/
```

## Layout rules

- **Desktop first (1280px and up).** Must remain usable at 1024px. Phones are not supported; show a polite "Use a larger screen" message below 768px.
- Left sidebar navigation, grouped by area. Show only the sections the user's role can access.
- Dense but readable: base text **14px**, table rows 40px high. This is the one place the 16px minimum from `DESIGN.md` is relaxed. Never go below 13px.
- Use the same neutral tokens (`surface`, `ink`, `line`). Colour is only for status badges and warnings.
- Always show the current environment ("Production" or "Staging") in the header. Production gets a clear indicator so nobody edits live data by accident.
- English only for the admin UI. Still avoid hardcoded strings; use `t()` so adding a language later is easy.

## Data tables (the core component)

Build one shared `DataTable` in `components/` and use it everywhere. Do not make custom tables per page.

Must support:
- **Server-side** pagination, sorting and filtering. Never load all rows into the browser.
- Page size choices (25, 50, 100). Default 50.
- Sticky header, sticky first column for wide tables, horizontal scroll inside the table only.
- Column show/hide and saved views per user (for example "Pending payouts").
- Global search plus per-column filters (date range, status, store, amount range).
- Filters and sorting stored in the **URL query string** so any view can be shared by link.
- Row click opens a detail drawer or page. Do not edit inside the table without a clear save.
- Bulk select with a bulk action bar. Show the count of affected rows and require confirmation.
- **Export to CSV** of the current filtered view, capped at a sensible row limit and permission-checked. Exports are audited.
- Loading skeleton rows, empty state ("No orders match these filters") with a "Clear filters" button, and an error state with retry.
- Right-align numbers, show money as ₹ with `Intl.NumberFormat`, show times in the shop's local time (IST) with an absolute timestamp on hover.
- Keyboard support: arrow keys move through rows, Enter opens the row.
- Virtualize rows only if page size exceeds 100.

## Roles and permissions

Authorization is enforced **on the API**. The UI only hides things for convenience. Never rely on the UI for security.

| Role | Can do |
|---|---|
| `owner` | Everything, including team, roles, payouts approval and audit log |
| `ops` | Orders, stores, catalog, customers (read and update). No payouts approval, no team |
| `support` | Read orders and customers, add notes, trigger refund requests for approval. No catalog or store edits |
| `finance` | Payouts, payments, refunds approval, exports. Read-only for orders |
| `viewer` | Read-only dashboards and lists |

Rules:
- Permissions are named capabilities (`orders.refund`, `catalog.edit`, `payouts.approve`), defined once in `packages/shared` and used by both API and UI. Roles map to capabilities.
- Use a `<PermissionGate can="payouts.approve">` component and a `usePermission()` hook. No `if (role === 'owner')` checks scattered in components.
- If a user lacks permission, hide the action. If they reach the URL directly, show a clear "You don't have access" page.
- **Sensitive actions need a second step:** refunds over a set amount, payout approval, deleting products, changing roles and bulk updates. Use a confirm dialog that states exactly what will change. For money actions, require approval from a second person with `finance` or `owner` role.
- Sessions: phone OTP or email login plus 2FA for the admin app. Auto-logout after 30 minutes of inactivity. No shared accounts.
- Show the logged-in user and role in the header.
- Never display full payment details or secrets. Mask phone numbers by default (`98•••••210`) with a "Reveal" action that is itself audited.

## Audit logging

**Every state-changing action is audited. No exceptions.** The API writes the audit log; the admin UI makes it easy to supply the context.

Each audit entry records:
- Who (user id, name, role)
- What (action name such as `store.suspend`, `order.refund`, `product.price_update`)
- On what (entity type and id)
- Before and after values (changed fields only)
- When (UTC timestamp) and from where (IP, user agent)
- Reason (free text, required for sensitive actions)

Rules:
- Audit log entries are **append-only**. No edit and no delete, not even for the owner.
- Sensitive actions require a **reason** field in the confirm dialog, sent with the request.
- Also log: logins, failed logins, role changes, data exports, "Reveal" of masked data, and permission denials.
- The `AuditLog` page is read-only with filters (user, action, entity, date range) and a CSV export.
- Each detail page has an **"History" tab** showing audit entries for that record.
- Never put secrets, full phone numbers or payment details inside audit values. Store masked versions.
- Show "Last edited by X, 3 min ago" on records that can be edited.

## Safe editing

- Edits go through a form with a clear **Save** and **Cancel**. Show a diff summary before confirming sensitive changes.
- Warn about unsaved changes before leaving a page.
- Prevent double submit. Disable the button while saving.
- Use **soft delete** (archive) for stores, products and customers. Hard delete is not available in the UI.
- Handle edit conflicts. If a record changed since it was opened, show "This was updated by someone else" and offer to reload.
- Money fields are integer paise in the API and shown as rupees. Validate with Zod from `packages/shared`.
- Support actions like "Cancel order" or "Refund" use dedicated, named API endpoints, not generic PATCH calls.

## Catalog and voice tools (high value)

- **Aliases editor:** add and remove spoken names for a product (for example "chawal", "arisi") per language. This directly improves voice matching.
- **VoiceLogs page:** list transcripts with the parsed items and what the user corrected. Filter by "had corrections" and by language. One click adds a correction as a new alias.
- Show voice accuracy trends (percentage of carts accepted without changes) on the Dashboard.
- Transcripts may contain personal information. Restrict access to the capability `voicelogs.view` and mask phone numbers or addresses where detected.

## Performance and quality

- Initial JS budget: **250 KB gzipped**. Lazy-load each page.
- Charts: use a light library, and render only on the Dashboard and reports.
- Debounce search inputs (300ms). Cancel stale requests.
- Use TanStack Query with sensible caching. Admin data must feel fresh: `staleTime` of 30 seconds or less for orders and payouts.
- Do not poll heavily. Use a manual "Refresh" button plus a refetch on window focus.

## Accessibility

- Full keyboard use and visible focus rings.
- Table headers use proper `th` scope and sortable columns announce sort direction.
- Status uses text plus colour, never colour alone.
- Dialogs trap focus and close with Escape. Destructive buttons are never the default focused button.

## Testing

- Unit test the permission mapping: every role against every capability.
- Component test `DataTable` (sorting, filters in URL, empty and error states) and `PermissionGate`.
- Playwright at 1280x800: login with 2FA, filter and export, refund requires reason and second approval, a `support` user cannot see payouts, audit entry appears after an edit.
- API tests (in `apps/api`) must confirm each endpoint rejects users without the right capability. The admin UI tests do not replace those.

## Definition of done (admin)

Everything in the root `AGENTS.md`, plus:

1. The API endpoint checks the permission, and a test proves a lower role is rejected.
2. The action writes an audit entry with before/after values and a reason where required.
3. Destructive or money actions have a confirm step with a clear summary.
4. Tables use the shared `DataTable` with server-side pagination and URL-based filters.
5. Loading, empty and error states are handled.
6. Sensitive data is masked by default.