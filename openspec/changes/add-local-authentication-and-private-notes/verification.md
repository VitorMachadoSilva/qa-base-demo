# Verification

Verified on 28 July 2026 in branch
`codex/multi-login-private-notes`.

## Database and security

- Prisma schema formatted, validated, and client generated.
- Idempotent setup executed twice against the representative database.
- Exactly three fixed users present; zero unexpected users.
- Zero orphan sessions, orphan quick notes, or invalid note ownership.
- Login failures are generic and repeated failures are throttled.
- Session cookie is opaque, `HttpOnly`, `SameSite=Strict`, and valid for seven
  days; only its hash is persisted.
- Password change, session revocation, notice acknowledgement, expiration,
  logout, and local reset were exercised.
- Validation cleanup left zero sessions and zero quick notes. All three users
  will receive the initial password-change notice on their next login.

## Automated regression

- `npm run smoke:auth`
- `npm run smoke`
- `npm run smoke:composite`
- `npm run smoke:demands`
- `npm run smoke:third-party-access`
- `npm run smoke:quick-notes`
- `npm run smoke:notifications`
- `npm run db:check`
- frontend production build: 1,607 modules transformed

Cross-user note coverage includes list, daily counts, global search, direct
read, update, pin, and delete. Records owned by another user are absent from
collections and return the same not-found response as nonexistent records.

## Browser matrix

- Login, initial notice, direct navigation to Minha conta, reload persistence,
  password surface, logout, and automatic return after authorization loss.
- Logout placed in the desktop/tablet global-rail footer, without a duplicate
  account-header action; the account action remains available on mobile where
  the rail is hidden.
- Shared project visibility and private quick-note visibility across two users.
- Desktop, 820 px tablet, and 390 x 844 mobile layouts.
- Light and dark themes, keyboard focus and modal focus trap, Escape, reduced
  motion, and 200% equivalent reflow.
- No horizontal overflow in the checked viewports.
- No browser console warnings or errors in the final pass.
- Temporary browser sessions and notes removed after validation.

## Operational notes

The existing development database predates Prisma migration bookkeeping, so
the project continues to use its idempotent setup for representative local
instances. The versioned SQL migration remains the auditable path for fresh
databases. Shared deployments must use HTTPS with
`QABASE_SECURE_COOKIES=true`.
