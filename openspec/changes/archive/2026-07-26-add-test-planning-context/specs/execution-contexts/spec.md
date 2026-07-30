## ADDED Requirements

### Requirement: Reusable project environments

The system SHALL allow the user to create, view, edit, and delete project
environments with a unique name, optional description, and optional target
identifier.

#### Scenario: Create an environment

- **WHEN** the user provides a unique environment name
- **THEN** the system saves the environment in the active project

#### Scenario: Reject a duplicate environment name

- **WHEN** the user submits an environment name already used in the same project regardless of letter casing
- **THEN** the system rejects the duplicate and preserves the existing environments

#### Scenario: Delete an environment used by runs

- **WHEN** the user deletes an environment that has run history
- **THEN** the environment is removed while each run retains its environment snapshot

### Requirement: Configuration groups and options

The system SHALL allow the user to maintain ordered project configuration
groups and reusable options inside each group.

#### Scenario: Create configuration dimensions

- **WHEN** the user creates a Browser group with Chrome and Firefox options
- **THEN** the group and options become available to future runs in the project

#### Scenario: Reject a duplicate option

- **WHEN** the user adds an option name already used in the same group regardless of letter casing
- **THEN** the system rejects the duplicate without changing the group

#### Scenario: Remove a configuration option used by runs

- **WHEN** the user deletes an option that has run history
- **THEN** the option is removed while historical runs retain the group and option snapshots

### Requirement: Valid run configuration selection

The system SHALL allow a run to select at most one option from each
configuration group belonging to its project.

#### Scenario: Select options from different groups

- **WHEN** the user selects Chrome from Browser and Windows from Operating System
- **THEN** the system accepts both options for the new run

#### Scenario: Reject multiple options from one group

- **WHEN** a run request selects Chrome and Firefox from the Browser group
- **THEN** the system rejects the request and creates no run

#### Scenario: Reject a cross-project context

- **WHEN** a run request references an environment or option from another project
- **THEN** the system rejects the request and creates no run
