## 1. Data model and migration

- [x] 1.1 Add `QuickNote` to Prisma with immutable civil day, palette, pin state, content, timestamps, and retrieval indexes.
- [x] 1.2 Create an additive SQLite migration for quick notes.
- [x] 1.3 Extend idempotent database setup and integrity checks.
- [x] 1.4 Format and validate Prisma, generate the client, run setup, and confirm quick-note integrity.

## 2. Quick-notes API

- [x] 2.1 Add Zod schemas for create, update, filters, date keys, palette keys, and pin state.
- [x] 2.2 Implement configured-timezone civil day derivation and display helpers.
- [x] 2.3 Implement global listing with day scope, all-date search, and pinned-first deterministic ordering.
- [x] 2.4 Implement recent date-folder counts including today.
- [x] 2.5 Implement create and detail endpoints with immutable creation metadata.
- [x] 2.6 Implement edit and pin behavior without moving the note's date folder.
- [x] 2.7 Implement explicit deletion and centralized not-found handling.
- [x] 2.8 Register the REST routes and frontend API contracts.

## 3. Global navigation and workspace

- [x] 3.1 Add `Anotacoes rapidas` to the global rail with a Lucide icon, active state, tooltip, and accessible label.
- [x] 3.2 Add the `quick-notes` route as a global view independent of project selection.
- [x] 3.3 Add direct mobile access without exposing project context.
- [x] 3.4 Build date navigation with today, all notes, recent populated days, and counts.
- [x] 3.5 Build the compact composer with title, text, palette swatches, keyboard order, validation, and reset.
- [x] 3.6 Build global search that clearly overrides the active date folder.
- [x] 3.7 Build the responsive pinned and regular note grid with clamped previews and timestamps.
- [x] 3.8 Build the edit inspector with full content, palette selection, pin toggle, save, and delete confirmation.
- [x] 3.9 Add loading, empty, no-results, recoverable error, and saving states.

## 4. Visual system and responsive behavior

- [x] 4.1 Define seven coordinated note palettes for Light instrument and Graphite bench.
- [x] 4.2 Style note cards as stable repeated items without nested cards or layout shifts.
- [x] 4.3 Adapt date navigation, composer, grid, inspector, and actions for 1280, 820, and 390 by 844.
- [x] 4.4 Verify visible focus, meaningful labels, Escape, 200 percent reflow, reduced motion, and contrast beyond color.
- [x] 4.5 Verify empty, mixed-color, pinned, long-content, multi-day, search, and 200-note states.

## 5. Validation and documentation

- [x] 5.1 Add a dedicated quick-notes smoke suite covering validation, timezone day, search, ordering, pin, edit, immutable day, palette, delete, and cleanup.
- [x] 5.2 Run existing smoke suites and the new suite without regressions.
- [x] 5.3 Run the production build and browser interaction validation in desktop, tablet, mobile, light, and dark.
- [x] 5.4 Update API, architecture, product, implementation, tasks, and handoff documents.
- [x] 5.5 Record final evidence, cleanup, residual limitations, and strict OpenSpec validation.

## 6. Inspector regression fixes

- [x] 6.1 Close every shared right-side inspector when its outside backdrop is clicked.
- [x] 6.2 Reset the quick-note editor state by note identity to prevent color and content leakage.
- [x] 6.3 Verify outside-click dismissal and note-state isolation across different colors.
