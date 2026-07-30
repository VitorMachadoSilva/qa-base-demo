## 1. Data model and migration

- [x] 1.1 Add `ThirdParty`, `ThirdPartyAccessCycle`, `ThirdPartyAccessGrant`, and `ThirdPartyAccessActivity` to the Prisma schema with normalized identity, lifecycle fields, relations, indexes, and deletion behavior.
- [x] 1.2 Create an additive SQLite migration for third-party identities, historical cycles, fixed-system grants, and ordered activities.
- [x] 1.3 Extend the idempotent database setup for fresh and existing local databases without changing current project data.
- [x] 1.4 Generate Prisma Client, validate the schema, and extend database checks for orphaned cycles, grants, activities, duplicate grants, and multiple current cycles.

## 2. Registry and calculation API

- [x] 2.1 Add Zod schemas for identity creation and update, cycle dates, fixed systems, filters, notes, renewal, and closure.
- [x] 2.2 Implement normalized identity uniqueness and shared calendar helpers for three-month limits, month-end clamping, day distance, and derived state.
- [x] 2.3 Implement global listing with search, state, system, company, and owner filters plus deterministic urgency ordering.
- [x] 2.4 Implement global summary counts for current, active, expiring, expired, and closed records.
- [x] 2.5 Implement transactional creation of a third party, initial cycle, unique grants, and initial activity.
- [x] 2.6 Implement detail serialization with current cycle, ordered historical cycles, grants, and activities.
- [x] 2.7 Implement identity update without rewriting historical cycles and record a readable activity.
- [x] 2.8 Register REST routes and centralized error behavior for list, summary, create, detail, and update.

## 3. Renewal, closure, and history

- [x] 3.1 Implement atomic renewal that closes the prior current cycle, creates the next cycle, validates the three-month limit, and records readable history.
- [x] 3.2 Implement explicit closure with required reason while preserving identity and all historical cycles.
- [x] 3.3 Prevent direct cycle mutation, repeated closure, unsupported systems, duplicate grants, and a second current cycle.
- [x] 3.4 Implement note creation and eligible note deletion while keeping system activities immutable.
- [x] 3.5 Add a dedicated smoke suite for validation, month-end dates, derived states, combined filters, ordering, renewal, closure, history, and cleanup.

## 4. Frontend contracts and global navigation

- [x] 4.1 Extend `frontend/src/services/api.js` with third-party list, summary, create, detail, update, renew, close, note, and note-deletion contracts.
- [x] 4.2 Add `Acessos de terceiros` to the global rail with a suitable Lucide icon, active state, tooltip, and accessible label.
- [x] 4.3 Add the `third-party-access` global route without requiring or changing the selected project.
- [x] 4.4 Ensure project context navigation is hidden for the global access workspace while remaining unchanged for project destinations.
- [x] 4.5 Add reusable display helpers for systems, dates, access states, remaining days, and cycle periods.

## 5. Third-party access workspace

- [x] 5.1 Build the global workspace command band, summary cells, empty state, loading state, and recoverable failure state.
- [x] 5.2 Build a continuous ledger showing person, company and role, systems, internal owner, expiration, and textual state.
- [x] 5.3 Add composable search, state, system, company, and internal-owner filters with predictable summary behavior.
- [x] 5.4 Build a wide create and edit inspector with identity fields, fixed-system checkboxes, approval date, default expiration, shorter-date support, and inline validation.
- [x] 5.5 Build detail with current access facts, observations, fixed-system grants, and chronological cycle history.
- [x] 5.6 Build the activity timeline with note creation, optional author, and eligible note removal.
- [x] 5.7 Build renewal with copied systems, new approval, constrained expiration, and immediate queue refresh.
- [x] 5.8 Build explicit access closure with required reason, clear closed state, and preserved history.

## 6. Responsive and accessible behavior

- [x] 6.1 Style Active, Expiring, Expired, and Closed states in Light instrument and Graphite bench with semantic text beyond color.
- [x] 6.2 Adapt global navigation, summary, filters, ledger, inspector, history, and actions for 1280 desktop, 820 tablet, and 390 by 844 mobile without horizontal page overflow.
- [x] 6.3 Verify keyboard order, visible focus, dialog semantics, Escape behavior, reduced motion, and effective 200 percent reflow.
- [x] 6.4 Verify empty, populated, expiring, expired, closed, month-end, long-content, and 200-record states.

## 7. Validation and documentation

- [x] 7.1 Run setup and database checks against representative and fresh databases, confirming every new integrity counter is zero.
- [x] 7.2 Run existing smoke suites and the dedicated third-party access suite without regressions.
- [x] 7.3 Run the frontend production build and browser interaction validation across desktop, tablet, mobile, light, and dark scenarios.
- [x] 7.4 Update `API.md`, `ARCHITECTURE.md`, `PRODUCT.md`, `IMPLEMENTATION.md`, `TASKS.md`, and `HANDOFF.md` with the delivered global access workflow.
- [x] 7.5 Record final verification evidence, residual limitations, temporary-data cleanup, and strict OpenSpec validation before requesting review and archival.
