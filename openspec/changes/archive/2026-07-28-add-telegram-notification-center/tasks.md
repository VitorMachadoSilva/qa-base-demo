## 1. Data model and migration

- [x] 1.1 Add singleton notification settings, normalized lead days, deliveries, message parts, attempts, resend linkage, snapshots, statuses, and deduplication indexes to Prisma.
- [x] 1.2 Create an additive SQLite migration with disabled defaults for `America/Sao_Paulo`, `09:00`, two-day demand cadence, and lead days seven and two.
- [x] 1.3 Extend idempotent setup for existing and clean databases without modifying production demands or third-party access history.
- [x] 1.4 Extend integrity checks for settings cardinality, invalid lead days, duplicate deduplication keys, orphaned parts or attempts, invalid positions, and inconsistent delivery states.
- [x] 1.5 Format and validate Prisma, generate the client, run setup twice, and confirm zero notification integrity violations.

## 2. Telegram security and transport

- [x] 2.1 Add the `TELEGRAM_BOT_TOKEN` environment contract and expose only safe configured and verified state.
- [x] 2.2 Implement a native HTTPS Telegram client for `getMe`, `getUpdates`, `getChat`, and `sendMessage` with timeout, response validation, and token-safe errors.
- [x] 2.3 Implement explicit `/connect@bot_username` candidate parsing restricted to recent groups and supergroups.
- [x] 2.4 Implement group confirmation, replacement, safe channel snapshots, and revalidation without changing historical deliveries.
- [x] 2.5 Implement escaped Telegram HTML rendering with compact record blocks and a conservative message-size ceiling.
- [x] 2.6 Implement record-boundary partitioning, deterministic part numbering, and payload snapshot generation.
- [x] 2.7 Verify that tokens and token-bearing URLs never enter logs, API responses, SQLite, errors, or frontend state.

## 3. Reports, scheduling, and delivery queue

- [x] 3.1 Implement IANA timezone validation, civil date arithmetic, schedule-time comparison, and future planned-day calculation.
- [x] 3.2 Implement active AD/MF selection, urgency grouping, undated AD handling, deterministic ordering, and consolidated rendering.
- [x] 3.3 Implement access selection for configured lead days, expiration day, and daily overdue cycles until renewal or closure.
- [x] 3.4 Implement transactional logical delivery creation with deterministic deduplication keys, source snapshots, and `NoData` outcomes.
- [x] 3.5 Implement ordered part processing with immediate attempts, Telegram message ids, and logical status aggregation.
- [x] 3.6 Implement persisted retries after 1, 5, and 15 minutes while preserving already-sent parts.
- [x] 3.7 Implement final failure handling with safe errors and no changes to future report cadence.
- [x] 3.8 Implement the minute scheduler lifecycle inside the Express process with notifications disabled by default.
- [x] 3.9 Implement one catch-up execution per report type after downtime and advance directly to a future planned day.
- [x] 3.10 Implement manual resend as a linked delivery from the immutable original payload snapshot.

## 4. REST API and frontend contracts

- [x] 4.1 Add Zod schemas for settings, IANA timezone, time, cadence, unique lead days, group confirmation, filters, and resend.
- [x] 4.2 Add settings and overview endpoints with readiness, next schedules, latest delivery, and latest failure.
- [x] 4.3 Add Telegram status, discovery, confirmation, reconnect, and real channel-test endpoints.
- [x] 4.4 Add filterable delivery history and complete delivery-detail endpoints.
- [x] 4.5 Add manual resend with no-data rejection and centralized not-found or conflict errors.
- [x] 4.6 Register routes, scheduler startup, and frontend API contracts without changing existing project routes.

## 5. Global settings and notifications workspace

- [x] 5.1 Add `Configurações e notificações` to the global rail and mobile global navigation with a Lucide icon, active state, tooltip, and accessible label.
- [x] 5.2 Add the global `settings-notifications` route independent of project selection.
- [x] 5.3 Build persistent Overview, Telegram, Schedules, and History tabs using Quality Instrument patterns.
- [x] 5.4 Build Overview readiness, next-run, latest-delivery, and latest-failure summaries with actionable navigation.
- [x] 5.5 Build the guided Telegram setup state without rendering or accepting the token.
- [x] 5.6 Build group candidate confirmation, reconnect, and real channel-test interactions.
- [x] 5.7 Build schedule controls for enablement, timezone, time, cadence, and an editable unique lead-day list.
- [x] 5.8 Build the dense delivery ledger with type, trigger, status, planned day, source count, attempts, and filters.
- [x] 5.9 Build delivery detail in the shared inspector with parts, attempts, errors, snapshots, and manual resend.
- [x] 5.10 Add loading, empty, disabled, disconnected, pending, retrying, sent, failed, no-data, and recoverable error states.
- [x] 5.11 Adapt tabs, forms, ledger, inspector, and actions for 1280, 820, 390 by 844, 200 percent reflow, keyboard focus, and reduced motion.

## 6. User-owned Telegram checkpoints

- [x] 6.1 User creates the private Telegram group.
- [x] 6.2 User creates the QaBase bot with the official BotFather and keeps the issued token private.
- [x] 6.3 User adds the bot to the created group with permission to send messages.
- [x] 6.4 User places the token in `backend/.env` locally and restarts the backend when instructed.
- [x] 6.5 User sends `/connect@<bot_username>` in the group and confirms the detected group in QaBase.
- [x] 6.6 User observes and approves the real test message recorded in delivery history.

## 7. Automated and live validation

- [x] 7.1 Add a deterministic fake Telegram transport and controllable clock for tests without external delivery.
- [x] 7.2 Add a dedicated notification smoke suite for secret safety, validation, discovery, report eligibility, no-data, deduplication, catch-up, splitting, partial success, retries, restart, history, and resend.
- [x] 7.3 Verify existing and clean database setup plus notification integrity.
- [x] 7.4 Run all existing smoke suites and the notification suite without regressions.
- [x] 7.5 Run the production build and browser validation in desktop, tablet, mobile, light, and dark.
- [x] 7.6 Verify disconnected, disabled, configured, empty, populated, long-content, multipart, retry, final-failure, and 200-delivery states.
- [x] 7.7 Perform one controlled live discovery and Telegram test with the user after automated validation passes.
- [x] 7.8 Remove only temporary automated and live-test records while preserving the approved test delivery if the user chooses.
- [x] 7.9 Update API, architecture, product, implementation, tasks, benchmark, environment example, and handoff documents.
- [x] 7.10 Record final evidence, user actions, residual limitations, cleanup, and strict OpenSpec validation.
