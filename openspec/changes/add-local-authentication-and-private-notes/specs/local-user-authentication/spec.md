## ADDED Requirements

### Requirement: Fixed local accounts are bootstrapped securely
The system SHALL provide the three approved QaBase accounts with unique
canonical logins and SHALL store only salted password derivations.

#### Scenario: Initialize an empty database
- **WHEN** database setup runs without the approved users
- **THEN** the system creates each fixed account without exposing its password

#### Scenario: Run setup after password change
- **WHEN** setup runs after an account has changed its password
- **THEN** the existing account and password derivation remain unchanged

### Requirement: User can authenticate with local credentials
The system SHALL authenticate an active account with a generic failure response
and SHALL limit repeated invalid attempts.

#### Scenario: Login successfully
- **WHEN** an active user submits the correct canonical login and password
- **THEN** the system creates a session and returns the safe account identity

#### Scenario: Reject invalid credentials
- **WHEN** the login is unknown or the password is incorrect
- **THEN** the system rejects authentication without revealing which value failed

#### Scenario: Limit repeated attempts
- **WHEN** the same login source repeatedly submits invalid credentials
- **THEN** the system temporarily rejects additional attempts

### Requirement: Session persists safely for seven days
The system SHALL keep an opaque, revocable session for at most seven days in the
same browser profile and SHALL not expose the session token to frontend code.

#### Scenario: Restore an existing browser session
- **WHEN** the application opens in the same browser profile before expiration
- **THEN** the user is restored without entering credentials again

#### Scenario: Open a new browser instance
- **WHEN** the application opens without the existing session cookie
- **THEN** the login screen is shown

#### Scenario: Use an expired session
- **WHEN** a client presents a session after its expiration
- **THEN** the system rejects it and requires a new login

### Requirement: Operational API requires authentication
The system SHALL reject anonymous access to every business endpoint while
keeping only explicit health and authentication entry points public.

#### Scenario: Call a protected endpoint anonymously
- **WHEN** a client without a valid session requests project or workspace data
- **THEN** the system returns an unauthorized response without business data

#### Scenario: Call a shared endpoint while authenticated
- **WHEN** any approved user requests shared operational data
- **THEN** the system returns the same shared QaBase records

#### Scenario: Submit a cross-origin mutation
- **WHEN** an authenticated mutation originates outside the configured application origin
- **THEN** the system rejects the request

### Requirement: User can end the current session
The system SHALL allow an authenticated user to revoke the current session.

#### Scenario: Logout
- **WHEN** the user activates logout
- **THEN** the server revokes the session, clears the browser cookie, and returns to login

### Requirement: User can change the own password
The system SHALL require the current password, a valid new password, and matching
confirmation before changing the authenticated account password.

#### Scenario: Change password successfully
- **WHEN** the user supplies the correct current password and a valid confirmed new password
- **THEN** the system changes the derivation, revokes other sessions, and keeps a new current session

#### Scenario: Reject incorrect current password
- **WHEN** the current password is incorrect
- **THEN** the system preserves the password and every existing session

#### Scenario: Reject invalid confirmation
- **WHEN** the new password is invalid or does not match confirmation
- **THEN** the system reports validation without changing credentials

### Requirement: Password notice is shown once
The system SHALL record whether each user acknowledged the availability of
password change in Minha conta.

#### Scenario: First authenticated application load
- **WHEN** an authenticated user has not acknowledged the notice
- **THEN** the interface presents the informational password modal

#### Scenario: Dismiss the notice
- **WHEN** the user closes or acknowledges the modal
- **THEN** the system records acknowledgement and does not show it on later sessions

### Requirement: Operator can reset a fixed account locally
The system SHALL provide a server-local maintenance command that validates a new
password, changes its derivation, and revokes sessions without a recovery UI.

#### Scenario: Reset an existing fixed account
- **WHEN** the local operator supplies a valid account and new password
- **THEN** the password is replaced and all sessions for that account are revoked

#### Scenario: Reject an unknown account
- **WHEN** the operator requests reset for an unknown login
- **THEN** the command fails without creating another user
