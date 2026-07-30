## 1. Baseline and visual foundation

- [x] 1.1 Capture approved desktop and mobile baseline screenshots for Projects, Overview, Repository, Planning, Run History, Run Creation, and Run Execution
- [x] 1.2 Add semantic tokens for color, typography, spacing, geometry, elevation, density, motion, and result states
- [x] 1.3 Bundle the selected IBM Plex weights locally with system fallbacks and verify the application makes no runtime font request
- [x] 1.4 Split the monolithic stylesheet into tokens, base, shared components, workspaces, and responsive layers without changing behavior
- [x] 1.5 Add shared focus, reduced-motion, loading, empty, error, disabled, and read-only state foundations and verify them in an isolated component fixture

## 2. Application shell

- [x] 2.1 Extract shared AppShell, global rail, project context navigation, location bar, and command area components
- [x] 2.2 Implement the desktop shell with a 60 px rail, collapsible context navigation, full-width work canvas, and one primary command per workspace
- [x] 2.3 Implement tablet context drawers and mobile bottom navigation with labeled, reachable project destinations
- [x] 2.4 Preserve hash navigation, project selection, active destination, notifications, and every existing route transition
- [x] 2.5 Verify shell orientation, keyboard order, stable dimensions, and no horizontal overflow across desktop, tablet, and 390 x 844 mobile

## 3. Repository stress screen

- [x] 3.1 Recompose suite navigation, repository command bar, filters, selection count, and case collection with Quality Instrument primitives
- [x] 3.2 Implement the case DataLedger with stable row density, first-class IDs and metadata, semantic states, and context-preserving batch actions
- [x] 3.3 Move case reading and editing to an inspector on desktop while preserving a full-screen form composition on mobile
- [x] 3.4 Preserve suite hierarchy, search, combined filters, case ordering, creation, editing, deletion, and ad hoc run creation
- [x] 3.5 Verify repository states with zero, one, twenty, and two hundred cases plus keyboard and 200 percent zoom checks

## 4. Run history and creation

- [x] 4.1 Recompose run history as a continuous DataLedger showing origin, context, progress, failures, status, and time without decorative row cards
- [x] 4.2 Integrate plan, milestone, environment, and configuration filters into the command area with clear active-filter and reset behavior
- [x] 4.3 Redesign the shared RunDialog as a compact contextual overlay on desktop and full-height task surface on mobile
- [x] 4.4 Preserve ad hoc and plan-based creation, completed milestone exclusion, context snapshots, filtering, legacy runs, and empty states
- [x] 4.5 Verify history scanning and run creation on desktop and mobile without truncating identity, context, or commands

## 5. Signature execution workspace

- [x] 5.1 Build the desktop execution composition with queue, current case, ordered steps, captured context, operational strip, and stable result dock
- [x] 5.2 Implement keyboard-operable result controls, visible focus, save, save-and-next, completion, and pending-case navigation
- [x] 5.3 Preserve observed result, comment, duration, progress, status filtering, snapshot fallback, and completed read-only behavior
- [x] 5.4 Build the mobile execution flow with compact case navigation and a reachable bottom result dock
- [x] 5.5 Verify active, partially executed, completed, failed, blocked, source-deleted, and legacy runs on desktop, mobile, zoom, and reduced motion

## 6. Remaining workspaces

- [x] 6.1 Migrate Plans, Milestones, and Contexts to command bars, continuous collections, semantic status marks, inspectors, and responsive task surfaces
- [x] 6.2 Recompose Overview as an operational summary with actionable metrics and no floating section cards
- [x] 6.3 Recompose Projects as a global collection with clear current-project selection and contextual actions
- [x] 6.4 Preserve every planning CRUD flow, ordering control, lifecycle transition, progress summary, confirmation, and validation message
- [x] 6.5 Verify all remaining workspaces with loading, empty, populated, error, destructive confirmation, tablet, and mobile states

## 7. Consolidation and release validation

- [x] 7.1 Remove unused legacy selectors and literal colors after confirming all screens use semantic tokens
- [x] 7.2 Audit icon-only actions, accessible names, contrast, focus order, reduced motion, target sizes, and state communication without color
- [x] 7.3 Run the frontend production build, backend smoke suite, database integrity check, and complete cross-workspace E2E regression
- [x] 7.4 Capture final desktop, tablet, mobile, 200 percent zoom, and reduced-motion evidence for every specification scenario
- [x] 7.5 Update DESIGN_SYSTEM.md, DESIGN.md, ARCHITECTURE.md, IMPLEMENTATION.md, TASKS.md, and HANDOFF.md with final component and validation decisions
- [x] 7.6 Run strict OpenSpec validation and review the Quality Instrument requirements against implementation evidence
