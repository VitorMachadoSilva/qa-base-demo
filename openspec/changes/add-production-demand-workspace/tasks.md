## 1. Data model and migration

- [x] 1.1 Add `ProductionDemand` to the Prisma schema with project ownership, immutable AD/MF type, normalized code, common fields, type-specific resolution fields, dates, indexes, and deletion behavior.
- [x] 1.2 Add the self-relation from MF to AD and optional relations to validation brief, run, and milestone with same-project validation and `SetNull` source deletion behavior.
- [x] 1.3 Add append-only `ProductionDemandActivity` with ordered timestamps, activity kind, readable message, optional author, and state transition context.
- [x] 1.4 Create a forward SQLite migration for the new tables, foreign keys, unique project/type/code constraint, filters, and timeline indexes.
- [x] 1.5 Extend the idempotent database setup so both fresh and existing local databases receive the final demand schema without changing current data.
- [x] 1.6 Generate Prisma Client, validate the schema, and extend database checks for orphaned demands, cross-project links, invalid MF-to-AD links, and activity ownership.

## 2. Core production demand API

- [x] 2.1 Add Zod schemas for demand creation, active-field update, filters, notes, closure, and reopening with conditional AD/MF validation.
- [x] 2.2 Implement shared serialization for deadline state, calendar-day distance, related record summaries, and ordered activities.
- [x] 2.3 Implement project demand listing with combined text, type, state, criticality, QA owner, and deadline-state filters plus deterministic operational ordering.
- [x] 2.4 Implement demand creation with normalized uniqueness, default `Open` state, MF 20-calendar-day deadline calculation, and initial timeline activity in one transaction.
- [x] 2.5 Implement active demand detail and update operations, including MF deadline recalculation and timeline entries for meaningful changes.
- [x] 2.6 Implement project summary counts for active, overdue, no-date, and high-criticality AD demands.
- [x] 2.7 Register REST routes and centralized error handling for list, summary, create, detail, update, and delete operations.
- [x] 2.8 Add smoke coverage for project isolation, duplicate code normalization, invalid URLs, conditional fields, default ordering, combined filters, and empty summaries.

## 3. Lifecycle, history, and links

- [x] 3.1 Implement explicit MF closure requiring workaround summary and delivery date, recording closure data and activity atomically.
- [x] 3.2 Implement explicit AD closure requiring resolution summary and production release date, recording closure data and activity atomically.
- [x] 3.3 Implement reopening with a required reason, return to `InProgress`, retained prior closure context, and protection against editing or deleting closed demands.
- [x] 3.4 Implement note creation and eligible note deletion while keeping system activities immutable and the timeline chronologically stable.
- [x] 3.5 Implement optional links to validation brief, run, and milestone with project ownership checks and readable relation summaries.
- [x] 3.6 Implement MF-to-AD linking with type and project validation, inverse related-MF summaries, and prevention of invalid self or MF targets.
- [x] 3.7 Preserve readable link activities after a linked source is renamed or deleted and verify live relations become empty without deleting the demand.
- [x] 3.8 Add smoke coverage for MF and AD closure rules, overdue derivation, reopening, closed-record protections, timeline ordering, cross-project links, and source deletion.

## 4. Frontend contracts and navigation

- [x] 4.1 Extend `frontend/src/services/api.js` with production demand list, summary, CRUD, note, close, and reopen contracts using existing error behavior.
- [x] 4.2 Add `Demandas` as a project destination in the desktop rail, tablet drawer, and mobile navigation with a suitable Lucide icon and accessible label.
- [x] 4.3 Add route state and project-context loading for demands without changing repository, planning, validation, or run navigation.
- [x] 4.4 Add reusable display helpers for demand type, state, criticality, deadline state, calendar dates, and related-record labels.

## 5. Production demand workspace

- [x] 5.1 Build the demand workspace command band, compact operational summary, empty state, loading state, and recoverable failure state.
- [x] 5.2 Build a continuous ledger showing code, type, title, status, impact, QA owner, and deadline with stable row geometry and semantic text beyond color.
- [x] 5.3 Add composable search, type, state, criticality, owner, and deadline filters that preserve selection and update the summary predictably.
- [x] 5.4 Build the wide create and edit inspector with segmented AD/MF selection, common fields, conditional fields, inline validation, and unsaved-work preservation.
- [x] 5.5 Build demand detail with related validation brief, run, milestone, linked AD or related MFs, and safe navigation to available internal contexts.
- [x] 5.6 Build the chronological activity view with note creation, author text, eligible note removal, and readable system events.
- [x] 5.7 Add close and reopen flows with type-specific confirmation, required resolution data, clear locked state, and immediate queue/summary refresh.
- [x] 5.8 Add active-demand deletion with strong confirmation and explain why a closed demand must be reopened before deletion.

## 6. Responsive and accessible behavior

- [x] 6.1 Style deadline, status, type, and criticality indicators in Light instrument and Graphite bench with stable dimensions and WCAG AA contrast.
- [x] 6.2 Adapt ledger, filters, wide inspector, timeline, and actions for 1280 desktop, 820 tablet, and 390 by 844 mobile without horizontal page overflow.
- [x] 6.3 Verify keyboard order, visible focus, dialog semantics, Escape behavior, reduced motion, and 200 percent zoom for the complete demand workflow.
- [x] 6.4 Verify empty, populated, overdue, no-date, closed, long-content, and 200-record states and record intentional visual adjustments.

## 7. Validation and documentation

- [x] 7.1 Run setup and database checks against a migrated representative database and a fresh database, confirming all new integrity counters are zero.
- [x] 7.2 Run existing backend smoke tests and the dedicated production-demand smoke suite, resolving any regressions.
- [x] 7.3 Run the frontend production build and browser interaction validation across desktop, tablet, mobile, light, and dark scenarios.
- [x] 7.4 Update `API.md`, `ARCHITECTURE.md`, `PRODUCT.md`, `IMPLEMENTATION.md`, `TASKS.md`, and handoff context with the delivered demand workflow.
- [x] 7.5 Record final verification evidence, residual limitations, test-data cleanup, and strict OpenSpec validation before requesting review and archival.
