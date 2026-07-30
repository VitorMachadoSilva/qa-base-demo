## ADDED Requirements

### Requirement: Sectioned composite plan structure

The system SHALL organize every test plan into one or more ordered sections
whose items may include transition instructions and one dependency on an
earlier item from the same plan.

#### Scenario: Create an empty draft plan

- **WHEN** the user creates a plan without selected cases
- **THEN** the system saves the plan with one empty default section

#### Scenario: Build a multi-section scenario

- **WHEN** the user creates ordered sections and adds cases to each section
- **THEN** the plan preserves section order and item order inside every section

#### Scenario: Repeat a case in one plan

- **WHEN** the user adds the same repository case at more than one position
- **THEN** the plan preserves every occurrence as an independent plan item

#### Scenario: Add a valid dependency

- **WHEN** an item references one earlier item from the same plan
- **THEN** the dependency and optional transition instructions are persisted

#### Scenario: Reject an invalid dependency

- **WHEN** an item depends on itself, a later item, or an item from another plan
- **THEN** the system rejects the plan update without changing its previous structure

#### Scenario: Remove a non-empty section

- **WHEN** the user attempts to remove a section that still contains items
- **THEN** the system requires those items to be moved or explicitly removed before saving

## MODIFIED Requirements

### Requirement: Ordered plan scope

The system SHALL allow the user to add, repeat, remove, search, filter, and
reorder current project test cases across ordered plan sections.

#### Scenario: Add cases to a section

- **WHEN** the user selects valid cases from the active project
- **THEN** the selected occurrences are added to the chosen section in the chosen order

#### Scenario: Search cases by component

- **WHEN** the user filters the plan case catalog by a project component
- **THEN** the catalog displays matching cases from every suite

#### Scenario: Move an item between sections

- **WHEN** the user moves a plan item to another section
- **THEN** the item receives a valid position in the destination section and remaining positions stay contiguous

#### Scenario: Reject a cross-project plan item

- **WHEN** a plan update contains a case from another project
- **THEN** the system rejects the update without changing the plan

#### Scenario: Source case is deleted

- **WHEN** a test case included one or more times in plans is deleted
- **THEN** every current occurrence of that case is removed without changing historical runs

### Requirement: Run creation from a test plan

The system SHALL allow a non-empty sectioned plan to create a run containing
all of its current item occurrences without changing the reusable plan.

#### Scenario: Start a run from a composite plan

- **WHEN** the user starts a run from a plan with valid current items
- **THEN** the system creates one run item for every ordered occurrence and captures its sections, dependencies, and transition instructions

#### Scenario: Start a run with repeated cases

- **WHEN** one source case appears at multiple plan positions
- **THEN** the run contains one independently executable item for every occurrence

#### Scenario: Reject an empty plan run

- **WHEN** the user attempts to start a run from a plan whose sections contain no cases
- **THEN** the system explains that the plan needs at least one case
