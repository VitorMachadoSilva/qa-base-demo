## ADDED Requirements

### Requirement: QaBase validation workspace identity

The system SHALL present QaBase as the visible product identity and expose the
project validation workspace through the established responsive shell.

#### Scenario: Open QaBase

- **WHEN** the application document and global shell are displayed
- **THEN** QaBase is identifiable as the product name without displacing the active project or workspace location

#### Scenario: Navigate to validation briefs on desktop

- **WHEN** the user operates a desktop or tablet project workspace
- **THEN** Validações is available as a project destination with a clear active state

#### Scenario: Navigate to validation briefs on mobile

- **WHEN** the viewport is 390 by 844 pixels
- **THEN** the validation destination remains reachable from mobile navigation without horizontal overflow or ambiguous truncation

#### Scenario: Work with a selected brief responsively

- **WHEN** the user moves between folders, the brief list, and a selected brief on a constrained viewport
- **THEN** the current selection remains recoverable and primary checklist actions remain reachable
