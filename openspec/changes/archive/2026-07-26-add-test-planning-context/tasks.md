## 1. Data foundation

- [x] 1.1 Extend the Prisma schema with test plans, ordered plan items, milestones, environments, configuration groups, configuration options, run context relations, and snapshot fields
- [x] 1.2 Add an additive SQLite migration and update the idempotent setup script for existing databases
- [x] 1.3 Generate the Prisma client and verify legacy runs remain readable with null planning context
- [x] 1.4 Extend the database integrity check with orphan, duplicate-position, and cross-project context checks

## 2. Test plan API

- [x] 2.1 Add validation and project-scoped CRUD endpoints for test plans
- [x] 2.2 Add ordered plan item replacement with duplicate and cross-project case protection
- [x] 2.3 Preserve historical run snapshots when plans or source cases are renamed or deleted
- [x] 2.4 Add API coverage for empty drafts, duplicate names, ordering, source deletion, and project isolation

## 3. Milestone and execution context API

- [x] 3.1 Add project-scoped milestone CRUD, date validation, lifecycle transitions, and completion timestamps
- [x] 3.2 Add milestone progress summaries and prevent completed milestones from being selected for new runs
- [x] 3.3 Add project-scoped environment CRUD with duplicate-name protection
- [x] 3.4 Add ordered configuration group and option CRUD with duplicate-name protection
- [x] 3.5 Add API coverage for invalid dates, lifecycle rules, context deletion, duplicates, and project isolation

## 4. Context-aware run execution

- [x] 4.1 Extend run creation validation to accept exactly one scope source: ad hoc cases or a test plan
- [x] 4.2 Validate milestone, environment, and configuration ownership and enforce one option per group
- [x] 4.3 Persist plan, milestone, environment, and configuration snapshots when creating a run
- [x] 4.4 Extend run list and detail responses with planning context and context filters
- [x] 4.5 Add API coverage for plan runs, empty plans, conflicting sources, invalid configurations, snapshots, and legacy runs

## 5. Planning workspace UI

- [x] 5.1 Add a Planning destination to the project workspace with Plans, Milestones, and Contexts tabs
- [x] 5.2 Build the plan list and editor with draft empty states, repository search, case selection, and ordering
- [x] 5.3 Build milestone management with dates, lifecycle controls, progress summaries, and completed states
- [x] 5.4 Build environment and configuration management with compact ordered controls
- [x] 5.5 Add confirmations, validation messages, loading states, and responsive behavior for all planning views

## 6. Run creation and history UI

- [x] 6.1 Reuse one run creation dialog for ad hoc and plan-based scope
- [x] 6.2 Add optional milestone, environment, and configuration selection to run creation
- [x] 6.3 Display captured planning context in run history and the execution workspace
- [x] 6.4 Add run history filters for plan origin, milestone, environment, and configuration
- [x] 6.5 Verify completed and legacy runs remain readable when linked planning records are changed or deleted

## 7. Release validation and documentation

- [x] 7.1 Run database setup twice, integrity checks, backend smoke tests, and the frontend production build
- [x] 7.2 Complete desktop and mobile visual checks for plan creation, contextual run creation, filtering, and preserved history
- [x] 7.3 Update API.md, ARCHITECTURE.md, IMPLEMENTATION.md, PRODUCT.md, TASKS.md, and HANDOFF.md
- [x] 7.4 Run strict OpenSpec validation and review every requirement against implementation evidence
