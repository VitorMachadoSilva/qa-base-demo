## ADDED Requirements

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
