## ADDED Requirements

### Requirement: Global rail exposes settings and notifications
The Quality Instrument shell SHALL expose `Configurações e notificações` as a
global destination with icon, tooltip, accessible label, active state, and no
project context navigation.

#### Scenario: Open from desktop global rail
- **WHEN** the user activates the settings and notifications icon
- **THEN** the shell opens the global notification workspace and marks its icon active

#### Scenario: Open from mobile global navigation
- **WHEN** the user activates settings on a mobile global screen
- **THEN** the workspace opens without project selection or horizontal overflow

### Requirement: Notification workspace separates operational concerns
The workspace SHALL provide Overview, Telegram, Schedules, and History views
with persistent navigation and clear readiness states.

#### Scenario: Review readiness
- **WHEN** the user opens Overview
- **THEN** channel readiness, next report times, latest delivery, and latest failure are visible without exposing credentials

#### Scenario: Configure channel
- **WHEN** the user opens Telegram
- **THEN** safe bot state, group discovery, confirmation, test, and reconnect actions are available

#### Scenario: Configure schedules
- **WHEN** the user opens Schedules
- **THEN** timezone, send time, cadence, lead-day controls, and automatic enablement are presented as appropriate form controls

#### Scenario: Review history
- **WHEN** the user opens History
- **THEN** deliveries appear in a dense filterable ledger and detail opens in the shared right-side inspector

### Requirement: Notification states remain clear and responsive
The workspace SHALL communicate configured, disconnected, disabled, pending,
sent, failed, no-data, and retry states through text or icons in addition to
color and SHALL adapt to desktop, tablet, and mobile.

#### Scenario: Display a failure
- **WHEN** a delivery or channel operation fails
- **THEN** the affected surface shows a safe actionable error without revealing the bot token

#### Scenario: Reflow on narrow screens
- **WHEN** the viewport narrows to tablet or mobile width
- **THEN** tabs, settings, history, delivery detail, and actions remain operable without overlap or horizontal page overflow

#### Scenario: Inspect with keyboard
- **WHEN** the user operates the workspace without a pointer
- **THEN** focus reaches tabs, forms, channel actions, filters, rows, close, and resend in logical order
