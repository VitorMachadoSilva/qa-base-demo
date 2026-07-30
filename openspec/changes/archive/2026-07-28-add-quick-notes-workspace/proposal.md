## Why

QAs frequently need to capture temporary context, commands, observations, links,
and follow-ups before that information is ready for a formal test case, demand,
or validation brief. Keeping those fragments outside QaBase creates scattered
context and makes notes from previous workdays difficult to recover.

## What Changes

- Add a global `Anotacoes rapidas` destination independent of projects.
- Provide an always-ready composer for title-optional text notes.
- Automatically group notes into date folders from their immutable creation day.
- Allow notes to be edited, pinned, recolored, searched, and deleted.
- Offer seven restrained sticky-note colors adapted to both QaBase themes.
- Keep pinned notes visible before the selected day's regular notes.
- Provide a date navigator with today, recent days, note counts, and an all-notes view.
- Preserve creation date while exposing the latest edit time.
- Make the workspace responsive and keyboard accessible.
- Keep notes local in SQLite with no sync or external account dependency.
- Exclude rich text, attachments, reminders, collaboration, handwriting, and
  conversion to formal QaBase records from this change.

## Capabilities

### New Capabilities

- `quick-notes`: Global quick capture, automatic date grouping, pinning, color,
  search, edit, and deletion behavior.

### Modified Capabilities

- `quality-instrument-interface`: Add the global notes destination and define its
  card grid, composer, date navigation, theme, and responsive behavior.

## Impact

- Adds one Prisma model and an additive SQLite migration.
- Adds global REST routes for quick notes and date summaries.
- Adds a React workspace, global rail destination, mobile navigation entry, and
  focused styles.
- Extends database setup, integrity checks, API documentation, product
  documentation, smoke coverage, and handoff records.
- Introduces no external dependency or breaking API change.
