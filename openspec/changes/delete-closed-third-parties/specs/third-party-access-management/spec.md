## ADDED Requirements

### Requirement: Closed third parties can be permanently deleted
The system SHALL allow permanent deletion of a third-party identity only when
all of its access cycles are closed.

#### Scenario: Delete a closed third party
- **WHEN** an authenticated user confirms deletion of a third party whose state is `Closed`
- **THEN** the system deletes the identity, cycles, grants, and activities and removes it from the ledger and summaries

#### Scenario: Reject deletion while a cycle remains open
- **WHEN** an authenticated user requests deletion of a third party in `Active`, `Expiring`, or `Expired` state
- **THEN** the system rejects the operation and preserves the identity and all access history

#### Scenario: Delete action visibility
- **WHEN** a user opens the detail inspector for a third party
- **THEN** the system shows the icon-only delete action if and only if the derived state is `Closed`

### Requirement: Lifecycle completion closes the inspector
The system SHALL close the lateral third-party inspector after successfully
closing access or permanently deleting the closed identity.

#### Scenario: Close access successfully
- **WHEN** the user submits a valid reason and the current access cycle is closed
- **THEN** the inspector closes and the ledger and summary reflect the closed state

#### Scenario: Closure fails
- **WHEN** closing access is rejected by validation or the API
- **THEN** the inspector remains open and shows the failure without discarding the entered context
