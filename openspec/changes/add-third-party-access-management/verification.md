# Verification

## Automated

- Prisma schema formatted, validated, and client generated.
- Idempotent database setup completed.
- Database integrity checker completed with every third-party counter at zero.
- `smoke:third-party-access` passed creation, normalized uniqueness, fixed
  systems, month-end clamping, three-month limit, filters, renewal, immutable
  activities, note deletion, closure, summary, and cleanup.
- Existing `smoke`, `smoke:composite`, and `smoke:demands` suites passed.
- Vite production build passed with 1,602 transformed modules.
- Strict OpenSpec validation passed.

## Browser

- Desktop 1280: empty state, global rail, wide create inspector, and console.
- Tablet 820: populated Active, Expiring, Expired, and Closed states, long
  content, detail inspector, filters, and no horizontal overflow.
- Mobile 390 x 844 dark: global bottom navigation, summary reflow, filters,
  empty state, full-width create inspector, and no horizontal overflow.
- Light and dark themes preserve semantic text in addition to state colors.
- Escape closes the inspector and dialogs expose modal semantics.
- A 200-record ledger rendered without page overflow; initial load completed in
  461 ms in the local validation environment.
- Direct navigation was rechecked in clean sessions through both
  `localhost:5173/#third-party-access` and
  `127.0.0.1:5173/#third-party-access`, without runtime errors.
- Vite now binds one host with strict port enforcement, preventing stale IPv4
  and IPv6 instances from serving different frontend versions.
- Creating a third party now closes the inspector after the list refreshes.
  The note textarea and author field were rechecked in Graphite bench with
  consistent surface, border, placeholder, focus, and control sizing.

## Cleanup And Limits

- Four visual records and 200 load records were removed after validation.
- Telegram delivery, reminder cadence, authentication, and external account
  provisioning remain intentionally outside this change.
