## MODIFIED Requirements

### Requirement: Run creation from selected cases

The system SHALL allow the user to create a test run for a project from either
an ad hoc case selection or one reusable test plan, with optional milestone,
environment, and configuration context.

#### Scenario: Create an ad hoc run

- **WHEN** the user selects valid cases from the active project and confirms the run
- **THEN** the system creates one untested run item for each selected case without plan sections

#### Scenario: Create a run from a plan

- **WHEN** the user selects a valid non-empty plan from the active project
- **THEN** the system creates one untested run item for every current plan occurrence in section and item order

#### Scenario: Preserve repeated plan cases

- **WHEN** the selected plan contains the same source case more than once
- **THEN** the system creates independent run items with independent results for every occurrence

#### Scenario: Reject conflicting scope sources

- **WHEN** a run request provides both a test plan and an ad hoc case selection
- **THEN** the system rejects the request and creates no run

#### Scenario: Reject cross-project cases

- **WHEN** a run request contains a case, plan, milestone, environment, or configuration from another project
- **THEN** the system rejects the request and creates no run

#### Scenario: Reject an empty selection

- **WHEN** the user attempts to create a run without ad hoc cases or with a plan whose sections contain no cases
- **THEN** the system explains that at least one case must be selected

### Requirement: Guided run execution

The system SHALL provide a run view that shows the current case, its snapshot,
the sectioned run queue, dependency context, and controls to move through
available remaining items.

#### Scenario: Advance after recording a result

- **WHEN** the user saves a result and chooses to continue
- **THEN** the system opens the next untested item whose dependency has been executed without losing the saved result

#### Scenario: Wait for an untested dependency

- **WHEN** the user attempts to record a result for an item whose dependency remains Untested
- **THEN** the system preserves the item as Untested and identifies the pending prerequisite

#### Scenario: Continue after a non-passing dependency

- **WHEN** a dependency is Failed, Blocked, or Skipped
- **THEN** the dependent item becomes available and displays the prerequisite result as context

#### Scenario: Resume an active composite run

- **WHEN** the user reopens an active run with unfinished sectioned items
- **THEN** the system highlights the first untested available item and displays current progress

### Requirement: Point-in-time planning context snapshot

The system SHALL preserve the selected plan, plan sections, item dependencies,
transition instructions, milestone, environment, and configuration labels used
when a run is created.

#### Scenario: Edit planning records after run creation

- **WHEN** a linked plan, plan section, plan item, milestone, environment, group, or option is changed after the run is created
- **THEN** the run continues to display the structure and labels captured at creation time

#### Scenario: Delete planning records after run creation

- **WHEN** a linked planning or context record is deleted after the run is created
- **THEN** the run remains readable and retains its captured structure and context

#### Scenario: Read a legacy run

- **WHEN** a run created before composite plan support is opened
- **THEN** the system displays the run normally without section or dependency context
