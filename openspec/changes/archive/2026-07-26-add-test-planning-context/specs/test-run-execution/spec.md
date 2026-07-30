## MODIFIED Requirements

### Requirement: Run creation from selected cases

The system SHALL allow the user to create a test run for a project from either
an ad hoc case selection or one reusable test plan, with optional milestone,
environment, and configuration context.

#### Scenario: Create an ad hoc run

- **WHEN** the user selects valid cases from the active project and confirms the run
- **THEN** the system creates one untested run item for each selected case

#### Scenario: Create a run from a plan

- **WHEN** the user selects a valid non-empty plan from the active project
- **THEN** the system creates one untested run item for every current plan item in plan order

#### Scenario: Reject conflicting scope sources

- **WHEN** a run request provides both a test plan and an ad hoc case selection
- **THEN** the system rejects the request and creates no run

#### Scenario: Reject cross-project cases

- **WHEN** a run request contains a case, plan, milestone, environment, or configuration from another project
- **THEN** the system rejects the request and creates no run

#### Scenario: Reject an empty selection

- **WHEN** the user attempts to create a run without ad hoc cases or with an empty plan
- **THEN** the system explains that at least one case must be selected

## ADDED Requirements

### Requirement: Point-in-time planning context snapshot

The system SHALL preserve the selected plan, milestone, environment, and
configuration labels used when a run is created.

#### Scenario: Edit planning records after run creation

- **WHEN** a linked plan, milestone, environment, group, or option is renamed after the run is created
- **THEN** the run continues to display the labels captured at creation time

#### Scenario: Delete planning records after run creation

- **WHEN** a linked planning or context record is deleted after the run is created
- **THEN** the run remains readable and retains its captured context

#### Scenario: Read a legacy run

- **WHEN** a run created before planning context support is opened
- **THEN** the system displays the run normally with no planning context

### Requirement: Context-aware run history

The system SHALL display and filter run history by scope origin, milestone,
environment, and selected configuration when those values exist.

#### Scenario: Filter runs by environment

- **WHEN** the user selects an environment filter
- **THEN** the run history lists only runs associated with that environment

#### Scenario: Clear run context filters

- **WHEN** the user clears all context filters
- **THEN** the complete project run history is restored
