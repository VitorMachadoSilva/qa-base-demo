## 1. Data model and migration

- [x] 1.1 Add User and Session models with indexes and relations
- [x] 1.2 Add required QuickNote owner relation and owner-first indexes
- [x] 1.3 Create a migration that removes legacy notes and evolves the schema
- [x] 1.4 Add idempotent bootstrap for the three fixed accounts without overwriting passwords
- [x] 1.5 Extend database setup and integrity checks for users, sessions, and note ownership
- [x] 1.6 Format and validate the Prisma schema, generate the client, and apply the migration

## 2. Authentication backend

- [x] 2.1 Implement versioned scrypt password derivation and constant-time verification
- [x] 2.2 Implement opaque session creation, lookup, expiration, revocation, and cookie helpers
- [x] 2.3 Implement generic login throttling for repeated failures
- [x] 2.4 Add Zod schemas for login and password change
- [x] 2.5 Add login, current-session, logout, password-change, and notice acknowledgement controllers
- [x] 2.6 Add authentication and mutation-origin middlewares
- [x] 2.7 Protect all business routes while preserving public health and login endpoints
- [x] 2.8 Configure credentialed CORS for the known frontend origin
- [x] 2.9 Add the local fixed-account password reset command

## 3. Private quick notes

- [x] 3.1 Scope note listing, search, ordering, folders, and counts to the authenticated owner
- [x] 3.2 Assign the authenticated owner during note creation
- [x] 3.3 Scope note read, update, pin, and delete by owner with indistinguishable not-found responses
- [x] 3.4 Update note smoke helpers and integrity assertions for multiple users

## 4. Frontend session and login

- [x] 4.1 Send credentials on every API request and centralize unauthorized-session handling
- [x] 4.2 Add session, login, logout, password-change, and notice API methods
- [x] 4.3 Gate application initialization on current-session resolution
- [x] 4.4 Build the responsive login surface with password visibility and accessible errors
- [x] 4.5 Clear private frontend state and return to login when a session expires
- [x] 4.6 Preserve the seven-day session across reloads without browser storage tokens

## 5. Minha conta and onboarding

- [x] 5.1 Add Minha conta below notifications in desktop and mobile global navigation
- [x] 5.2 Build the account workspace with identity, password change, and logout
- [x] 5.3 Validate current, new, and confirmed password fields with safe feedback
- [x] 5.4 Show the password-change information modal only before acknowledgement
- [x] 5.5 Support opening Minha conta directly from the information modal
- [x] 5.6 Style login, account, and modal for both themes and supported viewport sizes
- [x] 5.7 Preserve keyboard order, visible focus, labels, and reduced-motion behavior

## 6. Documentation

- [x] 6.1 Document authentication, cookies, sessions, endpoints, and note ownership in API and architecture references
- [x] 6.2 Document bootstrap accounts, password reset, HTTPS deployment requirement, and operational cautions
- [x] 6.3 Update product, implementation, backlog, and handoff state

## 7. Verification

- [x] 7.1 Add an authentication smoke suite for login, generic failure, throttling, session restoration, logout, and expiration
- [x] 7.2 Verify password change, session revocation, notice acknowledgement, and local reset
- [x] 7.3 Verify cross-user note isolation for list, count, search, read, update, and delete
- [x] 7.4 Run setup twice, integrity checks, all previous smoke suites, and frontend build
- [x] 7.5 Validate login, modal, Minha conta, logout, reload, and private notes in the browser
- [x] 7.6 Validate desktop, tablet, mobile, light, dark, keyboard, zoom, overflow, and console state
- [x] 7.7 Validate the OpenSpec change strictly and record final evidence
