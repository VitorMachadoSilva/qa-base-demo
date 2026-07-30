## MODIFIED Requirements

### Requirement: Consistent application shell

The system SHALL provide predictable global navigation, project context,
location, and primary actions across all project workspaces.

#### Scenario: Navigate on desktop

- **WHEN** the user moves between Overview, Repository, Planning, Runs, Validation, and Demands on a desktop viewport
- **THEN** the global rail, active project context, current destination, and page location remain identifiable without reducing the work canvas unnecessarily

#### Scenario: Change project

- **WHEN** the user returns to project selection and opens another project
- **THEN** the shell updates the project context and preserves the same navigation model

#### Scenario: Locate the primary action

- **WHEN** a workspace has a primary creation or execution action
- **THEN** the action appears in a consistent command area and does not compete with another primary-styled command

### Requirement: Dense operational collections

The system SHALL display cases, plans, milestones, environments, configurations,
runs, and production demands as scannable continuous collections with
context-preserving actions.

#### Scenario: Scan a populated collection

- **WHEN** a collection contains multiple records
- **THEN** the user can compare identity, state, relevant context, and key metrics without opening every record

#### Scenario: Select records for an action

- **WHEN** the user selects one or more eligible records
- **THEN** the collection presents applicable actions without shifting row dimensions or losing the current filters

#### Scenario: Inspect a record

- **WHEN** the user opens a record that can be inspected or edited contextually
- **THEN** the detail appears without losing the originating selection, filters, or scroll position

#### Scenario: Display many records

- **WHEN** a collection contains 200 records
- **THEN** row geometry remains stable and the collection supports scanning without nested cards or horizontal page overflow

### Requirement: Responsive task composition

The system SHALL adapt navigation, collections, inspectors, forms, and execution
controls to desktop, tablet, and mobile according to the task rather than only
scaling the desktop layout.

#### Scenario: Use project navigation on mobile

- **WHEN** the viewport is 390 by 844 pixels
- **THEN** primary project destinations, including Demands, are reachable through mobile navigation and do not truncate into ambiguous icon-only controls

#### Scenario: Open a long form on mobile

- **WHEN** the user creates or edits a case, plan, milestone, execution context, or production demand on mobile
- **THEN** the form uses the available viewport, keeps actions reachable, and does not create horizontal page overflow

#### Scenario: Inspect data on tablet

- **WHEN** the viewport cannot show navigation, collection, and inspector side by side
- **THEN** contextual surfaces become drawers while the selected record and originating workspace remain recoverable
