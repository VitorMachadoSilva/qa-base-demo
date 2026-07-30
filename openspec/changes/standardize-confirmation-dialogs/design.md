## Context

The frontend currently contains native confirmations across eight workspaces and
native prompts for three rename operations. QaBase already has shared modal
tokens and interaction styling, but no common asynchronous dialog contract.

## Goals / Non-Goals

**Goals:**

- Provide promise-based confirmation and text-input APIs to any React subtree.
- Match existing QaBase modal visuals in both themes and responsive layouts.
- Preserve focus, keyboard cancellation, backdrop cancellation, and accessible
  labelling.
- Add typed verification for full project deletion.
- Remove all native confirm, prompt, and alert calls from application source.

**Non-Goals:**

- Replace toast notifications or field-level validation.
- Add undo or recover deleted data.
- Change backend deletion permissions or business rules.

## Decisions

1. A context provider owns one dialog and exposes `confirmAction` and
   `requestText`. Promise results let existing async handlers retain their
   control flow with minimal coupling.
2. Dialog requests describe title, message, labels, tone, optional input, and
   optional verification text. One component renders confirmation, rename, and
   typed-delete variants without nested cards or duplicated modal code.
3. Cancellation resolves `false` or `null`; it never rejects. Business errors
   continue through existing `onNotify` paths.
4. The confirm button is disabled until required input is nonempty and, for
   typed verification, exactly matches the required value.
5. The provider is mounted above `App`, so project and global workspaces use the
   same queue. Only one request can be active; a second request while open is
   rejected in development rather than replacing user context.

## Risks / Trade-offs

- [A caller forgets to await the promise] -> Expose verb-first async methods
  and migrate every existing native call in one change.
- [Focus is lost after closing] -> Capture the previously focused element and
  restore it after resolution.
- [A dialog remains open during route changes] -> Keep it above application
  routing and make cancellation deterministic through Escape and backdrop.
- [Long names overflow] -> Wrap verification copy and constrain input and
  actions at mobile widths.
