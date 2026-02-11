---
phase: 03-dashboard-form-detail
plan: 01
subsystem: dashboard
tags: [form-detail, server-component, nested-query, feedback-display]
dependency_graph:
  requires:
    - 02-01 (dashboard home with forms table and navigation)
    - 01-02 (design system with Card, StatusBadge, PageHeader components)
    - 01-01 (Supabase client, database types, utility functions)
  provides:
    - Form detail page at /dashboard/[id] with variant grouping
    - Feedback display system with green/gray visual states
    - Loading and 404 states for dynamic route
  affects:
    - Dashboard navigation flow (Bekijken button now functional)
tech_stack:
  added: []
  patterns:
    - Nested Supabase query with joins (forms -> email_variants -> feedback_responses)
    - Type-safe grouping by enum with Record<EmailType, Variant[]>
    - Dynamic route with awaited params (Next.js 15)
    - notFound() error handling for invalid IDs
key_files:
  created:
    - src/app/dashboard/[id]/page.tsx (180 lines - form detail with nested data and variant grouping)
    - src/app/dashboard/[id]/loading.tsx (94 lines - content-shaped skeleton)
    - src/app/dashboard/[id]/not-found.tsx (17 lines - Dutch 404 page)
  modified: []
key_decisions:
  - decision: Single nested Supabase query for all data
    rationale: Minimize round trips, leverage Supabase joins for efficient data fetch
    alternatives: ["Separate queries for variants and feedback", "Client-side data fetching"]
    impact: Faster page loads, simpler data flow
  - decision: Group variants by email_type using Array.reduce
    rationale: Display variants in logical sections matching Dutch email workflow
    alternatives: ["Flat list with type labels", "Tabs for each email type"]
    impact: Clear visual hierarchy, matches agency mental model
  - decision: Green/gray visual distinction for feedback states
    rationale: Instant visual feedback on which variants have responses
    alternatives: ["Text-only indicators", "Icon badges"]
    impact: Faster information scanning for agency users
metrics:
  duration_minutes: 4
  started: "2026-02-11T04:57:12Z"
  completed: "2026-02-11T05:01:03Z"
---

# Phase 3 Plan 1: Form Detail Page Summary

**One-liner:** Form detail page with nested Supabase query, variant grouping by email type (Eerste mail, Opvolgmail 1, Opvolgmail 2), and green-highlighted feedback cards with gray placeholders.

## Performance

- **Duration:** 4 minutes (started 2026-02-11T04:57:12Z, completed 2026-02-11T05:01:03Z)
- **Tasks completed:** 2/2
- **Files created:** 3
- **Commits:** 2

## Accomplishments

### Task 1: Form Detail Page with Nested Data and Feedback Display
Created `src/app/dashboard/[id]/page.tsx` as an async Server Component with:
- Single nested Supabase query fetching forms, email_variants, and feedback_responses in one call
- Type-safe data structures with inline types matching database schema
- Variant grouping by `email_type` using `Array.reduce()` into typed Record
- Dutch section headers (Eerste mail, Opvolgmail 1, Opvolgmail 2) with EMAIL_TYPE_LABELS constant
- Feedback display logic: green cards (bg-green-50, border-green-200) when present, gray placeholder when absent
- Back navigation with ArrowLeft icon to /dashboard
- PageHeader with client name, formatted date, and StatusBadge
- Metadata card showing status, creation date, and shareable link with CopyLinkButton
- notFound() handling for invalid form IDs

### Task 2: Loading and Error States
Created supporting route files:
- `loading.tsx`: Content-shaped skeleton matching detail page layout with header, metadata card, and variant section skeletons
- `not-found.tsx`: Dutch 404 page with centered layout, clear messaging, and back-to-dashboard button

## Task Commits

| Task | Commit | Description | Files |
|------|--------|-------------|-------|
| 1 | fad94e7 | feat(03-01): implement form detail page with variant grouping and feedback display | src/app/dashboard/[id]/page.tsx |
| 2 | 373eaa3 | feat(03-01): add loading skeleton and 404 page for form detail | src/app/dashboard/[id]/loading.tsx, src/app/dashboard/[id]/not-found.tsx |

## Files Created/Modified

### Created
1. **src/app/dashboard/[id]/page.tsx** (180 lines)
   - Async Server Component with nested Supabase query
   - FormWithVariantsAndFeedback type with nested feedback_responses
   - EMAIL_TYPE_LABELS and EMAIL_TYPE_ORDER constants for Dutch display
   - Variant grouping logic using reduce
   - Conditional feedback rendering (green cards vs gray placeholder)
   - Imports: createClient, notFound, Link, ArrowLeft, PageHeader, StatusBadge, Card components, CopyLinkButton, formatDate, generatePublicUrl

2. **src/app/dashboard/[id]/loading.tsx** (94 lines)
   - Skeleton components matching page structure
   - Back link, header, metadata card, and variant section skeletons
   - Uses Skeleton, Card, CardContent, CardHeader

3. **src/app/dashboard/[id]/not-found.tsx** (17 lines)
   - Centered 404 layout with min-h-[50vh]
   - Dutch heading "Formulier niet gevonden"
   - Back button to /dashboard

## Decisions Made

**Decision 1: Single nested query vs multiple queries**
- Chose single nested query with joins
- Rationale: Fewer round trips to database, better performance, simpler data flow
- Pattern: `.select('...forms, email_variants(...), feedback_responses(...)')` with referencedTable ordering
- Alternative considered: Separate queries would add latency and complexity

**Decision 2: Variant grouping by email_type**
- Grouped variants using Array.reduce into Record<EmailType, EmailVariantData[]>
- Display sections only for types that have variants (skip empty groups)
- Rationale: Matches agency workflow (Eerste mail → Opvolgmail 1 → Opvolgmail 2)
- Alternative considered: Flat list would lose logical grouping

**Decision 3: Visual feedback states**
- Green cards (bg-green-50, border-green-200) for submitted feedback
- Gray cards (bg-gray-50, border-gray-200) for "Nog geen feedback ontvangen"
- Rationale: Instant visual scanning of which variants have responses
- Alternative considered: Text-only would be less scannable

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript compilation and Next.js build succeeded on first attempt.

## Next Phase Readiness

**Phase 3 Status:** Complete (1/1 plans finished)

**Blockers:** None

**Ready for Phase 4:** Yes
- Form detail page fully functional with all data display requirements met
- Navigation from dashboard home to detail page works correctly
- Loading and error states implemented
- All must-have truths satisfied (client info, variant grouping, feedback display, 404 handling)

**Next Phase Preview:** Phase 4 will likely build the public feedback form at /feedback/[slug] that clients use to submit feedback on variants.

## Self-Check: PASSED

✓ File exists: src/app/dashboard/[id]/page.tsx
✓ File exists: src/app/dashboard/[id]/loading.tsx
✓ Commits found: 2 commits with "03-01" prefix
✓ TypeScript compilation: No errors
✓ Next.js build: Successful
✓ Routes registered: /dashboard/[id] appears in build output
