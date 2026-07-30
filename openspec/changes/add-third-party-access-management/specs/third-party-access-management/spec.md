## ADDED Requirements

### Requirement: Global third-party registry

The system SHALL maintain third-party access records independently from
projects, with name, company, role, optional contact, internal owner, optional
notes, and a current access cycle.

#### Scenario: Create a third party

- **WHEN** the user provides the required identity fields, approval date, valid
  expiration and at least one supported system
- **THEN** the system creates the third party and initial access cycle in one
  operation

#### Scenario: Reject an incomplete record

- **WHEN** name, company, role, internal owner, approval date, expiration or all
  systems are missing
- **THEN** the system rejects the operation with a field-specific message and
  creates no partial record

#### Scenario: Prevent an active duplicate

- **WHEN** the user creates another non-archived third party with the same
  normalized name and company
- **THEN** the system rejects the duplicate without changing the existing
  history

### Requirement: Fixed access system set

The system MUST accept only Teams, GitLab, VPN, Jira and Confluence as access
systems and SHALL preserve the exact selected set in each cycle.

#### Scenario: Select supported systems

- **WHEN** the user selects one or more systems from the fixed list
- **THEN** the cycle stores each selected system once

#### Scenario: Reject an unsupported system

- **WHEN** a request contains a system outside the fixed list or repeats a
  system
- **THEN** the system rejects the request without creating or changing a cycle

### Requirement: Three-calendar-month access limit

The system SHALL calculate the maximum expiration as three calendar months from
the approval date and SHALL allow an expiration no earlier than approval and no
later than that maximum.

#### Scenario: Use the default expiration

- **WHEN** approval is recorded on 27 July 2026 and no shorter date is selected
- **THEN** the system sets expiration to 27 October 2026

#### Scenario: Clamp an end-of-month approval

- **WHEN** adding three months produces a day that does not exist in the target
  month
- **THEN** the system uses the last calendar day of the target month

#### Scenario: Reject a date beyond the limit

- **WHEN** the selected expiration is later than the calculated maximum
- **THEN** the system rejects the cycle and explains the three-month limit

### Requirement: Derived access state

The system SHALL derive the current cycle state from calendar dates and explicit
closure as Active, Expiring, Expired or Closed.

#### Scenario: Identify an upcoming expiration

- **WHEN** an open cycle expires within the next seven calendar days, including
  today
- **THEN** the system identifies it as Expiring and displays the remaining days
  in text

#### Scenario: Identify an expired access

- **WHEN** an open cycle expiration is before today
- **THEN** the system identifies it as Expired and displays the overdue days in
  text

#### Scenario: Identify an explicitly closed access

- **WHEN** a cycle has been closed before or after its expiration
- **THEN** the system identifies it as Closed regardless of its dates

### Requirement: Historical renewal

The system SHALL renew a third party by atomically closing the prior current
cycle and creating a new cycle with its own approval, expiration and system
selection.

#### Scenario: Renew current access

- **WHEN** the user confirms a valid new approval, expiration and system set
- **THEN** the previous cycle is marked as renewed, the new cycle becomes
  current and both remain readable in chronological history

#### Scenario: Renew an expired access

- **WHEN** the current cycle is already Expired and the user records a valid
  renewal
- **THEN** the system creates the new current cycle without erasing the expired
  period

#### Scenario: Reject a second current cycle

- **WHEN** an operation would create another current cycle without closing the
  existing current cycle
- **THEN** the system rejects the operation atomically

### Requirement: Explicit access closure

The system SHALL allow the current access cycle to be closed with a required
reason while preserving the third party and every prior cycle.

#### Scenario: Close current access

- **WHEN** the user provides a closure reason
- **THEN** the current cycle records closure time and reason and the third party
  remains available in history

#### Scenario: Reject repeated closure

- **WHEN** the current cycle is already closed
- **THEN** the system rejects another closure and leaves history unchanged

### Requirement: Operational access queue

The system SHALL provide deterministic global listing, summary and combined
filters for third-party access records.

#### Scenario: Scan the queue

- **WHEN** records exist in different states
- **THEN** Expired records appear first, followed by Expiring and Active records,
  with identity, company, systems, owner and expiration visible

#### Scenario: Combine filters

- **WHEN** the user combines search, state, system, company or internal-owner
  filters
- **THEN** the system returns only records matching every selected filter and
  preserves deterministic urgency ordering

#### Scenario: Summarize the registry

- **WHEN** the workspace loads
- **THEN** the system reports total current, active, expiring, expired and closed
  counts independently from the current list filters

#### Scenario: Open an empty registry

- **WHEN** no third party exists
- **THEN** the system returns zero summary counts and offers one action to
  register the first third party

### Requirement: Access activity history

The system SHALL maintain an ordered activity history for identity changes,
cycle creation, renewal, closure and user notes.

#### Scenario: Record a renewal

- **WHEN** a renewal succeeds
- **THEN** the history records the previous and new periods and readable system
  selections

#### Scenario: Add and remove a note

- **WHEN** the user adds a note with optional author
- **THEN** the note appears chronologically and can be removed without changing
  immutable system events

#### Scenario: Keep history after identity changes

- **WHEN** name, company, role, contact or internal owner changes
- **THEN** existing cycles remain unchanged and the update is recorded as an
  activity
