## ADDED Requirements

### Requirement: Notes belong exclusively to their authenticated owner
The system SHALL assign each note to the authenticated user and SHALL apply that
owner to every note query and mutation.

#### Scenario: Two users create notes
- **WHEN** two authenticated users each create a note
- **THEN** each user can retrieve only the note they created

#### Scenario: Request another user's note
- **WHEN** a user requests, updates, or deletes an id owned by another user
- **THEN** the system returns not found and does not reveal or mutate the note

### Requirement: Legacy notes are removed before ownership becomes required
The system SHALL remove notes created before user ownership exists rather than
assigning an unverifiable owner.

#### Scenario: Migrate a database with legacy notes
- **WHEN** the ownership migration runs
- **THEN** legacy notes are removed and every remaining note has an owner

## MODIFIED Requirements

### Requirement: User can capture a quick note
The system SHALL create a private quick note owned by the authenticated user
with optional title, required text, default palette color, unpinned state,
immutable local creation day, creation time, and update time.

#### Scenario: Create from the quick composer
- **WHEN** the authenticated user enters note text and saves the composer
- **THEN** the system creates the owned note in today's private date folder and refreshes the workspace

#### Scenario: Reject empty note
- **WHEN** the user attempts to save without note text
- **THEN** the system rejects the note and preserves the composer input

### Requirement: User can retrieve notes quickly
The system SHALL support text search across the authenticated user's titles and
bodies, an all-notes scope, a today scope, recent populated date folders, and
pinned-first ordering without including another user's notes or counts.

#### Scenario: Search across private dates
- **WHEN** the user enters a search term
- **THEN** matching owned notes from every date are returned regardless of the selected folder

#### Scenario: Order a private date folder
- **WHEN** an owned folder contains pinned and regular notes
- **THEN** pinned notes appear first and each group is ordered by latest update

#### Scenario: Empty private folder
- **WHEN** the selected scope has no notes owned by the user
- **THEN** the system shows an actionable empty state without exposing another user's count

### Requirement: User can edit and delete notes
The system SHALL allow full editing and explicit deletion only for notes owned by
the authenticated user, without changing identity, owner, or creation day.

#### Scenario: Edit owned note content
- **WHEN** the owner saves updated title, text, or color
- **THEN** the system updates the note and its update time while preserving ownership and creation metadata

#### Scenario: Open another owned note after editing
- **WHEN** the user opens a different owned note after viewing or editing the current note
- **THEN** the editor initializes from the newly selected note without inheriting title, text, color, or pin state

#### Scenario: Delete owned note after confirmation
- **WHEN** the owner confirms deletion
- **THEN** the system removes the note and updates only that owner's date counts

#### Scenario: Missing or inaccessible note
- **WHEN** the user requests an unknown or differently owned note id
- **THEN** the system returns a not-found response

### Requirement: Quick notes remain project-independent and local
The system SHALL store each user's quick notes independently of projects and
external services while requiring an authenticated local account.

#### Scenario: Navigate without a project
- **WHEN** no project is selected and an authenticated user opens quick notes
- **THEN** the private workspace loads without selecting or modifying a project

#### Scenario: Offline local operation
- **WHEN** the local frontend, API, and SQLite database are available without internet
- **THEN** all owned quick-note create, read, update, pin, color, search, and delete operations remain available
