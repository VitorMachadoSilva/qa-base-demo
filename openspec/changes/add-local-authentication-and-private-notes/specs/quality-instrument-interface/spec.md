## ADDED Requirements

### Requirement: Application shell is gated by authentication
The Quality Instrument interface SHALL resolve the current session before
showing operational navigation and SHALL present a focused login screen when no
valid session exists.

#### Scenario: Open without a session
- **WHEN** the application finishes session resolution without an authenticated user
- **THEN** the login form is shown without project or workspace data

#### Scenario: Open with a valid session
- **WHEN** the application resolves a valid authenticated user
- **THEN** the shared shell and the user's safe identity become available

#### Scenario: Session expires during use
- **WHEN** an API operation reports that the current session is no longer valid
- **THEN** the interface clears private state and returns to login

### Requirement: Global rail exposes Minha conta
The Quality Instrument shell SHALL expose Minha conta immediately below
Configurações e notificações with icon, tooltip, accessible label, active state,
and the authenticated user's identity.

#### Scenario: Open account on desktop
- **WHEN** the user activates the account icon in the global rail
- **THEN** Minha conta opens and the account destination is marked active

#### Scenario: Open account on mobile
- **WHEN** the user activates Minha conta in mobile navigation
- **THEN** the account workspace opens without horizontal overflow

### Requirement: Account workspace supports personal security actions
Minha conta SHALL show the authenticated identity, password-change form, and
logout action without exposing password derivations or session tokens.

#### Scenario: Review identity
- **WHEN** the user opens Minha conta
- **THEN** display name and local login are visible in a compact work-focused layout

#### Scenario: Submit password change
- **WHEN** the user provides current, new, and confirmed password values
- **THEN** the form communicates validation and successful session replacement clearly

#### Scenario: Operate with keyboard
- **WHEN** the user navigates Minha conta without a pointer
- **THEN** fields, password visibility controls, save, and logout have logical focus and accessible labels

### Requirement: Password-change notice is informative and non-blocking
The interface SHALL present a one-time modal explaining that password change is
available in Minha conta without requiring an immediate change.

#### Scenario: Acknowledge the notice
- **WHEN** the user dismisses the notice or chooses to open Minha conta
- **THEN** acknowledgement is persisted and the selected destination is respected

#### Scenario: Reopen after acknowledgement
- **WHEN** the user starts a later session after acknowledging the notice
- **THEN** the modal is not shown again

### Requirement: Authentication surfaces adapt to supported themes and sizes
Login, session loading, Minha conta, and the password notice SHALL remain
readable and operable in light and dark themes on desktop and mobile.

#### Scenario: Login on mobile
- **WHEN** the viewport is 390 by 844 pixels
- **THEN** login identity, fields, password control, error, and submit action fit without overlap or horizontal scrolling

#### Scenario: Zoom account workspace
- **WHEN** Minha conta is zoomed to 200 percent
- **THEN** identity and security actions reflow without clipped text or unreachable controls
