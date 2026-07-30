## ADDED Requirements

### Requirement: Run creation from selected cases
The system SHALL allow the user to create a test run for a project by selecting
one or more of its test cases and providing a run name.

#### Scenario: Create a run
- **WHEN** the user selects valid cases from the active project and confirms the run
- **THEN** the system creates one untested run item for each selected case

#### Scenario: Reject cross-project cases
- **WHEN** a run request contains a case from another project
- **THEN** the system rejects the request and creates no run

#### Scenario: Reject an empty selection
- **WHEN** the user attempts to create a run without test cases
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
