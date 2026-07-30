# Validation evidence

Validated on 27 July 2026.

## Automated

- `npm run setup-db` completed twice without destructive changes.
- `npx prisma generate` completed with the new models.
- `npm run smoke` covered folder hierarchy, project isolation, URL validation,
  brief creation and filtering, ordered criteria and checks, result recording,
  typed notes, promotion, and preservation after source deletion.
- `npm run db:check` reported zero duplicate positions and zero cross-project
  validation relationships.
- `npm run build` completed with 1,599 transformed modules.
- `npx @fission-ai/openspec validate add-validation-brief-workspace --strict`
  reported the change as valid.

## Browser

The Validações workspace was exercised against the local API:

1. Created a user-defined folder.
2. Created a brief with Jira-style HTTP link, objective, and scope.
3. Added and completed an acceptance criterion.
4. Added a check and recorded it as passed with an observed result.
5. Added a typed evidence note.
6. Opened and reviewed the promotion flow with a valid repository suite.
7. Confirmed derived progress changed from 0% to 100%.
8. Removed all temporary validation records after review.

Visual review passed in light and dark themes at:

- desktop default viewport;
- tablet 768 by 1024;
- mobile 390 by 844.

The mobile navigation exposes six stable destinations without overlap. The
tablet folder strip, brief ledger, and detail workspace reflow without page
overflow. The detail form remains readable and scrollable independently on
desktop.

## Scope confirmation

No external issue-tracker synchronization, binary attachments, collaboration,
CSV exchange, version history, or automation-result ingestion was added.
The card relationship is an optional HTTP(S) link only.
