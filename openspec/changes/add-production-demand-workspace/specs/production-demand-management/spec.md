## ADDED Requirements

### Requirement: Project-scoped production demand records

The system SHALL manage AD and MF production demands inside exactly one project
with a type-specific code, source context, title, description, support contact,
QA owner, registration date, state, and optional source URL.

#### Scenario: Create an MF

- **WHEN** the user creates an MF with valid required fields in a project
- **THEN** the system stores it in that project with `Open` state and returns its calculated deadline

#### Scenario: Create an AD

- **WHEN** the user creates an AD with valid required fields in a project
- **THEN** the system stores it in that project with `Open` state and its AD impact fields

#### Scenario: Reject a duplicate code

- **WHEN** the user creates another demand with the same normalized code, type, and project
- **THEN** the system rejects the request with a clear validation error

#### Scenario: Keep projects isolated

- **WHEN** a demand request references a project or related record from another project
- **THEN** the system rejects the request without persisting partial data

#### Scenario: Preserve the demand type

- **WHEN** the user attempts to change an existing demand from MF to AD or from AD to MF
- **THEN** the system rejects the type change and preserves the existing record

### Requirement: MF deadline and workaround lifecycle

The system SHALL calculate an MF deadline as 20 calendar days after formal
registration by level-two support and SHALL close the MF only after a workaround
delivery is recorded.

#### Scenario: Calculate the MF deadline

- **WHEN** an MF is registered on a calendar date
- **THEN** its deadline is the date 20 calendar days later without excluding weekends or holidays

#### Scenario: Recalculate an active MF

- **WHEN** the registration date of an active MF is corrected
- **THEN** the deadline is recalculated and the change is recorded in its timeline

#### Scenario: Reject incomplete MF closure

- **WHEN** the user attempts to close an MF without workaround summary and delivery date
- **THEN** the system rejects the closure and keeps the MF active

#### Scenario: Close an MF with a workaround

- **WHEN** the user records the workaround summary and delivery date and confirms closure
- **THEN** the system changes the MF to `Closed` and records the closure in its timeline

### Requirement: AD impact and production lifecycle

The system SHALL require AD criticality and affected-user count, SHALL allow an
optional target date, and SHALL close the AD only after the corrective software
version reaches production.

#### Scenario: Register AD impact

- **WHEN** the user creates an AD
- **THEN** the user selects Low, Medium, or High criticality and provides a positive affected-user count

#### Scenario: Register an AD without a target date

- **WHEN** an AD has no defined target date
- **THEN** the system accepts it and presents its deadline as `Sem data`

#### Scenario: Reject incomplete AD closure

- **WHEN** the user attempts to close an AD without resolution summary and production release date
- **THEN** the system rejects the closure and keeps the AD active

#### Scenario: Close an AD after production release

- **WHEN** the user records the resolution summary and date the corrective version reached production
- **THEN** the system changes the AD to `Closed` and records the closure details

### Requirement: Operational state and deadline context

The system SHALL support `Open`, `InProgress`, `Waiting`, and `Closed` states
and SHALL derive readable deadline context for every demand.

#### Scenario: Display an overdue demand

- **WHEN** an active demand has a deadline before the current local date
- **THEN** the system identifies it as `Overdue` and exposes the number of elapsed calendar days

#### Scenario: Display a demand due today

- **WHEN** an active demand deadline equals the current local date
- **THEN** the system identifies it as `DueToday`

#### Scenario: Display a closed demand

- **WHEN** a demand is closed
- **THEN** the system identifies its deadline state as `Closed` without continuing to count overdue days

#### Scenario: Move between active states

- **WHEN** the user changes an active demand between `Open`, `InProgress`, and `Waiting`
- **THEN** the system persists the state and records the transition in the timeline

### Requirement: Demand closure and reopening

The system SHALL use explicit close and reopen operations so that type-specific
rules and history are preserved.

#### Scenario: Reopen a closed demand

- **WHEN** the user provides a reason to reopen a closed demand
- **THEN** the system returns it to `InProgress`, preserves prior closure data, and records a reopen activity

#### Scenario: Reject reopening an active demand

- **WHEN** the user attempts to reopen a demand that is not closed
- **THEN** the system rejects the operation without adding a timeline entry

#### Scenario: Prevent editing a closed demand

- **WHEN** the user attempts to change operational fields of a closed demand
- **THEN** the system keeps the demand unchanged until it is explicitly reopened

### Requirement: Links to quality work

The system SHALL optionally link a demand to a validation brief, run, milestone,
and, for MF only, one AD in the same project.

#### Scenario: Link an MF to its definitive AD

- **WHEN** the user selects an AD from the same project for an MF
- **THEN** the MF shows the linked AD and the AD detail shows the related MF

#### Scenario: Reject an invalid AD link

- **WHEN** a link target is an MF or belongs to another project
- **THEN** the system rejects the link and preserves the previous value

#### Scenario: Link test context

- **WHEN** the user selects a validation brief, run, or milestone from the same project
- **THEN** the demand detail exposes those links as navigable context

#### Scenario: Delete a linked source

- **WHEN** a linked validation brief, run, milestone, or AD is deleted
- **THEN** the live relation becomes empty while the timeline retains a textual record of the former link

### Requirement: Append-only demand timeline

The system SHALL maintain a chronological timeline of creation, state changes,
notes, links, closure, and reopening for every demand.

#### Scenario: Create the initial activity

- **WHEN** a demand is created
- **THEN** the timeline contains a creation activity with its initial type, code, and state

#### Scenario: Add a note

- **WHEN** the user submits a nonempty note with an optional author name
- **THEN** the note is appended with its timestamp and earlier activities remain unchanged

#### Scenario: Reject an empty note

- **WHEN** the user submits a blank note
- **THEN** the system rejects it without changing the timeline

#### Scenario: Read a demand after source changes

- **WHEN** linked records are renamed or removed
- **THEN** existing timeline messages remain readable and chronologically ordered

### Requirement: Demand collection and operational summary

The system SHALL provide a project collection with combined filters and summary
counts suitable for recurring queue management.

#### Scenario: Combine filters

- **WHEN** the user combines text, type, state, criticality, QA owner, and deadline-state filters
- **THEN** the system returns only demands that satisfy all active filters

#### Scenario: Summarize the active queue

- **WHEN** the production demand workspace loads
- **THEN** the system returns counts for active, overdue, no-date, and high-criticality AD demands in the project

#### Scenario: Show an empty queue

- **WHEN** a project has no production demands
- **THEN** the system returns zero summary counts and an empty collection without errors

#### Scenario: Order the queue

- **WHEN** the user loads the default collection
- **THEN** active overdue and dated demands appear before no-date and closed demands with stable tie-breaking

### Requirement: Safe demand deletion

The system SHALL allow correction of mistakenly created active demands while
protecting closed historical records.

#### Scenario: Delete an active demand

- **WHEN** the user confirms deletion of an active demand
- **THEN** the system deletes the demand and its activities without affecting linked quality records

#### Scenario: Reject deletion of a closed demand

- **WHEN** the user attempts to delete a closed demand
- **THEN** the system requires it to be reopened first and preserves its history
