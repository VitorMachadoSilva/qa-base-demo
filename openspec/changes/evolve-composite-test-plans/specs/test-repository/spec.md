## ADDED Requirements

### Requirement: Project component catalog

The system SHALL allow the user to create, view, rename, reorder, and delete
functional components inside one project without affecting other projects.

#### Scenario: Create a component

- **WHEN** the user creates a component with a valid unique name
- **THEN** the component becomes available for cases and filters in the active project

#### Scenario: Reject a duplicate component

- **WHEN** the user submits a component name already used in the same project regardless of letter casing
- **THEN** the system rejects the duplicate and preserves the existing catalog

#### Scenario: Delete an assigned component

- **WHEN** the user deletes a component assigned to one or more cases
- **THEN** the component associations are removed while the cases and their suites remain unchanged

### Requirement: Multiple case components

The system SHALL allow a test case to reference zero or more components from
the same project while retaining exactly one suite as its primary location.

#### Scenario: Classify a cross-functional case

- **WHEN** the user assigns multiple valid project components to a case
- **THEN** every selected component is associated once and the case remains in its current suite

#### Scenario: Keep a case without components

- **WHEN** the user saves a valid case without selecting a component
- **THEN** the case remains usable in the repository, plans, and runs

#### Scenario: Reject a cross-project component

- **WHEN** a case update references a component from another project
- **THEN** the system rejects the update without changing the case

## MODIFIED Requirements

### Requirement: Repository search and filters

The system SHALL allow test cases to be searched by text and filtered by suite,
component, priority, type, severity, and automation status.

#### Scenario: Combine search and filters

- **WHEN** the user enters text and selects one or more metadata filters
- **THEN** the repository lists only cases that satisfy the text and every active filter

#### Scenario: Filter by component

- **WHEN** the user selects one component
- **THEN** the repository lists cases associated with that component regardless of their suites

#### Scenario: No matching cases

- **WHEN** no case satisfies the active search and filters
- **THEN** the system displays a no-results state without changing stored cases
