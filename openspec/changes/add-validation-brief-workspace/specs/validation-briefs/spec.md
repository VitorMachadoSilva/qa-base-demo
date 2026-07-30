## ADDED Requirements

### Requirement: User-defined validation organization

The system SHALL organize validation briefs inside each project using optional
hierarchical folders whose names and structure are defined by the user.

#### Scenario: Create a nested folder

- **WHEN** the user creates a folder under another folder in the active project
- **THEN** the new folder appears in that project hierarchy and can receive validation briefs

#### Scenario: Reject a duplicate sibling folder

- **WHEN** the user creates or renames a folder to a case-insensitive name already used under the same parent
- **THEN** the system rejects the operation with a clear message

#### Scenario: Remove a folder that contains briefs

- **WHEN** the user deletes a validation folder
- **THEN** its affected briefs remain in the project and become available under the unfiled location

#### Scenario: Keep projects isolated

- **WHEN** a folder or brief belongs to another project
- **THEN** the active project cannot use it as a parent, destination, source, or promotion target

### Requirement: Validation brief planning

The system SHALL allow a user to create and maintain a validation brief with a
title, objective, scope, general notes, lifecycle state, optional folder, and
optional HTTP or HTTPS source-card URL.

#### Scenario: Create a brief from a Jira card

- **WHEN** the user provides a title, planning content, and a valid Jira card URL
- **THEN** the system saves the brief locally and exposes the URL as an external reference without synchronizing data

#### Scenario: Create a manual brief without a card

- **WHEN** the user omits the source URL
- **THEN** the brief is created and remains fully usable

#### Scenario: Reject an unsupported source value

- **WHEN** the user provides a malformed URL or a protocol other than HTTP or HTTPS
- **THEN** the system rejects the brief with a clear validation message

#### Scenario: Move through the brief lifecycle

- **WHEN** the user changes a brief between Draft, In Progress, Blocked, and Completed
- **THEN** the selected state is persisted and completion time reflects whether the brief is completed

### Requirement: Criteria and requirements checklist

The system SHALL let a user maintain an ordered checklist of acceptance
criteria or requirements for each validation brief.

#### Scenario: Add and satisfy a criterion

- **WHEN** the user adds a criterion and later marks it as met
- **THEN** its text, position, and completion state remain associated with the brief

#### Scenario: Reorder or remove a criterion

- **WHEN** the user changes criterion order or removes an obsolete criterion
- **THEN** the remaining criteria use a stable contiguous order without affecting validation checks

### Requirement: Executable validation checklist

The system SHALL let a user maintain ordered validation checks with title,
expected result, observed result, notes, and a semantic execution status.

#### Scenario: Record a check result

- **WHEN** the user records Passed, Failed, Blocked, Skipped, or Untested for a check
- **THEN** the status and optional observed result and notes are persisted without navigating away from the brief

#### Scenario: Summarize validation progress

- **WHEN** a brief contains validation checks
- **THEN** the system displays total, executed, passed, failed, blocked, skipped, untested, and completion percentage derived from those checks

#### Scenario: Open a brief without checks

- **WHEN** the selected brief has no validation checks
- **THEN** the workspace presents one concise empty state and an action to add the first check

### Requirement: Chronological validation notes

The system SHALL maintain chronological notes on a brief with a type of Note,
Question, Risk, or Evidence.

#### Scenario: Capture a finding during validation

- **WHEN** the user records a typed note while testing
- **THEN** the note appears with its type and creation time without changing checklist results

#### Scenario: Remove an obsolete note

- **WHEN** the user deletes a note
- **THEN** only that note is removed and the remaining validation content is preserved

### Requirement: Promote a validation check

The system SHALL allow a validation check to create and link a reusable test
case in a selected suite from the same project.

#### Scenario: Promote an unlinked check

- **WHEN** the user selects a valid suite and confirms a case title and expected result
- **THEN** the system creates a structured test case, links it to the check, and preserves the original check content

#### Scenario: Prevent duplicate promotion

- **WHEN** a check already has a linked test case
- **THEN** the system does not create another case from the same promotion action

#### Scenario: Delete a promoted case later

- **WHEN** the linked repository case is deleted
- **THEN** the validation check remains readable with its original title, expected result, execution status, and observations
