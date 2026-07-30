## MODIFIED Requirements

### Requirement: Consistent application shell

The system SHALL provide predictable global navigation, optional project
context, location, and primary actions across project and global operational
workspaces.

#### Scenario: Navigate on desktop

- **WHEN** the user moves between Overview, Repository, Planning, Runs or a
  global operational workspace on a desktop viewport
- **THEN** the global rail, applicable project context, current destination, and
  page location remain identifiable without reducing the work canvas
  unnecessarily

#### Scenario: Open a global operational destination

- **WHEN** the user opens Third-party access from the global rail
- **THEN** the workspace opens without requiring a project and project context
  navigation is not displayed

#### Scenario: Change project

- **WHEN** the user returns to project selection and opens another project
- **THEN** the shell updates the project context and preserves the same
  navigation model

#### Scenario: Locate the primary action

- **WHEN** a workspace has a primary creation or execution action
- **THEN** the action appears in a consistent command area and does not compete
  with another primary-styled command

#### Scenario: Reach global access management on mobile

- **WHEN** the viewport is 390 by 844 pixels
- **THEN** Third-party access remains reachable without relying on project
  navigation and its label or accessible name remains unambiguous

## ADDED Requirements

### Requirement: Third-party access workspace composition

The system SHALL present third-party accesses as a dense global operational
workspace with summary, combined filters, stable ledger and contextual
inspection.

#### Scenario: Scan access expirations

- **WHEN** active, expiring and expired access records are displayed
- **THEN** identity, company, systems, internal owner, expiration and textual
  state can be compared without opening every record

#### Scenario: Inspect renewal history

- **WHEN** the user opens a third party
- **THEN** current access, prior cycles, activity history and renewal or closure
  actions appear in a wide inspector without losing list context

#### Scenario: Use the workspace on mobile

- **WHEN** the viewport is 390 by 844 pixels
- **THEN** summary, filters, ledger and inspector remain operable without
  horizontal page overflow or overlapping actions
