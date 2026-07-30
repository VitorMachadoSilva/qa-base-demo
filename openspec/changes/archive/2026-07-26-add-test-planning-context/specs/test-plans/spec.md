## ADDED Requirements

### Requirement: Project-scoped reusable test plans

The system SHALL allow the user to create, view, rename, describe, and delete
test plans inside one project without affecting plans in other projects.

#### Scenario: Create a draft plan

- **WHEN** the user creates a plan with a valid name and no selected cases
- **THEN** the system saves an empty draft plan in the active project

#### Scenario: Reject a duplicate plan name

- **WHEN** the user submits a plan name already used in the same project regardless of letter casing
- **THEN** the system rejects the duplicate and preserves the existing plans

#### Scenario: Delete a plan with historical runs

- **WHEN** the user deletes a plan that was previously used to create runs
- **THEN** the plan is removed while historical runs retain the plan snapshot

### Requirement: Ordered plan scope

The system SHALL allow the user to add, remove, search, filter, and reorder
current project test cases in a plan.

#### Scenario: Add cases to a plan

- **WHEN** the user selects valid cases from the active project
- **THEN** the cases are added once to the plan in the chosen order

#### Scenario: Reject a cross-project plan item

- **WHEN** a plan update contains a case from another project
- **THEN** the system rejects the update without changing the plan

#### Scenario: Source case is deleted

- **WHEN** a test case included in one or more plans is deleted
- **THEN** the case is removed from those plans without changing historical runs

### Requirement: Run creation from a test plan

The system SHALL allow a non-empty plan to create a run containing all of its
current cases without changing the reusable plan.

#### Scenario: Start a run from a plan

- **WHEN** the user starts a run from a plan with valid current cases
- **THEN** the system creates one run item snapshot for every ordered plan item

#### Scenario: Reject an empty plan run

- **WHEN** the user attempts to start a run from a plan with no cases
- **THEN** the system explains that the plan needs at least one case
