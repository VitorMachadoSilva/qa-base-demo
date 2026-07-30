## ADDED Requirements

### Requirement: Project test workspace
The system SHALL provide a project workspace with direct access to its overview,
test repository, and test runs while preserving the active project context.

#### Scenario: Open a project repository
- **WHEN** the user selects a project and opens the test repository
- **THEN** the system displays only the suites and test cases that belong to that project

#### Scenario: Project without test content
- **WHEN** the active project has no suites or test cases
- **THEN** the repository displays an empty state with an action to create the first suite

### Requirement: Hierarchical suite organization
The system SHALL allow the user to create, rename, move, and delete suites in a
hierarchy inside one project.

#### Scenario: Create a child suite
- **WHEN** the user creates a suite under an existing suite
- **THEN** the new suite appears as a child without changing suites in other projects

#### Scenario: Reject a cyclic hierarchy
- **WHEN** the user attempts to move a suite below itself or one of its descendants
- **THEN** the system rejects the change and preserves the previous hierarchy

### Requirement: Reusable test case maintenance
The system SHALL allow the user to create, view, edit, move, and delete a test
case with title, preconditions, ordered steps, expected results, priority, type,
severity, and automation status.

#### Scenario: Create a complete test case
- **WHEN** the user submits valid case details with at least one ordered step
- **THEN** the system saves the case in the selected suite and returns it with all fields

#### Scenario: Reject an incomplete test case
- **WHEN** the user submits a case without a valid title or executable step
- **THEN** the system keeps the editor open and identifies the fields that need correction

#### Scenario: Move a case between suites
- **WHEN** the user moves a case to another suite in the same project
- **THEN** the case appears in the destination suite and retains its content

### Requirement: Repository search and filters
The system SHALL allow test cases to be searched by text and filtered by suite,
priority, type, severity, and automation status.

#### Scenario: Combine search and filters
- **WHEN** the user enters text and selects one or more metadata filters
- **THEN** the repository lists only cases that satisfy the text and every active filter

#### Scenario: No matching cases
- **WHEN** no case satisfies the active search and filters
- **THEN** the system displays a no-results state without changing stored cases
