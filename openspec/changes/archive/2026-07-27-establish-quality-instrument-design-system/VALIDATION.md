# Validation - Quality Instrument

Date: 26 July 2026

## Automated checks

- Frontend production build: passed with Vite 6.4.3.
- Backend smoke suite: passed, including planning, context snapshots, legacy
  runs, source deletion, filters, completion, and validation failures.
- SQLite integrity check: passed with zero orphaned records, duplicate
  positions, cross-project references, or invalid run configurations.
- Open browser session: no current console errors.
- Fonts: IBM Plex Sans and IBM Plex Mono are served from the local bundle only.

## Visual evidence

Baseline evidence is stored in `docs/design/baseline`.

Final evidence is stored in `docs/design/final` and includes Projects,
Overview, Repository, Planning, Run History, Run Creation, and Run Execution
at desktop, tablet, and mobile sizes.

Additional evidence:

- `stress-200-cases-mobile.png`: the shared ledger rendered 200 stable rows;
- `zoom-200-equivalent-repository.png`: half-width reflow used as the 200%
  layout equivalent because the embedded browser does not expose browser zoom;
- all tested pages reported document `scrollWidth === clientWidth`.

## State and scale matrix

| Area | Evidence |
|---|---|
| Repository 0 cases | Checkout suite |
| Repository 1 case | Payment suite |
| Repository 20 cases | isolated shared-ledger fixture |
| Repository 200 cases | isolated shared-ledger fixture |
| Contextual case editing | desktop inspector and mobile full-screen surface |
| Run history | contextual, legacy, and completed runs |
| Run creation | ad hoc scope, active milestone, environment, configuration |
| Run execution | completed read-only run with captured context and source snapshots |
| Planning | plan, milestone, environment, and configuration collections |
| Empty/error/loading/read-only | isolated design-system fixture |

## Accessibility audit

- Native controls and semantic tables remain keyboard reachable.
- Focus uses a shared two-pixel `focus-visible` ring.
- Icon-only commands keep accessible titles.
- Result and lifecycle states use text and icon in addition to color.
- Mobile navigation uses five labeled destinations.
- Mobile document overflow was not detected at 390 x 844.
- Reduced-motion rules remove nonessential animation and transitions. The host
  preference was not enabled, so this item was verified statically rather than
  through OS-level emulation.

## Residual risk

The product has no automated frontend test runner yet. Visual and interaction
coverage is repeatable through the fixture and saved evidence, but future work
should add component and end-to-end automation before larger workflow changes.
