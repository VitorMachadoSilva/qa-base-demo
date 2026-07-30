## Context

QaBase runs as a local React, Express, Prisma, and SQLite application. Production
demands are project-owned, third-party access is global, and both already expose
derived deadline states. There is no background scheduler, delivery queue, or
secret-management interface today.

The team chose Telegram after rejecting the operational cost of maintaining
SMTP. One private group has already been created. The application will later run
continuously on a shared desktop server, but this change must remain useful and
testable on the current local machine.

Telegram creation and authorization require user actions outside QaBase.
BotFather issues a secret token; the bot must be added to the intended group;
and a group command must produce an update that QaBase can discover.

## Goals / Non-Goals

**Goals:**

- Connect one fixed Telegram group without exposing the bot token.
- Configure civil scheduling in the product timezone.
- Send consolidated active AD/MF reports and third-party access alerts.
- Recover the latest missed execution after backend downtime without flooding.
- Split reports safely, retry only pending parts, and avoid duplicate delivery.
- Preserve an inspectable history of logical deliveries, parts, attempts, errors,
  payload snapshots, tests, no-data runs, and manual resends.
- Keep the scheduler portable inside the existing backend process.
- Make user-owned Telegram actions explicit checkpoints in the implementation.

**Non-Goals:**

- Multiple Telegram groups, topics, channels, or direct messages.
- Reading ordinary group conversations or accepting operational bot commands.
- Webhooks, inbound automation, interactive keyboards, or Telegram Mini Apps.
- Email, SMS, desktop push, or other providers.
- Storing or editing the bot token in SQLite or the frontend.
- Per-user schedules, authentication, permissions, or multiuser ownership.
- Attachments, generated files, charts, or full report exports.

## Decisions

### One global settings record and normalized lead days

`NotificationSettings` is a singleton with enablement, timezone, send time,
AD/MF cadence, selected chat metadata, verified bot metadata, next civil run
days, and verification timestamps. `NotificationAccessLeadDay` stores unique
positive integer thresholds; defaults are seven and two.

Normalized rows are preferred over a comma-separated or JSON field because
validation, ordering, and future editing remain explicit in SQLite.

The initial values are:

- timezone `America/Sao_Paulo`;
- send time `09:00`;
- AD/MF cadence `2` calendar days;
- access lead days `[7, 2]`.

### The token is environment-only

`TELEGRAM_BOT_TOKEN` is read by the backend. API responses expose only
`configured`, bot username, validation state, and safe error summaries. The
token is never written to SQLite, logs, delivery history, URLs, or frontend
state.

The backend validates the token with `getMe`. Removing or rotating it is an
operational environment change followed by API restart and channel revalidation.

### Explicit group discovery and confirmation

The bot keeps Telegram Privacy Mode enabled. The user sends
`/connect@<bot_username>` in the intended group, then starts discovery in
QaBase. The backend calls `getUpdates`, keeps only recent matching group or
supergroup commands, and returns safe candidates. The user confirms one
candidate; QaBase verifies it with `getChat` and stores its chat id, title, type,
and bot identity.

Discovery is used only during connection. No long-polling listener or webhook
runs during normal notification delivery.

### Persistent civil scheduler inside the API process

A single scheduler service starts with Express and checks persisted work every
minute. It compares civil date and time through `Intl.DateTimeFormat` in the
configured IANA timezone.

Settings store the next civil run day for demand and access reports. Creating a
scheduled delivery advances the planned day independently of delivery success,
so retries do not shift future cadence.

On startup, if a planned day was missed and the configured time has passed, the
scheduler creates only one catch-up delivery per report type using current
eligible data, then advances to the next future day. It does not recreate every
historical missed slot.

### Database uniqueness is the deduplication boundary

Every scheduled delivery receives a deterministic key containing report type
and planned civil day. A unique SQLite index prevents duplicate creation across
timer ticks, restarts, or overlapping asynchronous checks.

The current architecture runs one API process. The unique key remains the final
guard if a future server accidentally starts a second worker.

### Delivery, part, and attempt are separate records

`NotificationDelivery` represents one logical report with type, trigger,
planned day, status, source count, channel snapshots, rendered payload snapshot,
optional original delivery, and timestamps.

`NotificationMessagePart` stores one numbered Telegram-safe body, position,
status, Telegram message id, and sent time. `NotificationAttempt` records each
HTTP attempt, outcome, safe Telegram error fields, status code, start, finish,
and next retry time.

Statuses distinguish `Pending`, `Processing`, `Sent`, `Failed`, `NoData`, and
`Cancelled`. A delivery is `Sent` only when every part is sent. No-data
deliveries create no Telegram parts.

### Compact HTML reports split on record boundaries

Messages use escaped Telegram HTML with compact textual sections rather than a
wide table. Each source record remains an indivisible render block. The renderer
targets a conservative 3,800-character ceiling so numbering and formatting stay
below Telegram's 4,096-character limit.

AD/MF reports contain only active records and are separated into urgent,
undated, and active sections. They include project, code, type, deadline state,
criticality and affected quantity where applicable, QA owner, and support
contact.

Access reports consolidate records whose current cycle:

- expires in a configured lead-day threshold;
- expires today; or
- is already expired.

Expired records remain eligible every civil day until renewal or closure.
Renewal automatically moves eligibility to the new current cycle.

### Initial send plus three persisted retries

Each part receives an immediate initial attempt. A failed part is retried after
1, 5, and 15 minutes. Successful parts are never sent again during those
retries. Restarting the API resumes pending retries from persisted
`nextAttemptAt`.

After the final retry, the part and logical delivery become `Failed`. Manual
resend creates a new linked delivery from the original payload snapshot; it does
not mutate history or silently regenerate current data.

### Settings workspace follows the global operational shell

`settings-notifications` is a global hash destination independent of projects.
The workspace uses four views:

- `Visão geral`: readiness, next schedules, latest delivery, and latest failure;
- `Telegram`: safe bot state, group discovery, confirmation, test, and reconnect;
- `Agendamentos`: timezone, time, cadence, lead-day list, and enablement;
- `Histórico`: filterable ledger with delivery detail and manual resend.

Delivery detail opens in the shared right-side inspector and closes on outside
click or Escape. Secret values never appear in the DOM.

## Risks / Trade-offs

- **The API process is offline** → persist next civil days and create one
  catch-up delivery on restart.
- **Telegram is unavailable or rate-limits requests** → persist part-level
  retries and expose the final error in history.
- **A report partially succeeds** → retry only failed parts and keep the logical
  delivery incomplete until all parts succeed.
- **The same schedule tick runs twice** → reject duplicate deterministic keys in
  SQLite.
- **A bot token leaks** → never persist or return it; document BotFather
  revocation and rotation.
- **The wrong group sends a connection command** → show candidates and require
  explicit confirmation before storing a group.
- **Privacy Mode blocks ordinary messages** → use an explicit command addressed
  to the bot; normal operation is outbound only.
- **Telegram formatting rejects content** → escape HTML, render through one
  formatter, and cover punctuation and long content in smoke tests.
- **A very large report creates many messages** → split at record boundaries,
  number parts, and make each part independently auditable.
- **Configuration changes near send time** → validate transactionally and
  recalculate future planned days without deleting delivery history.

## Migration Plan

1. Add the notification settings, lead day, delivery, part, and attempt tables
   with indexes and one default disabled settings row.
2. Extend idempotent setup and integrity checks.
3. Add the environment contract without adding a real token to the repository.
4. Add the Telegram client, renderer, scheduler, queue, and REST APIs.
5. Add the global workspace and navigation.
6. Ask the user to create the bot, add it to the existing group, and configure
   the local token.
7. Run discovery, group confirmation, and a real test delivery with the user.
8. Verify simulated scheduling, catch-up, retries, partial failure, history,
   large reports, and existing smoke suites.

Rollback removes the scheduler registration, routes, and workspace. The additive
tables can remain inert with notifications disabled. Removing
`TELEGRAM_BOT_TOKEN` immediately prevents external delivery.

## User Action Checkpoints

1. **Complete:** create the private Telegram group.
2. Create the bot with the official BotFather when implementation reaches
   channel setup.
3. Add the bot to the created group with permission to send messages.
4. Place the token in `backend/.env` locally without sharing it in chat or
   committing it.
5. Restart the backend when instructed.
6. Send `/connect@<bot_username>` in the group.
7. Confirm the detected group in QaBase.
8. Observe and approve the real test message.

## Open Questions

No blocking product or architecture questions remain.
