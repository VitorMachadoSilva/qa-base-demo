## ADDED Requirements

### Requirement: Single-address LAN access
The system SHALL serve the QaBase interface and API from one configurable network
address and SHALL accept authenticated mutations originating from that same
address.

#### Scenario: Access from another device
- **WHEN** a device in the local network opens the configured server IP and port
- **THEN** the interface loads and its API requests use the same host without CORS or origin errors

#### Scenario: Reject a foreign mutation origin
- **WHEN** a mutation declares an origin different from the request host and every configured trusted origin
- **THEN** the server rejects it with HTTP 403

### Requirement: Reproducible Linux service
The system SHALL provide a reproducible Linux deployment that builds the frontend,
runs one backend instance, checks service health, and restarts after host or
process interruption.

#### Scenario: First startup
- **WHEN** an operator starts the documented Compose project on a supported Linux host
- **THEN** the database is prepared idempotently and the service becomes healthy

#### Scenario: Host restart
- **WHEN** the Linux host restarts after Docker is enabled
- **THEN** the QaBase service starts again without a manual development command

### Requirement: Persistent instance data
The system SHALL store the SQLite database outside the disposable container layer
and SHALL preserve it during image rebuilds and ordinary service replacement.

#### Scenario: Replace the application container
- **WHEN** the operator rebuilds or recreates the QaBase container without deleting volumes
- **THEN** users, projects, private notes, settings, and histories remain available

#### Scenario: Prevent accidental destructive guidance
- **WHEN** operational documentation describes stopping or updating the service
- **THEN** it distinguishes ordinary removal from volume-destructive commands

### Requirement: Small-team concurrent SQLite operation
The system SHALL configure SQLite with foreign-key enforcement, write-ahead
logging and bounded lock waiting while running exactly one application replica.

#### Scenario: Overlapping team activity
- **WHEN** a small number of authenticated users perform overlapping reads and writes
- **THEN** the database waits for transient write locks instead of failing immediately

### Requirement: Consistent operational backup
The system SHALL provide a command that creates a dated, consistent SQLite backup
while the service is running and stores it outside the database volume.

#### Scenario: Create a live backup
- **WHEN** an operator runs the documented backup command
- **THEN** a new standalone database copy is created with a timestamped name

#### Scenario: Retain recent backups
- **WHEN** backups are older than the configured retention period
- **THEN** the backup command removes only matching expired backup files from the backup directory

### Requirement: Graceful service lifecycle
The system SHALL stop accepting work and close the scheduler and database client
when Linux or the container requests shutdown.

#### Scenario: Planned restart
- **WHEN** the service receives SIGTERM during an update
- **THEN** it closes cleanly within the configured grace period before replacement
