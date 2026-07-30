# Notification Center

## Purpose

Define the secure Telegram channel, civil schedules, operational report
eligibility, persistent delivery queue, retries, history, and resend behavior
for global QaBase notifications.

## Requirements

### Requirement: Telegram credentials remain secret
The system SHALL read the Telegram bot token only from the backend environment
and SHALL never persist, log, return, or render the token.

#### Scenario: Token is configured
- **WHEN** the backend starts with a valid `TELEGRAM_BOT_TOKEN`
- **THEN** the settings API reports that a token is configured and exposes only safe bot identity metadata

#### Scenario: Token is absent
- **WHEN** the backend starts without `TELEGRAM_BOT_TOKEN`
- **THEN** notifications remain disabled and the interface explains the required local configuration without exposing an input for the token

#### Scenario: Token is invalid
- **WHEN** the configured token fails Telegram authentication
- **THEN** the system reports a safe configuration error without recording the token or token-bearing request URL

### Requirement: User can connect one fixed Telegram group
The system SHALL discover recent explicit connection commands, require group
confirmation, and persist exactly one selected group or supergroup.

#### Scenario: Discover intended group
- **WHEN** the user sends `/connect@<bot_username>` in a group and starts discovery
- **THEN** the system returns recent matching group candidates with safe identity and time metadata

#### Scenario: Confirm group
- **WHEN** the user confirms one discovered group that the bot can access
- **THEN** the system stores its chat id, title, type, bot identity, and verification time as the fixed destination

#### Scenario: Reject private chat
- **WHEN** discovery receives a matching command from a private chat
- **THEN** the system excludes it from selectable group candidates

#### Scenario: Replace connected group
- **WHEN** the user explicitly reconnects and confirms another group
- **THEN** future deliveries use the new group while historical deliveries preserve their original channel snapshot

### Requirement: User can test the Telegram channel
The system SHALL send a real test message to the confirmed group and record the
complete outcome as a test delivery.

#### Scenario: Successful test
- **WHEN** the user activates channel testing with a valid token and confirmed group
- **THEN** Telegram receives a QaBase test message and history records a successful `Test` delivery

#### Scenario: Failed test
- **WHEN** Telegram rejects or cannot receive the test message
- **THEN** history records the failed delivery, attempts, and a safe actionable error

#### Scenario: Test without readiness
- **WHEN** the user requests a test without a valid token or confirmed group
- **THEN** the system rejects the request before creating an outbound attempt

### Requirement: User can configure notification schedules
The system SHALL provide one global configuration for enablement, IANA timezone,
send time, AD/MF cadence in calendar days, and unique third-party lead days.

#### Scenario: Load defaults
- **WHEN** notification settings are initialized
- **THEN** timezone is `America/Sao_Paulo`, send time is `09:00`, AD/MF cadence is two days, lead days are seven and two, and automatic delivery is disabled

#### Scenario: Save valid schedule
- **WHEN** the user saves valid schedule values
- **THEN** the system persists them and recalculates future civil run days without changing delivery history

#### Scenario: Reject invalid schedule
- **WHEN** the user submits an invalid timezone, time, cadence, duplicate lead day, nonpositive lead day, or empty lead-day list
- **THEN** the system rejects the complete update without partially changing settings

#### Scenario: Enable without channel
- **WHEN** the user enables automatic notifications without a valid token and confirmed group
- **THEN** the system rejects enablement and identifies the missing channel requirement

### Requirement: Active AD and MF demands produce consolidated reports
The system SHALL create one consolidated report of active production demands on
each due AD/MF schedule.

#### Scenario: Report active demands
- **WHEN** an AD/MF schedule is due and active demands exist
- **THEN** the report includes every active AD and MF with project, code, type, deadline state, QA owner, support contact, and applicable impact metadata

#### Scenario: Exclude closed demand
- **WHEN** a production demand is closed before report generation
- **THEN** that demand is absent from the generated report

#### Scenario: Include AD without date
- **WHEN** an active AD has no due date
- **THEN** the report places it in a visible undated section with its criticality and affected quantity

#### Scenario: No active demands
- **WHEN** an AD/MF schedule is due and no active demands exist
- **THEN** the system records a `NoData` delivery and sends no Telegram message

### Requirement: Third-party deadlines produce consolidated alerts
The system SHALL create one consolidated access report on each due daily
schedule containing current access cycles at a configured threshold, expiring
today, or already expired.

#### Scenario: Reach configured threshold
- **WHEN** an active access cycle is exactly a configured number of civil days from expiration
- **THEN** the next access report includes the third party, company, systems, internal owner, expiration date, and days remaining

#### Scenario: Expire today
- **WHEN** an active access cycle reaches its expiration civil day
- **THEN** the report includes it as expiring today regardless of configured lead days

#### Scenario: Remain expired
- **WHEN** a current access cycle is expired and has not been renewed or closed
- **THEN** every daily access report continues to include it as overdue

#### Scenario: Renew expired access
- **WHEN** an expired access is renewed before the next report
- **THEN** the old cycle stops producing overdue alerts and the new current cycle follows its own thresholds

#### Scenario: No eligible accesses
- **WHEN** the access schedule is due and no current cycle is eligible
- **THEN** the system records a `NoData` delivery and sends no Telegram message

### Requirement: Scheduler is persistent and deduplicated
The system SHALL evaluate schedules in the configured civil timezone, persist
planned days, and create at most one logical delivery per report type and
planned day.

#### Scenario: Reach planned time
- **WHEN** the backend is running at or after the configured time on a due civil day
- **THEN** the system creates one scheduled delivery and advances that report's next planned day

#### Scenario: Repeat scheduler tick
- **WHEN** the scheduler evaluates the same report type and planned day more than once
- **THEN** database deduplication preserves exactly one logical delivery

#### Scenario: Recover after downtime
- **WHEN** the backend starts after one or more planned executions were missed
- **THEN** the system creates only the latest catch-up delivery for each report type from current data and advances to a future planned day

#### Scenario: Retry does not shift cadence
- **WHEN** a delivery requires retries or ultimately fails
- **THEN** future scheduled days remain based on the planned cadence rather than the delivery completion time

### Requirement: Reports are safely partitioned and delivered
The system SHALL render escaped compact Telegram messages, partition large
reports on record boundaries, and track every part independently.

#### Scenario: Send one-part report
- **WHEN** a rendered report fits the safe message limit
- **THEN** the system sends one numbered-independent part and stores its Telegram message id

#### Scenario: Split large report
- **WHEN** a rendered report exceeds the safe message limit
- **THEN** the system creates ordered numbered parts below Telegram's limit without splitting an individual source record

#### Scenario: Complete multipart report
- **WHEN** every part is sent successfully
- **THEN** the logical delivery becomes `Sent`

#### Scenario: Partially fail multipart report
- **WHEN** some parts succeed and another part fails
- **THEN** successful parts remain sent and only the failed part remains eligible for retry

### Requirement: Failed parts use persisted retry policy
The system SHALL attempt immediate delivery and retry failed parts after 1, 5,
and 15 minutes before marking the delivery failed.

#### Scenario: Recover on retry
- **WHEN** a failed part succeeds during an eligible retry
- **THEN** the system records both attempts and does not send that part again

#### Scenario: Exhaust retries
- **WHEN** the initial attempt and all three retries fail
- **THEN** the part and logical delivery become `Failed` with the final safe error visible in history

#### Scenario: Restart with pending retry
- **WHEN** the backend restarts after a retry was scheduled
- **THEN** the worker resumes the pending retry at or after its persisted due time

### Requirement: Delivery history is immutable and actionable
The system SHALL expose filterable logical delivery history with payload
snapshots, message parts, attempts, outcomes, and manual resend.

#### Scenario: Inspect delivery
- **WHEN** the user opens a delivery
- **THEN** the system shows type, trigger, planned day, source count, channel snapshot, rendered parts, attempts, safe errors, and timestamps

#### Scenario: Filter history
- **WHEN** the user filters by delivery type, status, trigger, or date
- **THEN** the system returns matching deliveries in newest-first order

#### Scenario: Manually resend
- **WHEN** the user resends a test, sent, or failed delivery
- **THEN** the system creates a new linked delivery from the original payload snapshot and preserves both histories

#### Scenario: Resend no-data delivery
- **WHEN** the user attempts to resend a delivery with no rendered payload
- **THEN** the system rejects the action without creating an empty Telegram message
