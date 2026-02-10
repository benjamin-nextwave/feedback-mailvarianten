# Project Research Summary

**Project:** NextWave Solutions — Client Email Feedback Platform
**Domain:** Client email feedback platform for cold email agency
**Researched:** 2026-02-10
**Overall Confidence:** MEDIUM-HIGH

## Executive Summary

Cold email agencies need a specialized tool to collect structured client feedback on email variants before campaigns launch. This platform sits in a niche between overly complex project management tools and generic form builders—it must be trivially easy for clients to provide feedback and trivially easy for agencies to act on it.

The recommended approach combines Next.js 15 App Router with Supabase for a server-first architecture that leverages Row Level Security (RLS) as the security boundary. The key architectural insight is the dual authentication model: agency dashboard requires authentication while public feedback forms operate anonymously. This split dictates the entire data access pattern and is the critical design decision that everything else flows from.

The highest risks center on RLS policy misconfiguration (could leak client data or block legitimate submissions), lack of rate limiting (public forms are spam magnets), and form mutability (editing forms after feedback is submitted makes historical data meaningless). These must be addressed in Phase 1—they cannot be retrofitted. Secondary risks include improper Supabase client initialization patterns and Server/Client component boundary confusion, both of which lead to memory leaks and poor performance.

## Key Findings

### Recommended Stack

**Core Technologies:**
- **Next.js 15.x (App Router)** — Server Components for optimal performance, built-in API routes, Vercel deployment integration
- **TypeScript 5.x** — Type safety with excellent Supabase type generation support
- **Tailwind CSS 4.x** — Rapid UI development with utility-first approach
- **Supabase (v2 client)** — PostgreSQL + RLS + auth in one package, handles security at database level
- **React 19.x** — Ships with Next.js 15, Server Components support

**Supporting Libraries:**
- `@supabase/ssr 0.5.x` — Critical for proper server/client Supabase setup with cookie-based auth
- `sonner 2.x` — Lightweight toast notifications
- `slugify 1.6.x` + `nanoid 5.x` — Human-readable unique form URLs
- `clsx 2.x` + `tailwind-merge 2.x` — Conditional Tailwind class handling

**What NOT to use:**
- Prisma (adds unnecessary ORM layer over Supabase)
- NextAuth.js (overkill for Supabase-only auth)
- Heavy form libraries like Formik or React Hook Form (native Server Actions sufficient)
- `@supabase/auth-helpers-nextjs` (deprecated, replaced by @supabase/ssr)

### Expected Features

**Table Stakes (MVP - Phase 1):**
- Side-by-side variant display with clear visual distinction
- Per-variant text feedback input
- Mobile-responsive layout
- Form validation with clear error states
- Submission confirmation and read-only post-submission view
- Basic agency branding
- Loading states for multi-variant forms
- Accessible color contrast (WCAG AA minimum)

**Differentiators (Phase 2):**
- Rating scales per variant (structured quantitative data)
- Email sequence context display (critical for cold email—follow-ups need context)
- Suggested feedback prompts (guide clients away from "looks good!" responses)
- Progress indication for multi-variant forms
- Character count indicators (cold emails have brevity constraints)

**Defer to Phase 3:**
- Variant comparison matrix (post-submission dashboard)
- Inline HTML email rendering (plain text may suffice initially)
- Side-by-side A/B toggle for subtle differences
- Export feedback as PDF

**Anti-Features (Never Build):**
- Multi-user collaboration (conflicts with single-account constraint)
- Role-based access control (kills simplicity)
- In-app messaging/chat (feedback is async, not real-time)
- Version control for forms (forms are immutable after creation)
- Custom form builder (fixed structure optimized for email variants)
- File uploads from clients (text feedback only, avoid storage/security complexity)

### Architecture Approach

**Pattern: Hybrid Server-First with Dual Auth Context**

The application uses a split authentication model that dictates all data access patterns:
1. **Agency dashboard:** Authenticated users via Supabase Auth (cookie-based sessions)
2. **Public feedback forms:** Anonymous access with anon key (no authentication)

**Critical Architectural Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering Strategy | Server Components default | SEO for public forms, performance, security |
| Data Fetching | Server-side with Supabase | RLS enforced at database, no client exposure |
| Auth Pattern | Dual Supabase client (server + browser) | Server for dashboard, browser for public forms |
| State Management | React Server Components + URL state | Minimize client JS, leverage platform |
| API Layer | Server Actions + Route Handlers | Server Actions for mutations, Route Handlers for webhooks |

**Data Flow Patterns:**
```
Dashboard:
  User → Server Component → createServerClient (cookies) → RLS filters by user_id → Database

Public Form:
  Client → Server Component → createBrowserClient (anon key) → RLS allows public read → Database
```

**Component Boundaries:**
- Server Components for data display (dashboard lists, form detail pages, public form initial render)
- Client Components ONLY for interactivity (form inputs, ratings, submission buttons)
- Server Actions for all mutations (create form, submit feedback, delete form)

**Build Order (Dependency-Driven):**
1. **Phase 1 Foundation:** Database schema + RLS policies → Supabase clients → TypeScript types
2. **Phase 2 Auth:** Login page → Auth middleware → Protected dashboard routes
3. **Phase 3 Dashboard Read:** Dashboard home (list forms) → Form detail page (view feedback)
4. **Phase 4 Dashboard Write:** Create form page → Server Actions for form creation
5. **Phase 5 Public Form:** Public form page → Feedback submission → Thank-you state
6. **Phase 6 Polish:** Export CSV, form status toggle, delete forms

### Critical Pitfalls

**Top 5 Mistakes That Cause Rewrites:**

1. **RLS Policies Wrong for Anonymous Access (CRITICAL - Phase 1)**
   - **Problem:** Policies use `auth.uid()` which returns NULL for anonymous users, blocking legitimate feedback submissions OR allowing data leaks
   - **Prevention:** Test RLS policies with anonymous Supabase client before any public deployment. Use `WITH CHECK (true)` for feedback inserts, ensure feedback reads require form ownership
   - **Detection:** "Row-level security policy violated" errors when clients try to submit feedback

2. **No Rate Limiting on Public Forms (CRITICAL - Phase 2)**
   - **Problem:** Public forms get spammed within hours of launch, database fills with junk, costs explode
   - **Prevention:** Implement IP-based rate limiting (5 submissions per hour per IP) using Upstash Redis or Vercel Edge Config BEFORE sharing any form publicly
   - **Detection:** Sudden spike in database writes, many submissions from same IP

3. **Form Mutability Breaking Historical Data (CRITICAL - Phase 1)**
   - **Problem:** Editing email variants after feedback submitted makes responses meaningless
   - **Prevention:** Forms and variants are IMMUTABLE after creation. Deletion requires confirmation and checks for existing feedback. Use soft deletes (is_archived flag) instead of hard deletes
   - **Detection:** Feedback references missing variant IDs, client complaints about inconsistent data

4. **Wrong Supabase Client Initialization (CRITICAL - Phase 1)**
   - **Problem:** Creating new client on every render causes memory leaks, stale connections, auth bugs
   - **Prevention:** Use `@supabase/ssr` package correctly: `createServerClient` for dashboard Server Components (with cookie handling), `createBrowserClient` wrapped in `useMemo` for Client Components
   - **Detection:** Memory usage grows over time, "too many connections" errors, auth state doesn't persist

5. **No Input Validation on Public Routes (HIGH - Phase 1/2)**
   - **Problem:** Malicious input causes crashes, injection attacks, or corrupt data
   - **Prevention:** Use Zod for runtime validation on ALL public inputs (rating, comment, email). Validate BEFORE database interaction. Sanitize HTML output with DOMPurify
   - **Detection:** Type errors in production logs, unexpected database values, 500 errors on submission

**Additional High-Priority Pitfalls:**

6. **Server/Client Component Boundary Confusion (Phase 1)**
   - Mixing server-only code in client components exposes secrets
   - Adding 'use client' unnecessarily breaks Server Component streaming
   - Solution: Default to Server Components, add 'use client' only for interactivity

7. **N+1 Query Problem (Phase 1)**
   - Fetching form, then looping variants to fetch feedback causes slow page loads
   - Solution: Use nested Supabase select with joins: `forms.select('*, email_variants(*, feedback_responses(*))')`

8. **Missing Database Indexes (Phase 1)**
   - Queries on `form_id`, `variant_id`, `slug` are slow without indexes
   - Solution: Create indexes on foreign keys and lookup columns before production data

9. **No CSRF Protection (Phase 2)**
   - Attackers can submit feedback from external sites
   - Solution: Check `origin` header in API routes or use Server Actions (automatic CSRF protection)

10. **Trusting Client-Provided IDs (Phase 1)**
    - Client sends `form_id` in request, attacker changes to access other forms
    - Solution: Look up form by public `slug`, use server-side ID for database operations

## Implications for Roadmap

### Suggested Phase Structure

The research findings strongly suggest a 6-phase approach driven by architectural dependencies and risk mitigation:

**Phase 1: Foundation (Database + Auth Setup)**
- **Rationale:** RLS policies and Supabase client patterns MUST be correct before building anything else. These cannot be retrofitted—mistakes here cause rewrites.
- **Delivers:** Working Supabase connection, RLS policies tested with both auth contexts, TypeScript types generated from schema
- **Critical Decisions:** Immutable forms enforced in schema, dual client pattern implemented correctly, indexes created
- **Features:** Database schema, RLS policies, Supabase server/client setup, TypeScript types
- **Pitfalls to Avoid:** Wrong RLS policies, improper client initialization, missing indexes
- **Research Flag:** SKIP—database design patterns are well-documented, no additional research needed

**Phase 2: Authentication Gateway**
- **Rationale:** Dashboard requires auth before any features can be built. Simple login flow, no complexity.
- **Delivers:** Working login, protected dashboard routes, session persistence
- **Features:** Login page, auth middleware, protected route redirects
- **Pitfalls to Avoid:** Cookie persistence issues in middleware, service role key exposure
- **Research Flag:** SKIP—Supabase auth patterns are standard

**Phase 3: Dashboard Read Operations**
- **Rationale:** View-only functionality is safer to build first (no data mutation risks). Validates RLS policies work correctly for authenticated users.
- **Delivers:** Can view forms list and feedback (read-only dashboard)
- **Features:** Dashboard home (forms list), form detail page (view feedback + variants)
- **Pitfalls to Avoid:** N+1 query problem, mixing Server/Client components incorrectly
- **Research Flag:** SKIP—standard CRUD patterns

**Phase 4: Dashboard Write Operations**
- **Rationale:** Add form creation capability. Requires Server Actions for mutations.
- **Delivers:** End-to-end form creation flow (create form → add variants → get public URL)
- **Features:** Create form page with form builder, Server Action to save form + variants, slug generation
- **Pitfalls to Avoid:** No validation on inputs, forms not truly immutable, deletion without confirmation
- **Research Flag:** SKIP—Server Actions are standard Next.js patterns

**Phase 5: Public Feedback Form (Core Value)**
- **Rationale:** This is the actual product—enables clients to submit feedback. Must add rate limiting BEFORE any public sharing.
- **Delivers:** End-to-end public feedback flow (view form → submit feedback → see thank-you)
- **Features:** Public form page, feedback submission, rate limiting (IP-based), thank-you state, read-only post-submission view
- **Pitfalls to Avoid:** No rate limiting = spam attack, no input validation, unclear submission confirmation
- **Research Flag:** CONSIDER—Research best practices for rate limiting implementation (Upstash Redis vs Vercel Edge Config vs database-level)

**Phase 6: Polish + Differentiators**
- **Rationale:** Core loop works, now add UX polish and features that improve feedback quality.
- **Delivers:** Production-ready platform with quality-of-life improvements
- **Features:** Rating scales per variant, email sequence context, suggested prompts, progress indicators, character counts, export to CSV, form status toggle
- **Pitfalls to Avoid:** Over-engineering differentiators, adding features without user validation
- **Research Flag:** SKIP—these are incremental UX improvements

### Phase Ordering Rationale

**Why Foundation First:**
- RLS policies affect every subsequent feature—must be correct from day 1
- Supabase client patterns are hard to refactor once components are built around them
- Database schema changes are expensive after production data exists

**Why Auth Before Dashboard:**
- Can't build dashboard features without auth protecting them
- Auth middleware affects routing and cookie handling

**Why Read Before Write:**
- Safer to validate RLS policies work correctly with read-only operations first
- Write operations introduce more pitfalls (validation, rate limiting, idempotency)

**Why Public Form Last (Before Polish):**
- Requires rate limiting to prevent spam (adds complexity)
- Benefits from validated RLS policies and Server Action patterns from dashboard phases
- Represents highest risk (public access = attack vector)

**Why Polish Comes Last:**
- Differentiators don't matter if core loop is broken
- Features like rating scales and export are iterative improvements
- Can be validated with real users after MVP launches

### Research Flags

**Phases Needing Deeper Research:**

- **Phase 5 (Public Form):** Rate limiting implementation patterns
  - Question: Upstash Redis vs Vercel Edge Config vs database triggers?
  - Confidence: MEDIUM—implementation details vary by infrastructure
  - Decision Point: Before public launch

- **Phase 6 (Polish):** Email rendering approach
  - Question: Full HTML email preview vs plain text with formatting?
  - Confidence: LOW—depends on user testing
  - Decision Point: After MVP validates core value

**Phases with Standard Patterns (Skip Research):**

- **Phase 1 (Foundation):** Database design, RLS patterns, Supabase setup
  - Confidence: HIGH—well-documented in official docs

- **Phase 2 (Auth):** Login flow, middleware, session management
  - Confidence: HIGH—Supabase auth is standard

- **Phase 3 (Dashboard Read):** Server Components, data fetching, nested selects
  - Confidence: HIGH—Next.js App Router patterns are mature

- **Phase 4 (Dashboard Write):** Server Actions, form handling, validation
  - Confidence: HIGH—standard CRUD operations

## Confidence Assessment

| Area | Confidence | Rationale | Gaps |
|------|------------|-----------|------|
| **Stack** | HIGH | Training data for Next.js 15 + Supabase v2 is comprehensive through Jan 2025 | Specific API signatures may have changed in 2026 |
| **Features** | MEDIUM | Based on industry patterns for feedback tools, but no competitive validation (WebSearch unavailable) | Market differentiation claims unverified, need user testing to validate differentiators |
| **Architecture** | MEDIUM-HIGH | Server Components + RLS patterns are well-established, but not verified against current 2026 docs | Supabase SSR package API may have evolved, middleware cookie handling should be validated |
| **Pitfalls** | HIGH | RLS mistakes, rate limiting needs, and validation requirements are universal patterns | Specific Vercel serverless limits may have changed |

**Overall Confidence: MEDIUM-HIGH**

The recommended stack and architecture are built on solid foundations (Next.js App Router + Supabase is a proven pattern). The main limitation is inability to verify against current 2026 documentation—API signatures and best practices may have evolved since training data cutoff (Jan 2025).

### Gaps Requiring Validation

**Before Phase 1 Implementation:**
1. Verify `@supabase/ssr` package API for `createServerClient` and `createBrowserClient` signatures
2. Check Next.js 15 Server Actions patterns (may have updates)
3. Confirm Vercel serverless function limits (timeout, connection pooling)

**Before Phase 5 Launch:**
4. Research current rate limiting best practices for Next.js (Upstash Redis vs alternatives)
5. Validate CSP and CORS header requirements for public forms

**Phase 6 Decisions:**
6. Test email rendering approaches (HTML preview vs plain text) with real users
7. Validate rating scale patterns (stars vs numeric vs emoji)

## Sources

**Note:** Web research tools were unavailable. This synthesis is based on:

- **STACK.md:** Next.js official docs, Supabase official docs, Tailwind CSS docs, Vercel deployment docs (training data through Jan 2025)
- **FEATURES.md:** Industry patterns for feedback/review platforms, cold email workflow knowledge, project constraints
- **ARCHITECTURE.md:** Next.js App Router patterns, Supabase RLS patterns, standard web app architecture principles (training data through Jan 2025)
- **PITFALLS.md:** Common Next.js + Supabase mistakes, serverless deployment pitfalls, public form security patterns (training data through Jan 2025)

**Recommended Validation Sources (for implementation team):**
- Next.js official docs: https://nextjs.org/docs (verify App Router patterns)
- Supabase official docs: https://supabase.com/docs/guides/auth/row-level-security (verify RLS patterns)
- Supabase + Next.js integration guide: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Vercel deployment best practices: https://vercel.com/docs/frameworks/nextjs

---

**Research Status:** COMPLETE
**Ready for Roadmap:** YES
**Blockers:** None—sufficient confidence to proceed with requirements definition
**Next Step:** Orchestrator can proceed to roadmap creation using these findings
