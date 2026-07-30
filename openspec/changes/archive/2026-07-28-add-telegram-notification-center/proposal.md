## Why

QaBase already centralizes production demands and temporary third-party access,
but deadlines still depend on people remembering to open the application. A
local notification center is needed before shared-server use so the team can
receive consistent operational reminders without maintaining SMTP infrastructure.

## What Changes

- Add a global `Configurações e notificações` destination.
- Connect one fixed Telegram group to one QaBase bot.
- Keep the bot token outside SQLite and the interface, loaded from the backend
  environment.
- Detect and persist the selected Telegram group after an explicit connection
  command.
- Send a real test message and record it in delivery history.
- Schedule consolidated reports for active AD/MF demands, initially every two
  calendar days.
- Allow report time, timezone, AD/MF cadence, and third-party lead days to be
  configured.
- Schedule consolidated third-party access alerts initially at seven and two
  days before expiration, on the expiration day, and every day after expiration
  until renewal or closure.
- Recover one missed scheduled execution after backend downtime.
- Record no-data executions without sending an empty Telegram message.
- Retry failed parts after 1, 5, and 15 minutes.
- Split oversized reports into numbered Telegram-safe parts and retry only
  pending parts.
- Preserve delivery, part, attempt, payload snapshot, error, Telegram message,
  and manual resend history.
- Exclude multiple groups, direct messages, inbound bot workflows, webhooks,
  email, attachments, per-user preferences, and remote secret administration.

## Capabilities

### New Capabilities

- `notification-center`: Global Telegram connection, scheduling, report
  eligibility, catch-up, delivery queue, retries, history, tests, and manual
  resend behavior.

### Modified Capabilities

- `quality-instrument-interface`: Add the global settings and notifications
  destination with channel, schedule, history, and responsive operational views.

## Impact

- Adds additive Prisma models and SQLite migration for singleton settings,
  deliveries, message parts, and attempts.
- Adds a backend scheduler that runs inside the QaBase API process and uses
  persisted deduplication rather than operating-system cron.
- Adds direct HTTPS calls to the official Telegram Bot API without an additional
  runtime dependency.
- Adds REST routes for configuration, group discovery, channel testing,
  delivery history, detail, and manual resend.
- Adds a global React workspace and sidebar destination.
- Reads `TELEGRAM_BOT_TOKEN` from `.env`; the token is never returned by the API.
- Requires the user to create the bot in BotFather, add it to the already-created
  group, configure the environment token, and send the connection command when
  requested during implementation.
