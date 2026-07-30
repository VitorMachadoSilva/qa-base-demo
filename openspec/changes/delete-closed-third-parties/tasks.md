## 1. Backend deletion contract

- [x] 1.1 Add the authenticated DELETE endpoint for a third-party identity
- [x] 1.2 Reject deletion when any access cycle remains open
- [x] 1.3 Permanently delete closed identities through existing cascades

## 2. Frontend lifecycle behavior

- [x] 2.1 Add the centralized delete API method
- [x] 2.2 Show an accessible icon-only delete action only for closed records
- [x] 2.3 Confirm permanent deletion, close the inspector, and refresh data
- [x] 2.4 Close the inspector and refresh data after successful access closure

## 3. Verification and documentation

- [x] 3.1 Extend the third-party smoke suite for rejection and cascade deletion
- [x] 3.2 Update API and implementation references
- [x] 3.3 Run smoke regression, database integrity, frontend build, and browser checks
- [x] 3.4 Validate the OpenSpec change strictly and record evidence
