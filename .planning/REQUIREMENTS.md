# Requirements: NextWave Solutions — Client Email Feedback Platform

**Defined:** 2026-02-10
**Core Value:** Clients can review email variants and submit feedback through a simple, professional public form — the feedback loop between agency and client must be frictionless.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Database

- [ ] **DB-01**: Supabase schema with forms table (id, client_name, slug, status, webhook_url, created_at, updated_at)
- [ ] **DB-02**: Supabase schema with email_variants table (id, form_id FK, email_type, variant_number, subject_line, email_body, sort_order, created_at)
- [ ] **DB-03**: Supabase schema with feedback_responses table (id, form_id FK, variant_id FK, feedback_text, submitted_at)
- [ ] **DB-04**: RLS policies allowing authenticated users full access for dashboard operations
- [ ] **DB-05**: RLS policies allowing anonymous SELECT on forms and email_variants filtered by slug
- [ ] **DB-06**: RLS policy allowing anonymous INSERT on feedback_responses
- [ ] **DB-07**: Migration SQL file(s) in /supabase/migrations/

### Dashboard

- [ ] **DASH-01**: Dashboard home page listing all forms in a table with columns: Klantnaam, Aangemaakt op, Status badge (Openstaand/Ingeleverd), Deelbare link, Acties
- [ ] **DASH-02**: Clickable/copy-able public URL for each form in the list
- [ ] **DASH-03**: Form creation page with Klantnaam (required), Webhook URL (optional), and Eerste mail variants (1-5)
- [ ] **DASH-04**: Optional Opvolgmail 1 toggle on creation page with variant count and subject/body fields
- [ ] **DASH-05**: Optional Opvolgmail 2 toggle on creation page (only if Opvolgmail 1 enabled) with variant count and subject/body fields
- [ ] **DASH-06**: Auto-generated human-friendly slug from client name + short random string on form creation
- [ ] **DASH-07**: Form detail page showing client name, creation date, status, and shareable link
- [ ] **DASH-08**: Form detail page showing all email variants grouped by type (Eerste mail, Opvolgmail 1, Opvolgmail 2)
- [ ] **DASH-09**: Form detail page showing feedback text in green-highlighted card per variant, or gray "Nog geen feedback ontvangen" placeholder
- [ ] **DASH-10**: Delete form action with Dutch confirmation modal

### Public Form

- [ ] **FORM-01**: Public feedback page at /feedback/[slug] accessible without authentication
- [ ] **FORM-02**: Header showing "Invulformulier voor [Klantnaam]" with NextWave Solutions text branding
- [ ] **FORM-03**: Intro text "Hieronder vind je de e-mailvarianten die wij voor je hebben opgesteld. Laat per variant je feedback achter."
- [ ] **FORM-04**: Email variants displayed in cards grouped by type with section headers (Eerste mail, Opvolgmail 1, Opvolgmail 2)
- [ ] **FORM-05**: Each variant card shows "Variant [number]" label, subject line, and email body in email-style preview
- [ ] **FORM-06**: Per-variant feedback textarea labeled "Jouw feedback" with placeholder "Schrijf hier je feedback over deze variant..."
- [ ] **FORM-07**: Submit button "Feedback versturen" at the bottom
- [ ] **FORM-08**: Validation requiring at least one feedback field filled with Dutch error message
- [ ] **FORM-09**: Save all non-empty feedback entries to feedback_responses and update form status to 'completed' on submit
- [ ] **FORM-10**: Fire-and-forget webhook POST with JSON payload (form_id, client_name, slug, submitted_at, feedback_count, responses array)
- [ ] **FORM-11**: Success message "Bedankt! Je feedback is succesvol verstuurd." after submission
- [ ] **FORM-12**: Read-only view showing previously submitted feedback when client revisits (no re-submission)

### Design

- [ ] **UI-01**: Light professional theme — white (#FFFFFF) / light gray (#F9FAFB) backgrounds, blue primary (#2563EB), green success (#16A34A), amber pending (#F59E0B)
- [ ] **UI-02**: All UI text, labels, buttons, placeholders, and messages in Dutch (Netherlands)
- [ ] **UI-03**: Cards with subtle shadows and rounded corners
- [ ] **UI-04**: Clean typography with adequate spacing and visual hierarchy

### Infrastructure

- [ ] **INFRA-01**: .env.example file with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- [ ] **INFRA-02**: Deployable to Vercel with zero additional configuration beyond environment variables

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-01**: Email/password login page at /login via Supabase Auth
- **AUTH-02**: Protect all /dashboard routes — redirect to /login if unauthenticated
- **AUTH-03**: Middleware-based auth check for dashboard routes

### UX Polish

- **UX-01**: Responsive design — mobile-friendly layout especially for public form
- **UX-02**: Toast notifications for actions (copy link, form created, feedback submitted)
- **UX-03**: Loading states and smooth transitions throughout
- **UX-04**: Checkmark animation on successful submission

### Differentiators

- **DIFF-01**: Rating scales per variant for structured quantitative feedback
- **DIFF-02**: Suggested feedback prompts to guide client responses
- **DIFF-03**: Export feedback as PDF

## Out of Scope

| Feature | Reason |
|---------|--------|
| Dark mode / dark theme | Light only per design requirement |
| Multi-user / team management | Single agency account, keeps auth simple |
| Form editing after creation | Forms immutable — prevents data integrity issues with feedback |
| Re-submission of feedback | Read-only after first submit — prevents confusion |
| Logo / image assets | Text-only branding for now |
| Email sending | Feedback collection only, not an email sender |
| OAuth / social login | Email/password only (deferred to v2) |
| File uploads from clients | Text feedback only, avoids storage/security complexity |
| In-app messaging/chat | Feedback is async, not real-time |
| Custom form builder | Fixed structure optimized for email variants |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (populated during roadmap creation) | | |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 0
- Unmapped: 33

---
*Requirements defined: 2026-02-10*
*Last updated: 2026-02-10 after initial definition*
