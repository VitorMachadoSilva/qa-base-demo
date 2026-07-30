## 1. Backup contract and fixtures

- [x] 1.1 Define version-one constants, MIME type, size limit, safe filename rules, and supported collection manifest
- [x] 1.2 Define strict Zod schemas for manifest, payload entities, portable references, dates, enums, and integrity metadata
- [x] 1.3 Implement deterministic canonical JSON serialization and SHA-256 calculation with repeatable hash tests
- [x] 1.4 Create fixed version-one fixtures for an empty project and a representative fully linked project
- [x] 1.5 Add a contract coverage check that fails when a project-owned Prisma relation is neither included nor explicitly excluded
- [x] 1.6 Verify fixtures parse strictly, produce stable checksums, and enumerate all expected collections

## 2. Project export backend

- [x] 2.1 Implement a transactional query that reads the complete project graph as one consistent snapshot
- [x] 2.2 Serialize project metadata, repository hierarchy, cases, steps, components, and associations to portable references
- [x] 2.3 Serialize plans, sections, items, dependencies, milestones, environments, and configuration matrices
- [x] 2.4 Serialize validation folders, briefs, criteria, checks, notes, and case links
- [x] 2.5 Serialize runs, plan-section snapshots, executed cases, results, evidence text, dependencies, and configurations
- [x] 2.6 Serialize AD/MF records, cross-links, project links, closure data, and activities
- [x] 2.7 Build and self-validate the manifest, collection counts, canonical checksum, and safe download filename
- [x] 2.8 Add the authenticated project export endpoint with the QaBase backup MIME and attachment headers
- [x] 2.9 Verify populated, empty, missing-project, concurrent-read, exclusion, and historical-snapshot exports

## 3. Validation and preview backend

- [x] 3.1 Add a route-specific parser for the backup MIME with a 50 MiB limit without increasing other JSON route limits
- [x] 3.2 Implement layered validation for format, version, strict schema, checksum, counts, references, ownership, ordering, and cycles
- [x] 3.3 Implement deterministic restored-name suggestions with collision-aware numeric suffixes
- [x] 3.4 Add the authenticated preview endpoint that returns metadata, counts, warnings, and suggested name without database writes
- [x] 3.5 Return stable actionable error categories for malformed, oversized, corrupted, unsupported, and structurally invalid files
- [x] 3.6 Verify preview success and that every rejection path leaves all database counts unchanged

## 4. Atomic project restoration

- [x] 4.1 Implement the restoration transaction and portable-reference-to-new-id maps
- [x] 4.2 Restore project, independent catalogs, nested suites, folders, cases, steps, and component links in dependency order
- [x] 4.3 Restore plans, sections, items, validations, criteria, checks, notes, and their case links
- [x] 4.4 Restore runs, run sections, executed-case snapshots, results, and selected configurations
- [x] 4.5 Restore AD/MF records and activities, then resolve self-references and cross-area links in a second pass
- [x] 4.6 Preserve functional timestamps while allowing the new project to receive its own local identity and restored name
- [x] 4.7 Add the authenticated import endpoint that reruns full validation and returns the new project with inserted counts
- [x] 4.8 Verify rollback under an injected mid-import failure leaves no project or orphaned record
- [x] 4.9 Verify repeated imports create independent projects without changing any pre-existing project

## 5. Projects workspace

- [x] 5.1 Extend the API client with blob download, raw backup preview, import, and structured backup-error handling
- [x] 5.2 Add Import backup to the Projects command bar with file selection and accessible accepted-file guidance
- [x] 5.3 Add an icon-only Export backup action with tooltip to every project row
- [x] 5.4 Build the dedicated import preview modal with source, date, version, checksum, size, counts, warnings, and editable restored name
- [x] 5.5 Integrate the existing confirmation language before restoration and block duplicate submissions during all processing states
- [x] 5.6 Refresh and open the restored project after success while preserving file and preview context after recoverable failures
- [x] 5.7 Style import and export states for both themes, desktop, tablet, mobile, zoom, keyboard, and reduced motion
- [x] 5.8 Verify selection, cancellation, download, preview, confirmation, success, and each error category in the browser

## 6. Documentation and operations

- [x] 6.1 Document endpoints, MIME, contract versioning, size limit, error categories, and non-destructive restore behavior
- [x] 6.2 Document exactly which project data is included and which private or global data is excluded
- [x] 6.3 Add an operator procedure for creating, naming, storing, checking, and restoring `.qabase` files safely
- [x] 6.4 Record that backups are not encrypted and recommend protected offline storage
- [x] 6.5 Add automatic full-instance rotating backup as a separately scoped follow-up in the product backlog

## 7. End-to-end verification

- [x] 7.1 Add a backup smoke suite covering export, preview, import, corruption, version, structure, limit, repeated import, and rollback
- [x] 7.2 Run the representative export-import-export round trip and compare normalized functional payloads
- [x] 7.3 Run database integrity checks and all existing authentication, repository, planning, execution, validation, demand, notes, notification, and third-party smoke suites
- [x] 7.4 Run the frontend production build and verify no new runtime, accessibility, or console errors
- [x] 7.5 Validate the complete workflow visually in light and dark themes across supported viewport sizes
- [x] 7.6 Validate the OpenSpec change strictly and record final verification evidence
