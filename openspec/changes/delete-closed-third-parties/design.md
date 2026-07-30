## Context

QaBase currently keeps every third-party identity after closure and offers no
API operation for permanent removal. The data model already cascades an
identity deletion to cycles, grants, and activities, while the derived
`Closed` state means there is no cycle without `closedAt`.

## Goals / Non-Goals

**Goals:**

- Enforce the closed-only rule in the API, independently of the interface.
- Expose a restrained icon action only when deletion is allowed.
- Close the inspector after lifecycle-ending actions.
- Cover both rejection and successful cascade deletion in the smoke suite.

**Non-Goals:**

- Soft deletion, restoration, bulk deletion, or retention policies.
- Deleting individual cycles or system activities.
- Redesigning the future shared confirmation-modal system.

## Decisions

1. Add `DELETE /third-parties/:id` and perform a hard delete. Existing Prisma
   cascade relations already describe the intended ownership boundary, so a
   new archived state or migration would add ambiguity without recovery UX.
2. The controller checks for any open cycle immediately before deletion.
   Frontend visibility is guidance; backend validation is the authority and
   rejects active, expiring, or expired records.
3. The delete action appears as a familiar `Trash2` icon in the closed
   record's action row with title and accessible label. A native confirmation
   remains consistent with current deletion behavior until the dedicated
   confirmation-dialog change is implemented.
4. Successful closure closes the inspector and reloads the ledger instead of
   reopening the same record in detail mode. Successful deletion follows the
   same sequence and removes the record from summaries and filters.

## Risks / Trade-offs

- [Permanent deletion removes historical evidence] -> Require a closed state,
  explicit confirmation, and a clear destructive message.
- [A stale frontend may show an invalid action] -> Recheck lifecycle state in
  the API at deletion time.
- [Cascade behavior could regress] -> Verify the record is no longer readable
  and run database integrity checks in regression.
