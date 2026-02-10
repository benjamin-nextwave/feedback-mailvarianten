# NextWave Solutions — Client Email Feedback Platform

## What This Is

A full-stack web application for NextWave Solutions, a cold email agency. The platform lets the agency create email feedback forms for their clients. Each client receives a unique public URL where they can review email copy variants (initial email + follow-ups) and submit per-variant feedback. The agency manages all forms and reviews feedback from a protected dashboard. All UI text is in Dutch (Netherlands); codebase in English.

## Core Value

Clients can review email variants and submit feedback through a simple, professional public form — the feedback loop between agency and client must be frictionless.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Supabase database with forms, email_variants, and feedback_responses tables
- [ ] RLS policies for authenticated dashboard access and anonymous public form access
- [ ] Dashboard login with Supabase Auth (single email/password account)
- [ ] Dashboard home listing all forms with status badges, shareable links, and delete action
- [ ] Form creation page with client name, optional webhook URL, and email variants (initial + up to 2 follow-ups)
- [ ] Form detail page showing variants grouped by type with feedback display
- [ ] Public feedback form at /feedback/[slug] — no auth required
- [ ] Feedback submission saving responses and updating form status to completed
- [ ] Fire-and-forget webhook POST on feedback submission (if configured)
- [ ] Read-only view when client revisits after submitting
- [ ] Light, clean, professional UI with Dutch labels throughout
- [ ] Responsive design — mobile-friendly public form
- [ ] Toast notifications for user actions
- [ ] Delete confirmation modal (Dutch)
- [ ] Deployable to Vercel with env vars only

### Out of Scope

- Dark mode / dark theme — light only, per design requirement
- Multi-user / team management — single agency account
- Form editing after creation — forms are immutable (view/delete only)
- Re-submission of feedback — read-only after first submit
- Logo / image assets — text-only branding for now
- Email sending — this is feedback collection only, not an email sender
- OAuth / social login — email/password only

## Context

- NextWave Solutions is a cold email agency that creates email copy for clients
- Current workflow likely involves sending variants via email/doc and collecting feedback manually
- The platform replaces this with a structured, trackable feedback flow
- Clients are non-technical — the public form must be dead simple
- Agency team is small — single login account is sufficient
- Dutch language requirement applies to all user-facing text (buttons, labels, placeholders, messages)

## Constraints

- **Tech stack**: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase — non-negotiable
- **Language**: All UI text in Dutch (Netherlands), codebase/comments in English
- **Design**: Light theme only — white/light gray backgrounds, blue primary (#2563EB), green success (#16A34A), amber pending (#F59E0B)
- **Deployment**: Must deploy to Vercel with zero config beyond env vars
- **Database**: Supabase PostgreSQL with specific schema (forms, email_variants, feedback_responses)
- **Auth**: Supabase Auth email/password — dashboard only, public forms are anonymous

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Forms are immutable after creation | Simplifies data integrity — no version conflicts with feedback | — Pending |
| Single account, no user management | Small team, keeps auth simple | — Pending |
| Client sees read-only view after submission | Prevents confusion from multiple submissions | — Pending |
| Fire-and-forget webhook | Don't block UX on external service reliability | — Pending |
| Text-only branding | No logo available yet, can add later | — Pending |
| Delete requires confirmation modal | Prevent accidental data loss | — Pending |

---
*Last updated: 2026-02-10 after initialization*
