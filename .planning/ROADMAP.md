# Roadmap: NextWave Solutions — Client Email Feedback Platform

## Overview

This roadmap delivers a full-stack feedback platform in 5 phases. We start with database foundation and design system, build out the agency dashboard for viewing and creating forms, then deliver the core value with the public feedback form where clients submit feedback on email variants. Each phase delivers a complete, verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Design System** - Database schema, RLS policies, infrastructure setup, and UI design system
- [ ] **Phase 2: Dashboard Home** - Agency can view all forms in a list with status and shareable links
- [ ] **Phase 3: Dashboard Form Detail** - Agency can view individual form details with variants and feedback
- [ ] **Phase 4: Form Creation & Management** - Agency can create forms with variants and delete forms with confirmation
- [ ] **Phase 5: Public Feedback Form** - Clients can submit feedback on email variants through public URLs

## Phase Details

### Phase 1: Foundation & Design System
**Goal**: Database, RLS policies, infrastructure, and design system established for secure data access and consistent UI
**Depends on**: Nothing (first phase)
**Requirements**: DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-07, INFRA-01, INFRA-02, UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. Database tables exist with proper schema (forms, email_variants, feedback_responses)
  2. RLS policies allow authenticated users full dashboard access
  3. RLS policies allow anonymous users to read forms by slug and insert feedback
  4. Migration SQL files exist in /supabase/migrations/
  5. Environment variables are documented in .env.example
  6. Application deploys to Vercel with environment variables only
  7. Design system is established with Dutch UI components (buttons, cards, typography)
  8. Light theme colors are consistently applied throughout (blue primary, green success, amber pending)
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffolding, Supabase clients, database migration SQL with schema and RLS policies (completed 2026-02-10, 10 min)
- [x] 01-02-PLAN.md — shadcn/ui design system with theme colors and Dutch application components (completed 2026-02-10, 11 min)

### Phase 2: Dashboard Home
**Goal**: Agency can view all forms in a dashboard list with status, shareable links, and actions
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02
**Success Criteria** (what must be TRUE):
  1. Dashboard home page displays all forms in a table with Dutch column headers
  2. Each form shows Klantnaam, Aangemaakt op, Status badge (Openstaand/Ingeleverd), Deelbare link, and Acties columns
  3. Status badges display correct colors (amber for pending, green for completed)
  4. Shareable public URLs are copyable/clickable for each form
  5. Empty state displays when no forms exist
**Plans**: TBD

Plans:
- [ ] TBD (planning not started)

### Phase 3: Dashboard Form Detail
**Goal**: Agency can view individual form details including all variants and submitted feedback
**Depends on**: Phase 2
**Requirements**: DASH-07, DASH-08, DASH-09
**Success Criteria** (what must be TRUE):
  1. Form detail page displays client name, creation date, status, and shareable link
  2. Email variants are grouped by type with section headers (Eerste mail, Opvolgmail 1, Opvolgmail 2)
  3. Each variant displays subject line and email body
  4. Submitted feedback appears in green-highlighted cards under corresponding variants
  5. Variants without feedback show gray "Nog geen feedback ontvangen" placeholder
  6. Navigation from dashboard home to form detail works correctly
**Plans**: TBD

Plans:
- [ ] TBD (planning not started)

### Phase 4: Form Creation & Management
**Goal**: Agency can create new forms with email variants and delete forms with confirmation
**Depends on**: Phase 3
**Requirements**: DASH-03, DASH-04, DASH-05, DASH-06, DASH-10
**Success Criteria** (what must be TRUE):
  1. Form creation page accepts Klantnaam (required) and Webhook URL (optional)
  2. Creation page allows adding 1-5 variants for Eerste mail with subject and body fields
  3. Optional Opvolgmail 1 toggle shows variant fields when enabled
  4. Optional Opvolgmail 2 toggle shows variant fields when Opvolgmail 1 is enabled
  5. Human-friendly slug is auto-generated from client name plus random string on form creation
  6. Created forms appear immediately in dashboard home list
  7. Delete action triggers Dutch confirmation modal ("Weet je zeker dat je dit formulier wilt verwijderen?")
  8. Confirmed deletion removes form and redirects to dashboard home
**Plans**: TBD

Plans:
- [ ] TBD (planning not started)

### Phase 5: Public Feedback Form
**Goal**: Clients can submit feedback on email variants through simple, professional public forms
**Depends on**: Phase 4
**Requirements**: FORM-01, FORM-02, FORM-03, FORM-04, FORM-05, FORM-06, FORM-07, FORM-08, FORM-09, FORM-10, FORM-11, FORM-12
**Success Criteria** (what must be TRUE):
  1. Public page at /feedback/[slug] loads without authentication
  2. Header shows "Invulformulier voor [Klantnaam]" with NextWave Solutions branding
  3. Intro text explains feedback process in Dutch
  4. Email variants display in cards grouped by type with section headers
  5. Each variant card shows variant number label, subject line, and email body preview
  6. Per-variant feedback textarea labeled "Jouw feedback" with Dutch placeholder
  7. Submit button "Feedback versturen" validates that at least one feedback field is filled
  8. Validation error displays in Dutch when no feedback provided
  9. Submission saves all non-empty feedback to feedback_responses table
  10. Form status updates to 'completed' after successful submission
  11. Webhook POST fires with JSON payload if webhook URL configured (fire-and-forget)
  12. Success message "Bedankt! Je feedback is succesvol verstuurd." displays after submission
  13. Client revisiting form sees read-only view with previously submitted feedback (no re-submission)
**Plans**: TBD

Plans:
- [ ] TBD (planning not started)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Design System | 2/2 | Complete | 2026-02-10 |
| 2. Dashboard Home | 0/TBD | Not started | - |
| 3. Dashboard Form Detail | 0/TBD | Not started | - |
| 4. Form Creation & Management | 0/TBD | Not started | - |
| 5. Public Feedback Form | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-10*
*Last updated: 2026-02-10 after completing plan 01-02 (Phase 1 complete)*
