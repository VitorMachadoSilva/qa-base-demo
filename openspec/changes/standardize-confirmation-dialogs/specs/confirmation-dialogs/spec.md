## ADDED Requirements

### Requirement: QaBase owns every confirmation dialog
The frontend SHALL use a product-styled modal instead of browser-native alert,
confirm, or prompt dialogs for user decisions.

#### Scenario: Confirm a destructive action
- **WHEN** a user initiates a deletion that requires confirmation
- **THEN** the system displays a themed QaBase modal with the action context, cancel control, and destructive confirm control

#### Scenario: Cancel a confirmation
- **WHEN** the user selects Cancel, clicks the backdrop, or presses Escape
- **THEN** the system closes the modal, restores focus, and does not execute the action

#### Scenario: Confirm by keyboard
- **WHEN** the modal is open and the user navigates with Tab
- **THEN** focus remains inside the modal and all controls expose visible focus and accessible labels

### Requirement: Text requests use the shared modal
The frontend SHALL collect names for rename operations through the shared modal
with an explicit label, initial value, and required validation.

#### Scenario: Rename with a valid value
- **WHEN** the user edits the prefilled value and confirms
- **THEN** the modal returns the new trimmed value to the originating workflow

#### Scenario: Cancel a rename
- **WHEN** the user cancels the text request
- **THEN** the original value is preserved and no API mutation occurs

### Requirement: Project deletion requires typed verification
The frontend SHALL require the exact project name before enabling permanent
project deletion.

#### Scenario: Verification does not match
- **WHEN** the typed project name differs from the required name
- **THEN** the destructive confirm control remains disabled and the project is preserved

#### Scenario: Verification matches
- **WHEN** the user types the exact project name and confirms
- **THEN** the system closes the modal and executes the existing project deletion workflow once
