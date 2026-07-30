# Verification

Verified on 2026-07-27 in the local QaBase workspace.

## Automated checks

| Check | Result |
|---|---|
| Prisma format and schema validation | Passed |
| Prisma Client generation | Passed |
| Idempotent setup on representative database, twice | Passed |
| Database integrity counters | All zero |
| Setup and checks on a fresh SQLite database | Passed |
| General API smoke suite | Passed |
| Composite plan smoke suite | Passed |
| Production demand smoke suite | Passed |
| Vite production build | Passed, 1,601 modules |
| Browser console warnings and errors | None |

The dedicated smoke suite covered project isolation, normalized duplicate codes,
invalid URLs, MF deadline derivation, AD without date, combined filters, summary
counts, same-project links, inverse MF-to-AD visibility, immutable system
activities, source deletion, type-specific closure, closed-record protection and
reopening.

## Browser matrix

| Scenario | Desktop 1280 | Tablet 820 | Mobile 390 x 844 |
|---|---:|---:|---:|
| Empty workspace | Passed | Passed | Passed |
| Populated ledger | Passed | Passed | Passed |
| Create MF | Passed | Passed | Passed |
| Create high-criticality AD without date | Passed | Passed | Passed |
| Note and timeline | Passed | Passed | Passed |
| MF closure and locked state | Passed | Passed | Passed |
| Reopening with reason | Passed | Passed | Passed |
| Combined filters and summary actions | Passed | Passed | Passed |
| Light instrument | Passed | Passed | Passed |
| Graphite bench | Passed | Passed | Passed |
| No horizontal page overflow | Passed | Passed | Passed |

The ledger uses intentional internal horizontal scrolling below its minimum
operational width. The document itself does not overflow.

## Scale and accessibility

- Verified stable rendering with zero, two and 200 demand rows.
- Verified overdue, no-date, closed and long-content records.
- Verified effective 200 percent reflow through the equivalent constrained CSS
  viewport and the narrower mobile breakpoint.
- Verified visible global focus treatment, semantic dialog exposure and Escape
  closure for the demand inspector.
- Existing reduced-motion rules cover transitions and the loading animation.
- Type, status, deadline and criticality always include text in addition to
  semantic color.

## Intentional adjustments

- The demand inspector is 640 pixels wide on desktop and becomes a full-width
  drawer on mobile.
- Summary cells form a two-by-two grid on narrow screens.
- The MF deadline form now uses the user's local calendar date instead of UTC,
  preventing a next-day default after 21:00 in Brazil.
- Closed demands hide destructive actions and explain that reopening is
  required.
- Closed MF impact reads `Paliativa entregue`.
- MF/AD segmented labels keep a visible gap on narrow screens.

## Cleanup and limitations

All 200 temporary records and functional examples were removed. Final database
counts are zero for production demands and activities, with every new integrity
counter at zero.

Current intentional limitations:

- no authentication or multi-user permissions;
- no Telegram notifications or configurable reminder cadence;
- no third-party access management;
- no Jira synchronization beyond storing an HTTP(S) source link;
- no attachments or binary evidence.
