## ADDED Requirements

### Requirement: Personalized color themes

The system SHALL provide purpose-designed light and dark color themes that
preserve the Quality Instrument hierarchy, semantic result meaning, readable
content, and visible interaction states.

#### Scenario: Open the application for the first time

- **WHEN** no valid local theme preference exists
- **THEN** the system applies the operating system color preference before the application content is displayed

#### Scenario: Switch to the other color theme

- **WHEN** the user activates the theme control
- **THEN** the complete interface changes between light and dark without navigation, reload, or loss of current workspace context

#### Scenario: Reopen after choosing a theme

- **WHEN** the user reloads or later reopens the application after choosing a theme
- **THEN** the selected theme is applied before content is displayed and remains active across project workspaces

#### Scenario: Operate the theme control without a pointer

- **WHEN** the user reaches the theme control by keyboard or assistive technology
- **THEN** the current state, resulting action, focus indicator, and accessible name are identifiable

#### Scenario: Interpret results in dark mode

- **WHEN** Passed, Failed, Blocked, Skipped, and Untested results appear in the dark theme
- **THEN** each result retains its text or icon identity and sufficient visual distinction from its surface

#### Scenario: Local preference is unavailable

- **WHEN** stored theme access fails or contains an unsupported value
- **THEN** the application remains usable and resolves a valid theme from the operating system preference
