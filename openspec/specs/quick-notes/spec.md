# Quick Notes

## Purpose

Define local, project-independent working-memory notes with immutable daily
organization, fast retrieval, lightweight personalization, and explicit editing.

## Requirements

### Requirement: User can capture a quick note
The system SHALL create a global quick note with optional title, required text,
default palette color, unpinned state, immutable local creation day, creation
time, and update time.

#### Scenario: Create from the quick composer
- **WHEN** the user enters note text and saves the composer
- **THEN** the system creates the note in today's date folder and refreshes the workspace

#### Scenario: Reject empty note
- **WHEN** the user attempts to save without note text
- **THEN** the system rejects the note and preserves the composer input

### Requirement: Notes are organized by immutable creation day
The system SHALL expose virtual date folders with note counts derived from each
note's immutable `createdDay`.

#### Scenario: Browse a populated day
- **WHEN** the user selects a date folder
- **THEN** the system displays only notes created on that civil day

#### Scenario: Edit an older note
- **WHEN** the user edits a note created on an earlier day
- **THEN** the note remains in its original date folder and shows its new update time

### Requirement: User can retrieve notes quickly
The system SHALL support text search across titles and bodies, an all-notes
scope, a today scope, recent populated date folders, and pinned-first ordering.

#### Scenario: Search across dates
- **WHEN** the user enters a search term
- **THEN** matching notes from every date are returned regardless of the selected folder

#### Scenario: Order a date folder
- **WHEN** a folder contains pinned and regular notes
- **THEN** pinned notes appear first and each group is ordered by latest update

#### Scenario: Empty folder
- **WHEN** the selected scope has no notes
- **THEN** the system shows an actionable empty state without creating a physical folder

### Requirement: User can personalize and prioritize notes
The system SHALL allow each note to use one of the supported palette keys and to
be pinned or unpinned.

#### Scenario: Change note color
- **WHEN** the user selects a supported color and saves
- **THEN** the note uses that palette key in both light and dark themes

#### Scenario: Pin a note
- **WHEN** the user pins a note
- **THEN** the note moves to the pinned group without changing its creation day

#### Scenario: Reject unsupported color
- **WHEN** an API client submits an unsupported palette key
- **THEN** the system rejects the request without modifying the note

### Requirement: User can edit and delete notes
The system SHALL allow full note editing without changing identity or creation
day and SHALL provide explicit deletion.

#### Scenario: Edit note content
- **WHEN** the user saves updated title, text, or color
- **THEN** the system updates the note and its update time while preserving creation metadata

#### Scenario: Open another note after editing
- **WHEN** the user opens a different note after viewing or editing the current note
- **THEN** the editor initializes from the newly selected note without inheriting title, text, color, or pin state

#### Scenario: Delete after confirmation
- **WHEN** the user confirms deletion
- **THEN** the system removes the note and updates date counts

#### Scenario: Missing note
- **WHEN** the user requests an unknown note id
- **THEN** the system returns a not-found response

### Requirement: Quick notes remain global and local
The system SHALL store quick notes independently of projects and SHALL require no
external service.

#### Scenario: Navigate without a project
- **WHEN** no project is selected and the user opens quick notes
- **THEN** the workspace loads normally without selecting or modifying a project

#### Scenario: Offline local operation
- **WHEN** the local frontend, API, and SQLite database are available without internet
- **THEN** all quick-note create, read, update, pin, color, search, and delete operations remain available
