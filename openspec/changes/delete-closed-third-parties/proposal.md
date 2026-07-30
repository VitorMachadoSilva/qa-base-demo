## Why

Third-party records remain permanently visible after their access cycle is
closed, even when the team no longer needs the identity or its history. QaBase
needs a deliberate cleanup path that cannot remove active access control data.

## What Changes

- Allow permanent deletion only when every access cycle is already closed.
- Reject deletion attempts for active, expiring, or expired open cycles.
- Show an icon-only delete action only in the detail of a closed third party.
- Close the lateral inspector after either closing access or deleting the
  closed record.
- Keep confirmation and clear user feedback around permanent deletion.
- Account provisioning, reopening closed cycles, bulk deletion, and archival
  remain outside this change.

## Capabilities

### New Capabilities

- `third-party-access-management`: Safe lifecycle completion and permanent
  deletion rules for third-party identities and their access history.

### Modified Capabilities

None.

## Impact

The change affects the third-party REST controller and routes, the centralized
frontend API client, the third-party workspace and its smoke coverage. Deletion
uses existing SQLite cascade relations and adds no dependency or schema change.
