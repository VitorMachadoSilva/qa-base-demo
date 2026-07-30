## Context

QaBase currently provides structured records for tests, validation briefs,
production demands, and third-party access. It has no low-friction place for
temporary fragments that are useful during QA work but not yet appropriate for
those structured modules.

The design combines patterns observed in Microsoft Sticky Notes, Google Keep,
Apple Notes, NotePlan, and Notion Quick Notes. Sticky Notes validates a compact
note list, search, resize, color, and theme adaptation. Google Keep validates
pinning, color, and quick visual scanning. NotePlan validates one immutable
calendar bucket per day. Notion validates a dedicated inbox for unclassified
thoughts. QaBase needs the speed of those tools without their account, sharing,
reminder, and rich-editor complexity.

The application remains local-first, project-independent, single-user, and
backed by SQLite. Date behavior must remain stable if the app later runs on the
shared desktop server discussed for the team.

## Goals / Non-Goals

**Goals:**

- Capture a note with minimal required input.
- Keep note creation days immutable and browseable as virtual folders.
- Support fast retrieval through search, pinning, color, and recent-day counts.
- Preserve the Quality Instrument visual language in light and dark themes.
- Keep the global workspace useful at desktop, tablet, and mobile widths.
- Add the data model and API without modifying project-owned records.

**Non-Goals:**

- Rich text, Markdown preview, drawing, attachments, checklists, or reminders.
- Tags, manual folder management, nested folders, or note sharing.
- Reordering notes by drag and drop.
- Conversion into test cases, briefs, or demands.
- Cloud sync, authentication, multiuser authorship, or external integrations.

## Decisions

### One table with an immutable civil creation day

`QuickNote` stores optional title, required content, color, pinned state,
`createdDay`, `createdAt`, and `updatedAt`. `createdDay` is a `YYYY-MM-DD`
string derived once in the configured QaBase timezone and never changes during
updates.

This is preferred over physical folder rows because day folders are predictable,
need no user maintenance, and cannot become empty or inconsistent. It is
preferred over deriving the day from UTC on every read because a late-evening
note must remain in the same local day after deployment to another host.

### Configurable product timezone with a Brazil default

The backend derives civil day keys using `QABASE_TIME_ZONE`, defaulting to
`America/Sao_Paulo`. This preserves the current team's calendar while allowing a
future installation to select another timezone without a schema change.

### Seven semantic palette keys

The database stores palette keys rather than CSS values: `Paper`, `Lemon`,
`Mint`, `Sky`, `Lilac`, `Rose`, and `Coral`. Each theme maps those keys to
coordinated surfaces, borders, and text. This is preferred over arbitrary color
input because contrast remains testable and the workspace stays visually
coherent.

### Explicit save in the first version

Creation and editing use explicit save actions. This avoids ambiguous partial
records and lost update races while keeping the form compact. Automatic save can
be added later after usage shows where it is beneficial.

### Virtual date navigator and deterministic ordering

The API exposes date counts and filtered note lists. Pinned notes appear first
inside the active scope, then notes sort by latest update and id. Search spans
all dates and clearly changes the workspace from a date folder to global
results.

### Global destination

`quick-notes` is a global hash route and appears in the global rail below
third-party access. It hides project context and receives a mobile global
navigation entry. This matches ownership: notes are personal working memory,
not project data.

### Focused card grid

The workspace uses an unframed date navigator plus a responsive grid of genuine
note cards. Cards have stable widths, subtle color surfaces, visible timestamps,
pin controls, and concise previews. Creation uses an expanded composer band;
editing uses the established wide inspector pattern.

## Risks / Trade-offs

- **Many days can make navigation long** -> show today plus recent populated
  days and allow an all-notes view; the list scrolls independently.
- **Color can become the only categorization** -> colors are optional visual
  cues, while title, text, day, pin, and search remain primary.
- **Large note bodies can distort the grid** -> cards clamp previews and the
  inspector exposes the complete content.
- **Explicit save is slower than automatic save** -> keep composer fields
  minimal and preserve keyboard submit behavior.
- **Configured timezone can change later** -> existing `createdDay` values
  remain immutable; only new notes use the new configuration.
- **Deletion can remove useful context** -> require confirmation in the UI and
  keep deletion explicit; trash/recovery is outside the current scope.

## Migration Plan

1. Add the `QuickNote` model and additive SQLite migration.
2. Extend idempotent setup and integrity checks.
3. Generate Prisma Client and add validation, controller, and routes.
4. Add frontend API contracts, global navigation, workspace, and styles.
5. Run legacy and dedicated smoke suites, build, and responsive browser checks.
6. Rollback code by removing the route and workspace; the additive table can
   remain harmlessly or be removed only through an explicit later migration.

## Open Questions

No blocking questions. Tags, reminders, checklists, and conversion to structured
QaBase records remain candidates for separate evidence-driven changes.
