## 1. Data foundation

- [x] 1.1 Extend the Prisma schema with hierarchical suites, structured test steps, case metadata, run snapshots, actual result, duration, and completion timestamps
- [x] 1.2 Add an additive SQLite migration and update the idempotent setup script for existing local databases
- [x] 1.3 Generate the Prisma client and verify existing project data remains readable

## 2. Test repository API

- [x] 2.1 Add hierarchy validation and parent support to suite create and update endpoints
- [x] 2.2 Add structured steps and new metadata to test case create, read, update, move, and delete endpoints
- [x] 2.3 Add project-level case search and filters with predictable empty results
- [x] 2.4 Add API smoke coverage for hierarchy cycles, case validation, moving cases, search, and filters

## 3. Project workspace and repository UI

- [x] 3.1 Introduce project workspace navigation for overview, repository, and runs
- [x] 3.2 Build the suite tree with create, rename, move, delete, and empty states
- [x] 3.3 Build the case list with search, metadata filters, selection, and no-results state
- [x] 3.4 Build the case editor with ordered steps, validation, save, move, and delete actions
- [x] 3.5 Verify the repository flow at desktop and mobile viewport sizes

## 4. Run execution

- [x] 4.1 Update run creation to persist a snapshot for every selected test case
- [x] 4.2 Add result validation, actual result, duration, run completion, and read-only completed runs
- [x] 4.3 Build the run creation flow from selected repository cases
- [x] 4.4 Build the guided execution view with queue, progress, status controls, comments, and next untested navigation
- [x] 4.5 Add API coverage for cross-project selection, empty selection, snapshot preservation, and completed-run protection

## 5. Quality overview

- [x] 5.1 Extend project and run summaries with executed counts, completion percentage, and complete status distribution
- [x] 5.2 Build actionable project and run indicators that filter or open their source records
- [x] 5.3 Add zero-data and legacy-run protections to summary endpoints and views

## 6. Release validation and documentation

- [x] 6.1 Run backend smoke tests, frontend build, and OpenSpec strict validation
- [x] 6.2 Complete an end-to-end visual check from project creation through a finished run
- [x] 6.3 Update API.md, ARCHITECTURE.md, IMPLEMENTATION.md, and the root TASKS.md with the delivered behavior
