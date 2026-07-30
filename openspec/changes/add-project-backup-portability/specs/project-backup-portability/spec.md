## ADDED Requirements

### Requirement: Complete project export
The system SHALL allow an authenticated user to export one project with all
project-owned content, relations, snapshots, results, activities, and historical
timestamps represented in a portable backup.

#### Scenario: Export a populated project
- **WHEN** a user exports a project containing repository, planning, execution, validation, configuration, milestone, environment, and AD/MF data
- **THEN** the downloaded backup contains every project-owned record and the relationships between them

#### Scenario: Export an empty project
- **WHEN** a user exports a project that has no child records
- **THEN** the system downloads a valid backup containing the project metadata and zero counts for every supported collection

#### Scenario: Preserve execution history
- **WHEN** the project contains completed runs with snapshots, results, evidence text, defect links, executors, durations, and execution dates
- **THEN** the backup preserves those historical values without replacing them with current test case values

#### Scenario: Consistent concurrent export
- **WHEN** an export is generated while another session edits the project
- **THEN** the backup represents one internally consistent database snapshot with valid counts and references

### Requirement: Project backup scope isolation
The system SHALL include only data owned by the selected project and SHALL
exclude user-private, authentication, third-party-access, Telegram, and global
notification data.

#### Scenario: Exclude global and private data
- **WHEN** a project is exported from an instance containing users, sessions, quick notes, third parties, and notification settings
- **THEN** none of those global or private records, credentials, tokens, or settings appears in the backup

#### Scenario: Exclude another project
- **WHEN** the instance contains multiple projects
- **THEN** the exported backup contains no record owned exclusively by a different project

### Requirement: Versioned and verifiable backup format
The system SHALL produce a UTF-8 `.qabase` document with a recognized format
identifier, integer contract version, export manifest, entity counts, and a
SHA-256 checksum of the canonical payload.

#### Scenario: Download metadata
- **WHEN** the export succeeds
- **THEN** the response downloads a `.qabase` file whose safe name identifies the project and export timestamp

#### Scenario: Verify an unchanged backup
- **WHEN** a generated backup is submitted for preview without modification
- **THEN** the system verifies its checksum and reports the manifest as valid

#### Scenario: Detect corruption
- **WHEN** any payload value is truncated or changed without a matching checksum
- **THEN** the system rejects the file before any database write and identifies an integrity failure

### Requirement: Import preview without side effects
The system SHALL validate a selected backup completely and present its source,
export date, version, size, checksum, supported entity counts, warnings, and
suggested restored project name before enabling restoration.

#### Scenario: Preview a valid backup
- **WHEN** a user selects a supported and valid `.qabase` file
- **THEN** the system displays an import summary and enables confirmation without creating or changing a project

#### Scenario: Preview malformed JSON
- **WHEN** the selected file is not valid JSON
- **THEN** the system rejects it with an actionable invalid-file message and performs no write

#### Scenario: Preview an unsupported newer version
- **WHEN** the backup contract version is newer than the versions supported by the running QaBase
- **THEN** the system rejects it and instructs the user to update QaBase

#### Scenario: Preview invalid references
- **WHEN** the checksum is valid but an entity references a missing, duplicate, cross-project, cyclic, or wrong-type reference
- **THEN** the system rejects the backup as structurally invalid and performs no write

#### Scenario: Preview an oversized file
- **WHEN** the selected backup exceeds the configured import limit
- **THEN** the system rejects it before parsing and states the accepted limit

### Requirement: Non-destructive project restoration
The system SHALL restore a valid backup only as a new project with a user-visible
name and SHALL NOT merge into, replace, or delete any existing project.

#### Scenario: Confirm restoration
- **WHEN** the user reviews a valid preview, confirms the suggested or edited name, and starts restoration
- **THEN** the system creates a new project and leaves the source and every other existing project unchanged

#### Scenario: Cancel restoration
- **WHEN** the user closes or cancels the preview
- **THEN** no project or child record is created

#### Scenario: Import the same backup twice
- **WHEN** the user independently confirms the same valid backup more than once
- **THEN** each operation creates a distinct project with non-conflicting local ids and a distinguishable name

#### Scenario: Invalid restored name
- **WHEN** the restored project name violates the project naming rules
- **THEN** the system blocks confirmation and preserves all existing data

### Requirement: Atomic relation reconstruction
The system SHALL assign new local ids, remap every portable reference, preserve
all valid relationships and dates, and commit the restored graph atomically.

#### Scenario: Restore cross-linked history
- **WHEN** a valid backup contains plans and runs linked to cases, configurations, milestones, validations, and related AD/MF records
- **THEN** every restored relationship points to the corresponding newly created record in the new project

#### Scenario: Restore hierarchical and self-referential data
- **WHEN** a valid backup contains nested suites or folders and item, run-case, or AD/MF dependencies
- **THEN** their hierarchy, ordering, and dependency direction are preserved with new ids

#### Scenario: Roll back a failed import
- **WHEN** any database operation fails during restoration
- **THEN** the transaction rolls back the new project and every record created by that attempt

### Requirement: Backup operations in project management
The system SHALL expose import and export actions in the Projects workspace using
the established QaBase controls, confirmation patterns, loading states, and
feedback components.

#### Scenario: Export from a project row
- **WHEN** the user activates the export action for a project
- **THEN** the action identifies that project, prevents duplicate activation while processing, and downloads its backup

#### Scenario: Import from the projects command bar
- **WHEN** the user activates Import backup and chooses a file
- **THEN** the system validates the file and opens the dedicated preview dialog

#### Scenario: Prevent duplicate import submission
- **WHEN** restoration is already running
- **THEN** the confirmation action remains unavailable until the operation succeeds or fails

#### Scenario: Complete a successful import
- **WHEN** restoration commits successfully
- **THEN** the Projects workspace refreshes, reports success, and opens the newly restored project

#### Scenario: Recover from an import error
- **WHEN** preview or restoration fails
- **THEN** the interface remains usable and explains whether the failure concerns format, version, integrity, structure, size, or server processing

### Requirement: Backup compatibility regression coverage
The system SHALL maintain fixtures and automated verification for every supported
backup contract version.

#### Scenario: Round-trip representative project
- **WHEN** a representative project is exported, restored, and exported again
- **THEN** both normalized functional payloads are equivalent after excluding regenerated references, restored project name, and export metadata

#### Scenario: Keep version one readable
- **WHEN** the application evolves without intentionally removing version-one support
- **THEN** the fixed version-one backup fixture continues to preview and restore successfully

#### Scenario: Add a project-owned entity
- **WHEN** a future schema change adds a new entity or relation owned by Project
- **THEN** compatibility verification fails until the backup contract explicitly includes or excludes that data
