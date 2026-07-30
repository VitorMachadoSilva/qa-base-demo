# Quality Instrument Interface

## Purpose

Define the product-specific visual language, shell, operational collections,
execution composition, responsive behavior, and accessibility baseline for the
QA Manager interface.

## Requirements

### Requirement: Product-specific visual hierarchy

The system SHALL present a consistent Quality Instrument visual language that
prioritizes active QA work over navigation and decorative chrome.

#### Scenario: Open a populated workspace

- **WHEN** the user opens a repository, planning, history, or execution workspace with data
- **THEN** the active work area has stronger hierarchy than navigation, supporting metadata, and secondary actions

#### Scenario: Open an empty workspace

- **WHEN** the active workspace has no records
- **THEN** the system explains the empty condition in one concise statement and presents one relevant next action without decorative content

#### Scenario: Interpret a test result

- **WHEN** a Passed, Failed, Blocked, Skipped, or Untested result is displayed
- **THEN** the result is identifiable through text or icon in addition to its semantic color

### Requirement: Consistent application shell

The system SHALL provide predictable global navigation, project context,
location, and primary actions across all project workspaces.

#### Scenario: Navigate on desktop

- **WHEN** the user moves between Overview, Repository, Planning, and Runs on a desktop viewport
- **THEN** the global rail, active project context, current destination, and page location remain identifiable without reducing the work canvas unnecessarily

#### Scenario: Change project

- **WHEN** the user returns to project selection and opens another project
- **THEN** the shell updates the project context and preserves the same navigation model

#### Scenario: Locate the primary action

- **WHEN** a workspace has a primary creation or execution action
- **THEN** the action appears in a consistent command area and does not compete with another primary-styled command

### Requirement: Dense operational collections

The system SHALL display cases, plans, milestones, environments, configurations,
and runs as scannable continuous collections with context-preserving actions.

#### Scenario: Scan a populated collection

- **WHEN** a collection contains multiple records
- **THEN** the user can compare identity, state, relevant context, and key metrics without opening every record

#### Scenario: Select records for an action

- **WHEN** the user selects one or more eligible records
- **THEN** the collection presents applicable actions without shifting row dimensions or losing the current filters

#### Scenario: Inspect a record

- **WHEN** the user opens a record that can be inspected or edited contextually
- **THEN** the detail appears without losing the originating selection, filters, or scroll position

#### Scenario: Display many records

- **WHEN** a collection contains 200 records
- **THEN** row geometry remains stable and the collection supports scanning without nested cards or horizontal page overflow

### Requirement: Focused test execution workspace

The system SHALL provide a purpose-built execution composition that keeps case
scope, steps, context, result controls, and queue progress available.

#### Scenario: Execute a pending case on desktop

- **WHEN** the user opens an active run with pending cases on desktop
- **THEN** the current case, ordered steps, run context, queue position, and result controls are available in one coherent workspace

#### Scenario: Save and advance

- **WHEN** the user saves a result and advances to the next pending case
- **THEN** the workspace updates the case and progress without moving the result controls unpredictably

#### Scenario: Review a completed run

- **WHEN** the user opens a completed run
- **THEN** the same captured context and results remain readable while editing controls are clearly unavailable

#### Scenario: Execute on mobile

- **WHEN** the user records a result on a mobile viewport
- **THEN** the current case and a reachable result dock remain available without requiring horizontal scrolling

### Requirement: Responsive task composition

The system SHALL adapt navigation, collections, inspectors, forms, and execution
controls to desktop, tablet, and mobile according to the task rather than only
scaling the desktop layout.

#### Scenario: Use project navigation on mobile

- **WHEN** the viewport is 390 by 844 pixels
- **THEN** primary project destinations are reachable through mobile navigation and do not truncate into ambiguous icon-only controls

#### Scenario: Open a long form on mobile

- **WHEN** the user creates or edits a case, plan, milestone, or execution context on mobile
- **THEN** the form uses the available viewport, keeps actions reachable, and does not create horizontal page overflow

#### Scenario: Inspect data on tablet

- **WHEN** the viewport cannot show navigation, collection, and inspector side by side
- **THEN** contextual surfaces become drawers while the selected record and originating workspace remain recoverable

### Requirement: Accessible and stable interaction

The system SHALL provide keyboard-operable controls, visible focus, sufficient
contrast, stable dimensions, and reduced-motion behavior.

#### Scenario: Navigate with keyboard

- **WHEN** the user operates the shell, collection, inspector, form, or run controls without a pointer
- **THEN** focus follows a logical order, remains visible, and reaches every action

#### Scenario: Zoom the interface

- **WHEN** the user zooms the application to 200 percent
- **THEN** content remains readable and primary workflows remain operable without text overlap

#### Scenario: Request reduced motion

- **WHEN** the operating system requests reduced motion
- **THEN** nonessential transitions are removed while state changes remain understandable

#### Scenario: Encounter loading or failure

- **WHEN** a workspace is loading or an operation fails
- **THEN** the affected area communicates its state without resizing unrelated controls or erasing the user's current context

### Requirement: Global rail exposes quick notes
The Quality Instrument shell SHALL expose `Anotacoes rapidas` as a global
destination with icon, tooltip, accessible label, active state, and no project
context navigation.

#### Scenario: Open from desktop global rail
- **WHEN** the user activates the quick-notes icon
- **THEN** the shell opens the global quick-notes workspace and marks its icon active

#### Scenario: Open from mobile global navigation
- **WHEN** the user activates quick notes on a mobile global screen
- **THEN** the shell opens the workspace without horizontal overflow

### Requirement: Quick-notes workspace supports rapid visual scanning
The workspace SHALL combine a date navigator, compact composer, search, and a
responsive sticky-note card grid using the Quality Instrument visual language.

#### Scenario: Scan a populated desktop workspace
- **WHEN** notes with multiple colors, dates, lengths, and pin states are present
- **THEN** cards retain stable columns, readable contrast, clamped previews, textual dates, and visible pin state

#### Scenario: Reflow on narrow screens
- **WHEN** the viewport narrows to tablet or mobile width
- **THEN** date navigation, composer, search, cards, and actions reflow without page overflow or overlapping controls

### Requirement: Note colors adapt to both themes
Each supported note palette key SHALL map to coordinated light and dark surfaces
with readable text, borders, placeholders, and focus indicators.

#### Scenario: Switch theme with colored notes
- **WHEN** the user switches between Light instrument and Graphite bench
- **THEN** note identity and controls remain legible without relying on color alone

### Requirement: Note interactions are keyboard accessible
The workspace SHALL provide visible focus, meaningful labels, Escape behavior
for the inspector, and a logical keyboard order from capture through note cards.

#### Scenario: Create and edit with keyboard
- **WHEN** the user navigates the composer and editor using the keyboard
- **THEN** focus follows the visual order and all save, pin, color, close, and delete actions remain operable

#### Scenario: Close a lateral inspector from outside
- **WHEN** the user clicks outside any inspector opened on the right side
- **THEN** the inspector closes without saving or mutating its form

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
