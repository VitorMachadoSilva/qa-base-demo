# Test Run Execution

## Purpose

Define run creation, point-in-time case snapshots, manual result recording, and
guided execution behavior.

## Requirements

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

### Requirement: Point-in-time case snapshot

The system SHALL preserve the title, preconditions, ordered steps, expected
results, and metadata used by every case when it is added to a run.

#### Scenario: Edit a source case after execution

- **WHEN** a source test case is edited after its run item was created
- **THEN** the run continues to display the snapshot that was selected for that run

#### Scenario: Delete a source case after execution

- **WHEN** a source test case is deleted after a result exists
- **THEN** the historical run remains readable from its snapshot

### Requirement: Manual result recording

The system SHALL allow an active run item to be marked Untested, Passed, Failed,
Blocked, or Skipped with an optional actual result, comment, and duration.

#### Scenario: Record a passing result

- **WHEN** the user marks an active run item as Passed
- **THEN** the result, execution time, and run progress are updated

#### Scenario: Explain a failed result

- **WHEN** the user marks an active run item as Failed
- **THEN** the system allows the observed result and diagnostic comment to be stored with the failure

#### Scenario: Prevent editing a completed run

- **WHEN** the user attempts to change a result in a completed run
- **THEN** the system rejects the change and preserves the completed history

### Requirement: Guided run execution

The system SHALL provide a run view that shows the current case, its snapshot,
the run queue, and controls to move through remaining cases.

#### Scenario: Advance after recording a result

- **WHEN** the user saves a result and chooses to continue
- **THEN** the system opens the next untested case without losing the saved result

#### Scenario: Resume an active run

- **WHEN** the user reopens an active run with unfinished cases
- **THEN** the system highlights the first untested case and displays current progress

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
