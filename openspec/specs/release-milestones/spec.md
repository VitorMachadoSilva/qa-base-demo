# Release Milestones

## Purpose

Define project milestones that represent versions, sprints, or deliveries and
provide lifecycle and run-progress traceability.

## Requirements

### Requirement: Project milestone management

The system SHALL allow the user to create, view, edit, and delete project
milestones with a name, optional description, optional date range, and lifecycle
status.

#### Scenario: Create a milestone

- **WHEN** the user provides a unique name and a valid optional date range
- **THEN** the system saves the milestone in the active project

#### Scenario: Reject an invalid date range

- **WHEN** a milestone due date is earlier than its start date
- **THEN** the system rejects the change and identifies the invalid range

#### Scenario: Reject a duplicate milestone name

- **WHEN** the user submits a milestone name already used in the same project regardless of letter casing
- **THEN** the system rejects the duplicate and preserves the existing milestones

### Requirement: Milestone lifecycle

The system SHALL support Upcoming, Active, and Completed milestone states and
record when a milestone is completed.

#### Scenario: Complete a milestone

- **WHEN** the user marks an active or upcoming milestone as Completed
- **THEN** the system records its completion time and retains linked run history

#### Scenario: Exclude completed milestone from new runs

- **WHEN** the user opens the run creation flow
- **THEN** completed milestones are not available for selection

### Requirement: Milestone run traceability

The system SHALL allow an active or upcoming milestone to be associated with
multiple runs and SHALL summarize their current progress.

#### Scenario: Inspect milestone progress

- **WHEN** the user opens a milestone with linked runs
- **THEN** the system displays run counts and aggregated result progress

#### Scenario: Delete a milestone with linked runs

- **WHEN** the user deletes a milestone that has run history
- **THEN** the milestone is removed while each run retains its milestone snapshot
