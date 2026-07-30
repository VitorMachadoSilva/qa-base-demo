# Quality Overview

## Purpose

Define how project and run quality indicators summarize progress and provide
direct access to the records behind each result.

## Requirements

### Requirement: Project quality overview

The system SHALL summarize the active project's repository size, run activity,
latest execution progress, and result distribution.

#### Scenario: Project with run history

- **WHEN** the user opens the overview of a project with completed or active runs
- **THEN** the system displays totals and the latest run distribution using current stored results

#### Scenario: Project without run history

- **WHEN** the user opens the overview of a project that has no runs
- **THEN** the system displays zero-state indicators and an action to start the first run

### Requirement: Run progress summary

The system SHALL display total, executed, untested, passed, failed, blocked, and
skipped counts for a run, including a completion percentage.

#### Scenario: Partial execution

- **WHEN** some but not all run items have a recorded result
- **THEN** the completion percentage equals executed items divided by total items

#### Scenario: Empty run protection

- **WHEN** legacy or invalid data produces a run with no items
- **THEN** the system reports zero percent completion without a calculation error

### Requirement: Actionable indicators

The system SHALL allow the user to open the records represented by a result
indicator instead of presenting summary values without detail.

#### Scenario: Inspect failed tests

- **WHEN** the user selects the failed indicator for a run
- **THEN** the system displays the run items whose current result is Failed

#### Scenario: Clear an indicator filter

- **WHEN** the user clears the selected status indicator
- **THEN** the system restores the complete run item list
