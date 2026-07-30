# Verification

Date: 2026-07-28

## Data and API

- Prisma schema formatted and validated.
- Prisma Client generated after the additive `QuickNote` migration.
- Idempotent setup completed and database integrity reported zero invalid
  quick-note colors and zero invalid creation days.
- Dedicated `smoke:quick-notes` passed validation, configured civil day,
  defaults, day filtering, cross-day search, pinned-first ordering, edit,
  palette change, immutable creation day, detail, deletion, not-found, and
  cleanup.
- Existing `smoke`, `smoke:composite`, `smoke:demands`, and
  `smoke:third-party-access` suites passed without regressions.

## Build and interaction

- Vite production build passed with 1,603 transformed modules.
- Empty workspace loaded directly at `/#quick-notes` without project context or
  first-render errors.
- Browser flow exercised create, composer reset, pin, color, global search,
  inspector edit, save, and Escape close.
- Theme adaptation was checked in Light instrument and Graphite bench.

## Responsive evidence

- 1280 x 844: no horizontal overflow; cards were 308 x 190 pixels.
- 820 x 844: no horizontal overflow; date navigation and 536-pixel composer
  remained readable.
- 390 x 844: no horizontal overflow; three-item global mobile navigation,
  full-width cards, and a 375-pixel inspector were usable.
- 640 x 422 equivalent reflow: composer, date navigation, and cards fit the
  601-pixel content width without page overflow.
- Mobile editor actions measured 100, 91, and 100 pixels and did not overlap.
- Global focus-visible and reduced-motion rules remain active in `base.css`.

## Volume and cleanup

- Exactly 200 notes rendered in one day scope.
- Twelve pinned notes appeared before regular notes.
- The first 50 sampled cards retained one 190-pixel height and one 308-pixel
  width at desktop.
- No horizontal overflow occurred under volume.
- All 200 visual records were deleted through the API; final summary returned
  zero notes.

## Residual scope

Rich text, Markdown preview, attachments, checklists, reminders, tags, manual
folders, sharing, synchronization, authentication, and conversion to formal
QaBase records remain intentionally outside this change.

## Inspector regression verification

- The shared `Inspector` now closes only when its outside backdrop receives the
  pointer event; interactions inside the form remain active.
- An unsaved color change was discarded after clicking outside.
- A Lemon note opened with `Limão` selected, a Sky note opened next with `Céu`
  selected, and reopening the first note restored `Limão`.
- Title, content, palette class, and selected swatch all matched the newly
  opened note, confirming state isolation by note identity.
- Two temporary regression notes were removed after validation.
