## Why

QaBase still delegates destructive confirmations and renaming prompts to
browser-native dialogs, which break the product's visual language and provide
inconsistent accessibility and safety. A single internal dialog system makes
every critical action predictable across workspaces.

## What Changes

- Replace every `window.confirm`, `window.prompt`, and native alert-style flow
  in the frontend with one QaBase dialog service.
- Support confirmation, destructive confirmation, text input, and typed
  verification from the same visual component.
- Require the exact project name before a complete project deletion.
- Preserve each flow's current message and action while standardizing labels,
  focus, Escape, backdrop, loading, and theme behavior.
- Keep business errors and success notifications in the existing toast system.
- Undo, audit recovery, and backend approval workflows remain outside scope.

## Capabilities

### New Capabilities

- `confirmation-dialogs`: Product-owned confirmation, prompt, and typed
  verification behavior for critical frontend actions.

### Modified Capabilities

None.

## Impact

The change adds one shared React provider and modal, updates application
composition and every workspace that currently invokes a native dialog, and
adds styling and browser regression coverage. No backend schema or dependency
changes are required.
