## 1. Data model and migration

- [x] 1.1 Add `TestComponent` and `TestCaseComponent` to the Prisma schema with project-scoped names, case relations, indexes, and cascade behavior; verify Prisma validates the schema.
- [x] 1.2 Add `TestPlanSection` and its ordered plan relation to the Prisma schema; verify every plan item belongs to exactly one section.
- [x] 1.3 Extend `TestPlanItem` with section-local position, transition instructions, and one optional prerequisite item; remove the constraint that prevents repeating a case in one plan and verify the new constraints.
- [x] 1.4 Add `RunPlanSection` and extend `RunTestCase` with section, snapshot position, transition instructions, and prerequisite occurrence; remove the constraint that prevents duplicate case occurrences in a run and verify independent result rows are supported.
- [x] 1.5 Create a forward migration that backfills one `Casos do plano` section per existing plan, preserves item order, snapshots equivalent run sections, and keeps existing run results intact.
- [x] 1.6 Update the idempotent database setup for fresh and existing local databases, then run Prisma generation and the database check script successfully.

## 2. Backend contracts and component catalog

- [x] 2.1 Extend the Zod validation layer with component catalog, multi-component case assignment, sectioned plan hierarchy, transition instruction, and prerequisite schemas.
- [x] 2.2 Implement project-scoped component list, create, rename, and delete operations with normalized unique names and explicit handling for components still assigned to cases.
- [x] 2.3 Register component routes in the Express application and add smoke coverage for project isolation, validation errors, duplicate names, and deletion behavior.
- [x] 2.4 Extend test case create, update, list, and detail responses to persist and serialize multiple components without changing the case's primary suite.
- [x] 2.5 Add component filtering to repository queries and verify it composes with text, priority, type, severity, automation, and suite filters.

## 3. Composite plan API

- [x] 3.1 Update plan create and edit operations to accept the complete section and item hierarchy with request-local item keys.
- [x] 3.2 Validate nonempty section ownership, section-local positions, unique request keys, and prerequisites that reference exactly one earlier item in the same plan.
- [x] 3.3 Persist hierarchy replacement in one transaction while safely resolving local prerequisite keys and allowing the same reusable case in multiple occurrences.
- [x] 3.4 Return ordered sections, repeated case occurrences, transition instructions, and prerequisite references from plan list and detail endpoints.
- [x] 3.5 Preserve legacy plan requests by placing flat ordered items into a default section, and verify old clients receive an equivalent readable plan.
- [x] 3.6 Add backend smoke scenarios for section ordering, duplicate case occurrences, valid prerequisites, rejected forward or external references, and transaction rollback.

## 4. Run snapshot and execution rules

- [x] 4.1 Update run creation from a plan to snapshot sections, occurrence order, transition instructions, repeated cases, and prerequisite links in one transaction.
- [x] 4.2 Keep run creation from manually selected cases compatible by generating a default run section with no prerequisites.
- [x] 4.3 Extend run detail and queue responses with ordered section context and prerequisite result summaries while preserving the immutable snapshot after later plan edits.
- [x] 4.4 Prevent recording a dependent occurrence while its prerequisite is `Untested`, and allow it after any terminal prerequisite result while exposing that result as execution context.
- [x] 4.5 Verify repeated occurrences of the same case store independent status, evidence, comment, defect link, executor, and execution timestamp.
- [x] 4.6 Add smoke scenarios for dependency locking, terminal-result unlocking, snapshot immutability, duplicate occurrence independence, and legacy run readability.

## 5. Repository experience

- [x] 5.1 Add component catalog loading and management to the centralized frontend API service with consistent error handling.
- [x] 5.2 Add a compact multi-component selector to case create and edit surfaces, including empty, loading, validation, and removed-component states.
- [x] 5.3 Add a component filter to the repository toolbar and show assigned components in case details without displacing suite hierarchy.
- [x] 5.4 Verify component management, assignment, search composition, keyboard access, responsive layout, and both visual themes in the repository.

## 6. Composite plan editor

- [x] 6.1 Extend the planning API client and local editor state to preserve stable section and item keys, repeated case occurrences, transition instructions, and prerequisite references.
- [x] 6.2 Build section create, rename, reorder, and remove controls with a mandatory default section and clear confirmation when removal affects items.
- [x] 6.3 Support adding the same repository case more than once and moving occurrences within or between sections without losing occurrence-specific data.
- [x] 6.4 Add transition instruction editing and an optional prerequisite selector limited to earlier occurrences in the same plan.
- [x] 6.5 Present component labels and section context in case selection so cross-functional plan composition remains scannable.
- [x] 6.6 Validate the full hierarchy before save, map backend field errors to the affected section or occurrence, and preserve unsaved work after a failed request.
- [x] 6.7 Verify the editor with empty, populated, duplicate, invalid dependency, long-content, mobile, light-theme, and dark-theme scenarios.

## 7. Guided execution experience

- [x] 7.1 Group the run queue and guided execution view by snapshotted plan section while preserving a continuous execution order.
- [x] 7.2 Show transition instructions at the boundary where they apply and expose prerequisite result context beside dependent occurrences.
- [x] 7.3 Disable result controls for blocked occurrences with a concise reason, then update readiness immediately after the prerequisite receives a terminal result.
- [x] 7.4 Distinguish repeated occurrences through section and position context while keeping each occurrence's result and evidence independent.
- [x] 7.5 Verify execution navigation, dependency state changes, refresh persistence, responsive layout, keyboard operation, and both visual themes.

## 8. Validation and documentation

- [x] 8.1 Run backend smoke tests and database checks against both a migrated representative database and a fresh database.
- [x] 8.2 Run the frontend production build and resolve compilation, lint, or bundle errors introduced by the change.
- [x] 8.3 Perform Playwright visual and interaction validation across desktop, tablet, and mobile viewports in light and dark themes, recording any intentional design adjustments.
- [x] 8.4 Update `API.md`, `ARCHITECTURE.md`, `PRODUCT.md`, and implementation notes with the composite plan, component catalog, migration, and dependency semantics.
- [x] 8.5 Record the final verification evidence and residual limitations in the change before requesting review and archival.
