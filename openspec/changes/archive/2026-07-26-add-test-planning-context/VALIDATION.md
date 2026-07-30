# Validation evidence

Validated on 2026-07-26.

## Automated evidence

| Requirement area | Evidence |
|---|---|
| Plan drafts, duplicate names, ordering and isolation | `backend/scripts/smoke.js` |
| Plan runs, empty plans and conflicting scopes | `backend/scripts/smoke.js` |
| Milestone dates, lifecycle, summaries and completed-state rule | `backend/scripts/smoke.js` |
| Environment and configuration CRUD, duplicates and isolation | `backend/scripts/smoke.js` |
| One configuration per group | `backend/scripts/smoke.js` |
| Snapshot survival after edit and deletion | `backend/scripts/smoke.js` |
| Source case deletion and historical run preservation | `backend/scripts/smoke.js` |
| Context filters and legacy runs | `backend/scripts/smoke.js` |
| Orphans, positions and cross-project relations | `backend/scripts/checkDatabase.js` |
| Idempotent additive setup | `backend/src/db/setupDatabase.js`, executed twice |
| Production compilation | Vite build, 1,582 modules transformed |
| OpenSpec structure | OpenSpec 1.6.0 strict validation, 1 passed and 0 failed |

## Visual evidence

Desktop validation confirmed:

- plan creation with repository selection;
- milestone, environment, group and option creation;
- contextual run creation from a plan;
- captured plan, milestone, environment and configuration in run detail;
- context labels in history;
- environment filtering and full-history restoration;
- legacy run readability;
- no browser console errors.

Mobile validation at 390 x 844 confirmed:

- planning navigation and plan list;
- readable controls and stable dimensions;
- bottom-sheet run dialog;
- milestone, environment and configuration selectors;
- no horizontal page overflow.

## Result

Every scenario in the four delta specifications has implementation evidence.
The change is ready to sync and archive.
