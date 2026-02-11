# NextWave Solutions — Client Email Feedback Platform

## What This Is

A full-stack web application for NextWave Solutions, a cold email agency. The platform lets the agency create email feedback forms for their clients. Each client receives a unique public URL where they can review email copy variants (initial email + follow-ups) and submit per-variant feedback. The agency manages all forms and reviews feedback from a protected dashboard. All UI text is in Dutch (Netherlands); codebase in English. Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Supabase.

## Core Value

Clients can review email variants and submit feedback through a simple, professional public form — the feedback loop between agency and client must be frictionless.

## Requirements

### Validated

- ✓ Supabase database with forms, email_variants, and feedback_responses tables — v1.0
- ✓ RLS policies for authenticated dashboard access and anonymous public form access — v1.0
- ✓ Dashboard home listing all forms with status badges, shareable links, and delete action — v1.0
- ✓ Form creation page with client name, optional webhook URL, and email variants (initial + up to 2 follow-ups) — v1.0
- ✓ Form detail page showing variants grouped by type with feedback display — v1.0
- ✓ Public feedback form at /feedback/[slug] — no auth required — v1.0
- ✓ Feedback submission saving responses and updating form status to completed — v1.0
- ✓ Fire-and-forget webhook POST on feedback submission (if configured) — v1.0
- ✓ Read-only view when client revisits after submitting — v1.0
- ✓ Light, clean, professional UI with Dutch labels throughout — v1.0
- ✓ Delete confirmation modal (Dutch) — v1.0
- ✓ Deployable to Vercel with env vars only — v1.0
- ✓ Auth middleware and login page for dashboard access — v1.0

### Active

- [ ] Responsive design — mobile-friendly layout especially for public form
- [ ] Toast notifications for user actions (copy link, form created, feedback submitted)
- [ ] Loading states and smooth transitions throughout
- [ ] Email/password login page improvements (currently minimal)

### Out of Scope

- Dark mode / dark theme — light only, per design requirement
- Multi-user / team management — single agency account
- Form editing after creation — forms are immutable (view/delete only)
- Re-submission of feedback — read-only after first submit
- Logo / image assets — text-only branding for now
- Email sending — this is feedback collection only, not an email sender
- OAuth / social login — email/password only
- Offline mode — real-time data flow is core to the platform

## Context

Shipped v1.0 with 3,126 LOC TypeScript across 70 files.
Tech stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL + Auth + RLS).
All 35 v1 requirements delivered in 5 phases over 2 days (0.91 hours execution time).
Platform is functional end-to-end: create forms → share link → collect feedback → view results.

**Known issues:**
- Homepage (/) has stale webpack error (design system showcase, not user-facing)
- Redirect after form creation shows brief error toast (form created successfully)
- Type assertions needed for Supabase SSR operations (upstream typing issue)

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
| Forms are immutable after creation | Simplifies data integrity — no version conflicts with feedback | ✓ Good — clean data model, no edge cases |
| Single account, no user management | Small team, keeps auth simple | ✓ Good — fast to ship, sufficient for MVP |
| Client sees read-only view after submission | Prevents confusion from multiple submissions | ✓ Good — clear UX, prevents data issues |
| Fire-and-forget webhook | Don't block UX on external service reliability | ✓ Good — responsive UX, webhook fires reliably |
| Text-only branding | No logo available yet, can add later | ✓ Good — professional look without assets |
| Delete requires confirmation modal | Prevent accidental data loss | ✓ Good — AlertDialog with Dutch text, accessible |
| Use @supabase/ssr for auth | Official Next.js 15 compatibility with async cookies | ✓ Good — works well with Server Components |
| shadcn/ui new-york style | Polished professional look for agency tool | ✓ Good — clean, consistent design system |
| Dutch enum values for email_type | Aligns with Dutch UI language | ✓ Good — domain terms match UI naturally |
| Zod superRefine for conditional validation | Flexible for opvolgmail dependencies | ✓ Good — clean validation with Dutch errors |
| Type assertions for Supabase SSR | Known upstream typing issue with strict TS | ⚠️ Revisit — when Supabase fixes SSR types |

---
*Last updated: 2026-02-11 after v1.0 milestone*
