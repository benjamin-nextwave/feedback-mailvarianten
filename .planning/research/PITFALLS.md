# Domain Pitfalls: Next.js + Supabase Feedback Form Platform

**Domain:** Client email feedback platform (Next.js App Router + Supabase)
**Researched:** 2026-02-10
**Confidence:** MEDIUM (based on training data, unable to verify with current documentation)

**Note:** Web research tools unavailable. Findings based on training data for Next.js 13+ App Router + Supabase patterns. Recommend validating critical security findings against current Supabase and Next.js documentation.

---

## Critical Pitfalls

Mistakes that cause rewrites, security breaches, or major production issues.

### Pitfall 1: RLS Policies Don't Match Intent (Public Form Access)

**What goes wrong:** Anonymous users can read/modify data they shouldn't access, or legitimate users can't submit feedback.

**Why it happens:**
- RLS policies written for authenticated users, forgetting anonymous access needs
- Policies use `auth.uid()` which returns NULL for anonymous users
- Misunderstanding `anon` key vs `service_role` key permissions
- Policy testing done while authenticated, missing anonymous edge cases

**Consequences:**
- Security breach: Users access other clients' forms/feedback
- Forms appear broken: Anonymous users get "permission denied" errors
- Data leaks: Feedback responses exposed to wrong clients

**Prevention:**
```sql
-- WRONG: This blocks anonymous users
CREATE POLICY "Users can view forms"
ON forms FOR SELECT
USING (auth.uid() = user_id);

-- RIGHT: Anonymous can view by slug
CREATE POLICY "Public can view published forms"
ON forms FOR SELECT
USING (is_published = true);

-- RIGHT: Anonymous can insert feedback
CREATE POLICY "Anyone can submit feedback"
ON feedback_responses FOR INSERT
WITH CHECK (true);

-- CRITICAL: Prevent anonymous users from reading feedback
CREATE POLICY "Only owner reads feedback"
ON feedback_responses FOR SELECT
USING (auth.uid() = (SELECT user_id FROM forms WHERE forms.id = form_id));
```

**Detection (warning signs):**
- "New row violates row-level security policy" errors in production
- Forms work in development (with auth) but fail when shared publicly
- Feedback submissions return 403 errors
- Other clients' data visible in Network tab

**Phase mapping:** Phase 1 (Foundation) — RLS must be correct before any public deployment

---

### Pitfall 2: Supabase Client Initialization Pattern Wrong

**What goes wrong:** Client created incorrectly causes memory leaks, stale connections, or auth state bugs.

**Why it happens:**
- Creating new Supabase client on every request/component render
- Mixing server-side and client-side client creation patterns
- Not using `createServerClient` vs `createBrowserClient` correctly
- Singleton pattern implemented incorrectly for App Router

**Consequences:**
- Memory leaks in production (new client every render)
- Stale data (client caching issues)
- Auth state out of sync
- Connection pool exhaustion

**Prevention:**
```typescript
// WRONG: Creates new client every render
function Component() {
  const supabase = createClient(url, key); // DON'T DO THIS
}

// RIGHT: Server Component
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// RIGHT: Client Component
'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useMemo } from 'react'

export function useSupabaseClient() {
  return useMemo(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []
  )
}
```

**Detection:**
- Memory usage grows over time
- "Too many connections" errors
- Auth state doesn't persist across pages
- Cookies not setting correctly

**Phase mapping:** Phase 1 (Foundation) — Must be correct from start

---

### Pitfall 3: No Rate Limiting on Public Form Submission

**What goes wrong:** Public forms get spammed, database fills with junk, costs explode.

**Why it happens:**
- Assuming Supabase handles rate limiting (it doesn't for anon key)
- No CAPTCHA or bot protection
- No per-IP or per-form submission throttling
- Thinking RLS is enough security

**Consequences:**
- 1000s of spam submissions in hours
- Database storage costs spike
- Real feedback buried in spam
- Forms taken offline to stop abuse

**Prevention:**
```typescript
// Layer 1: Edge rate limiting (Vercel Edge Config or Upstash Redis)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 submissions per hour
  analytics: true,
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  // Continue with submission...
}

// Layer 2: Form-level submission tracking
// Add submitted_at timestamp + IP hash to prevent duplicate submissions

// Layer 3: Honeypot fields (client-side)
<input type="text" name="website" style={{ display: 'none' }} />
// Reject if filled (bots auto-fill hidden fields)
```

**Detection:**
- Sudden spike in database writes
- Many submissions from same IP
- Identical feedback text repeated
- Submissions happen too fast (< 1 second between)

**Phase mapping:** Phase 2 or Phase 3 — Add before public launch, not after spam attack

---

### Pitfall 4: Mutable Forms Breaking Historical Data

**What goes wrong:** Editing a form after feedback submitted makes responses meaningless.

**Why it happens:**
- Allowing form edits without versioning
- Storing only current email variant text, not snapshot
- Deleting variants that have feedback
- Not understanding feedback is historical data

**Consequences:**
- Client reviews feedback: "What does this mean?" (variant deleted)
- Reports show feedback for wrong email content
- Legal/audit issues (can't prove what client reviewed)
- Trust destroyed (client thinks agency manipulated data)

**Prevention:**
```typescript
// IMMUTABLE FORMS: Your design decision is CORRECT
// Forms + variants locked after creation
// Deletion requires explicit confirmation

// Additional safeguards:
interface EmailVariant {
  id: string
  form_id: string
  subject: string
  body: string
  created_at: string
  is_archived: boolean  // Soft delete instead of hard delete
  has_feedback: boolean // Computed: blocks deletion
}

// Database constraint
ALTER TABLE email_variants
ADD CONSTRAINT no_delete_with_feedback
CHECK (
  NOT EXISTS (
    SELECT 1 FROM feedback_responses
    WHERE variant_id = email_variants.id
  ) OR is_archived = false
);

// Application layer check
async function deleteVariant(variantId: string) {
  const { count } = await supabase
    .from('feedback_responses')
    .select('*', { count: 'exact', head: true })
    .eq('variant_id', variantId)

  if (count > 0) {
    throw new Error('Cannot delete variant with feedback. Archive instead.')
  }
}
```

**Detection:**
- Feedback references missing variant IDs
- Client complaints about inconsistent data
- JOIN queries return NULL for variant data

**Phase mapping:** Phase 1 (Foundation) — Immutability must be enforced from day 1

---

### Pitfall 5: Server/Client Component Boundary Confusion

**What goes wrong:** Data fetching happens client-side when it should be server-side, or vice versa. Secrets leak to client.

**Why it happens:**
- Not understanding App Router defaults (Server Components)
- Adding 'use client' unnecessarily
- Putting data fetching in client components (old Next.js pattern)
- Mixing server-only and client-only code

**Consequences:**
- Secrets exposed in browser (service role key, API keys)
- Slower page loads (client-side fetching waterfalls)
- Hydration mismatches
- SEO broken (client-side rendering only)

**Prevention:**
```typescript
// WRONG: Data fetching in client component
'use client'
export default function FormPage({ params }: { params: { slug: string } }) {
  const [form, setForm] = useState(null)

  useEffect(() => {
    // This runs client-side, slower, visible loading state
    fetch(`/api/forms/${params.slug}`).then(...)
  }, [])
}

// RIGHT: Server Component (default)
import { createClient } from '@/lib/supabase/server'

export default async function FormPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetches server-side, fast, no loading state needed
  const { data: form } = await supabase
    .from('forms')
    .select('*, email_variants(*)')
    .eq('slug', slug)
    .single()

  return <FormDisplay form={form} />
}

// Client component ONLY for interactivity
'use client'
function FeedbackForm({ formId }: { formId: string }) {
  // Only interactive parts need 'use client'
  const [rating, setRating] = useState(5)

  return <form>...</form>
}
```

**Detection:**
- Environment variables with `NEXT_PUBLIC_` prefix when they shouldn't be
- Network tab shows data fetching from browser
- "You're importing a component that needs X, but Y can only be used in Client Components" errors
- Slow Time to First Byte (TTFB)

**Phase mapping:** Phase 1 (Foundation) — Architecture must be correct from start

---

### Pitfall 6: No Input Validation on Public Routes

**What goes wrong:** Malicious input causes crashes, injection attacks, or unexpected behavior.

**Why it happens:**
- Trusting client-side validation
- Assuming Supabase RLS is sufficient validation
- Not validating file uploads, URLs, JSON shapes
- No schema validation library (Zod, Yup)

**Consequences:**
- SQL injection (rare with Supabase, but possible with raw queries)
- XSS attacks (storing malicious HTML)
- Type errors crash server
- Invalid data breaks reports/UI

**Prevention:**
```typescript
// Use Zod for runtime validation
import { z } from 'zod'

const FeedbackSchema = z.object({
  form_id: z.string().uuid(),
  variant_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  client_email: z.string().email().max(255),
})

export async function POST(request: Request) {
  const body = await request.json()

  // Validate BEFORE database interaction
  const result = FeedbackSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: 'Invalid input', details: result.error.format() },
      { status: 400 }
    )
  }

  // Now safe to use result.data
  const supabase = await createClient()
  const { error } = await supabase
    .from('feedback_responses')
    .insert(result.data)

  // ...
}

// Sanitize HTML output
import DOMPurify from 'isomorphic-dompurify'

function CommentDisplay({ comment }: { comment: string }) {
  // Prevent XSS from stored comments
  const clean = DOMPurify.sanitize(comment)
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

**Detection:**
- Type errors in production logs
- Unexpected database values
- Security scanner flags XSS vulnerabilities
- 500 errors on form submission

**Phase mapping:** Phase 1 or Phase 2 — Before first public deployment

---

## Technical Debt Patterns

Patterns that accumulate and slow down development.

### Debt 1: Inline SQL Queries Instead of Database Functions

**What happens:** Every query repeated in code, hard to change, no reuse.

**Why it's bad:**
- Complex queries (joins, aggregations) duplicated across route handlers
- Business logic in application layer instead of database
- Hard to optimize queries
- Testing requires mocking entire Supabase client

**Prevention:**
```sql
-- Create Postgres functions for complex queries
CREATE OR REPLACE FUNCTION get_form_with_feedback_summary(form_slug text)
RETURNS TABLE (
  form_id uuid,
  form_title text,
  total_responses bigint,
  avg_rating numeric
) AS $$
  SELECT
    f.id,
    f.title,
    COUNT(fr.id) as total_responses,
    AVG(fr.rating) as avg_rating
  FROM forms f
  LEFT JOIN email_variants ev ON ev.form_id = f.id
  LEFT JOIN feedback_responses fr ON fr.variant_id = ev.id
  WHERE f.slug = form_slug
  GROUP BY f.id, f.title
$$ LANGUAGE sql STABLE;

-- Call from TypeScript
const { data } = await supabase.rpc('get_form_with_feedback_summary', {
  form_slug: slug
})
```

**When to pay down:** Phase 3+ when queries get complex

---

### Debt 2: No Database Migrations Tracking

**What happens:** Schema changes made directly in Supabase dashboard, not tracked in code.

**Why it's bad:**
- Can't recreate database locally
- No rollback capability
- Team members have different schemas
- Production and staging drift

**Prevention:**
```bash
# Use Supabase CLI for migrations
npx supabase init
npx supabase migration new create_forms_table

# Edit migration file
# Commit to git
git add supabase/migrations/

# Apply to production
npx supabase db push
```

**When to pay down:** Immediately (Phase 1) if multi-environment

---

### Debt 3: No TypeScript Types Generated from Database

**What happens:** Manual type definitions that drift from actual schema.

**Why it's bad:**
- Types lie (say field is optional when it's required)
- Refactoring breaks silently
- New columns missed in types

**Prevention:**
```bash
# Generate types from Supabase schema
npx supabase gen types typescript --project-id <project-id> > types/database.types.ts

# Use in code
import type { Database } from '@/types/database.types'

type Form = Database['public']['Tables']['forms']['Row']
type FormInsert = Database['public']['Tables']['forms']['Insert']
```

**When to pay down:** Phase 1 or Phase 2

---

## Integration Gotchas

Specific to Next.js + Supabase + Vercel stack.

### Gotcha 1: Vercel Serverless Function Timeout (10s Free, 60s Pro)

**Issue:** Long-running operations (complex reports, email sending) timeout.

**Workaround:**
- Move to background job (Vercel Cron, Inngest, Trigger.dev)
- Use Edge Runtime for faster cold starts
- Cache expensive computations

**Phase impact:** Phase 3+ (reporting features)

---

### Gotcha 2: Supabase Connection Pooling in Serverless

**Issue:** Each serverless function invocation = new database connection. Exhausts pool.

**Workaround:**
- Supabase automatically pools via PostgREST (use REST API, not direct Postgres)
- Use Supabase connection pooler for direct Postgres access
- Don't use `pg` library directly (use Supabase client)

**Phase impact:** Phase 1 (Foundation) — Use Supabase client correctly

---

### Gotcha 3: Environment Variables in Client Components

**Issue:** `process.env.VARIABLE_NAME` is undefined in client components.

**Fix:**
- Prefix with `NEXT_PUBLIC_` for client access
- Never expose secrets client-side
- Use Server Actions for server-side logic

**Phase impact:** Phase 1 (Foundation)

---

### Gotcha 4: Cookies Not Setting in Middleware

**Issue:** Auth cookies don't persist, login loops.

**Fix:**
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Trigger cookie setting
  await supabase.auth.getUser()

  return response
}
```

**Phase impact:** Phase 2 (if using middleware for auth)

---

## Performance Traps

Issues that cause slow page loads or high costs.

### Trap 1: N+1 Query Problem in Server Components

**Issue:** Fetching form, then looping variants and fetching feedback for each.

**Impact:** 1 form + 5 variants = 6 queries (slow!)

**Fix:**
```typescript
// WRONG
const { data: variants } = await supabase
  .from('email_variants')
  .select('*')
  .eq('form_id', formId)

for (const variant of variants) {
  const { data: feedback } = await supabase
    .from('feedback_responses')
    .select('*')
    .eq('variant_id', variant.id) // N queries!
}

// RIGHT: Single query with join
const { data: form } = await supabase
  .from('forms')
  .select(`
    *,
    email_variants (
      *,
      feedback_responses (*)
    )
  `)
  .eq('id', formId)
  .single()
```

**Phase impact:** Phase 1 (Foundation) — Pattern must be correct

---

### Trap 2: No Database Indexes on Foreign Keys

**Issue:** Queries on `form_id`, `variant_id` are slow without indexes.

**Fix:**
```sql
-- Supabase creates FK indexes automatically, but verify
CREATE INDEX IF NOT EXISTS idx_email_variants_form_id
ON email_variants(form_id);

CREATE INDEX IF NOT EXISTS idx_feedback_responses_variant_id
ON feedback_responses(variant_id);

-- For lookups by slug
CREATE UNIQUE INDEX idx_forms_slug ON forms(slug);
```

**Phase impact:** Phase 1 (Foundation) — Before any production data

---

### Trap 3: Loading Entire Form Data Client-Side

**Issue:** Sending 100+ feedback responses to browser for filtering.

**Fix:**
- Paginate feedback (10-20 per page)
- Filter/sort server-side
- Use React Server Components for filtering UI

**Phase impact:** Phase 3+ (reporting/dashboard)

---

### Trap 4: No CDN Caching for Public Forms

**Issue:** Every form view hits database, even if unchanged.

**Fix:**
```typescript
// Add cache headers for public forms
export const revalidate = 3600 // Cache 1 hour

// Or use Vercel's stale-while-revalidate
export const dynamic = 'force-static'

// Or Next.js fetch cache
const { data } = await fetch(
  `${supabaseUrl}/rest/v1/forms?slug=eq.${slug}`,
  { next: { revalidate: 3600 } }
)
```

**Phase impact:** Phase 3+ (optimization)

---

## Security Mistakes

Critical security issues specific to this stack.

### Mistake 1: Exposing Service Role Key

**Issue:** `SUPABASE_SERVICE_ROLE_KEY` committed to git or used client-side.

**Impact:** Full database access, RLS bypassed, complete compromise.

**Prevention:**
- Store in `.env.local` (gitignored)
- Never use in client components
- Never pass to browser
- Only use in server-side API routes when RLS bypass needed

**Detection:** Search codebase for `process.env.SUPABASE_SERVICE_ROLE_KEY` in client components

**Phase impact:** Phase 1 (Foundation) — Must never happen

---

### Mistake 2: No CSRF Protection on Form Submission

**Issue:** Attacker can submit feedback from their site to your form.

**Impact:** Spam, fraudulent feedback, data pollution.

**Prevention:**
```typescript
// Add origin check in API route
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'https://yourdomain.com',
    'http://localhost:3000' // dev only
  ]

  if (!origin || !allowedOrigins.includes(origin)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Continue...
}

// Or use Next.js built-in CSRF with Server Actions
// (automatic with form actions)
```

**Phase impact:** Phase 2 (before public launch)

---

### Mistake 3: Trusting Client-Provided IDs

**Issue:** Client sends `form_id` in request, attacker changes to access other forms.

**Prevention:**
```typescript
// WRONG: Trust client-provided form_id
const { form_id, rating } = await request.json()
await supabase.from('feedback_responses').insert({ form_id, rating })

// RIGHT: Look up form by public slug, use server-side ID
const { slug, rating } = await request.json()

const { data: form } = await supabase
  .from('forms')
  .select('id')
  .eq('slug', slug)
  .single()

if (!form) return Response.json({ error: 'Not found' }, { status: 404 })

await supabase.from('feedback_responses').insert({
  form_id: form.id, // Server-side ID
  rating
})
```

**Phase impact:** Phase 1 (Foundation)

---

### Mistake 4: No Content Security Policy

**Issue:** XSS attacks possible if CSP not set.

**Prevention:**
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL};
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

**Phase impact:** Phase 2 or 3

---

## UX Pitfalls

User experience mistakes specific to feedback forms.

### UX Pitfall 1: No Optimistic UI for Submission

**Issue:** User clicks submit, waits 2-3 seconds, sees nothing, clicks again (double submission).

**Fix:**
```typescript
'use client'
import { useTransition } from 'react'

function FeedbackForm() {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await submitFeedback(formData)
    })
  }

  return (
    <form action={handleSubmit}>
      <button disabled={isPending}>
        {isPending ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  )
}
```

**Phase impact:** Phase 2 (core UX)

---

### UX Pitfall 2: No Error Recovery After Failed Submission

**Issue:** Network error = user loses all feedback, has to retype.

**Fix:**
- Save form state to localStorage before submission
- Show retry button on error
- Restore form data if page refreshed

**Phase impact:** Phase 2 or 3

---

### UX Pitfall 3: No Confirmation of Submission

**Issue:** User submits, page doesn't change, user unsure if it worked.

**Fix:**
- Show success message
- Redirect to thank-you page
- Send confirmation email (if email collected)
- Change form to read-only with submitted data visible

**Phase impact:** Phase 1 (Foundation) — Critical UX

---

### UX Pitfall 4: Unclear Multi-Variant Feedback Flow

**Issue:** User doesn't understand they need to rate each variant separately.

**Fix:**
- Progress indicator (Variant 1 of 5)
- Clear instructions at top
- Visual distinction between variants
- Summary view before final submit

**Phase impact:** Phase 2 (core UX)

---

## "Looks Done But Isn't" Checklist

Features that seem complete but have hidden issues.

### ✅ Form Submission Works

- [ ] Validates all inputs server-side
- [ ] Handles network errors gracefully
- [ ] Prevents double submission
- [ ] Rate limited per IP
- [ ] CSRF protected
- [ ] Logs submissions for debugging
- [ ] Sends confirmation to user
- [ ] Shows clear success state

### ✅ RLS Policies Active

- [ ] Anonymous users can view published forms
- [ ] Anonymous users can insert feedback
- [ ] Anonymous users CANNOT read feedback
- [ ] Anonymous users CANNOT update/delete feedback
- [ ] Authenticated users can only see own forms
- [ ] Tested with anonymous Supabase client
- [ ] Tested with authenticated client
- [ ] Policies logged and monitored

### ✅ Authentication Flow

- [ ] Login works
- [ ] Logout works
- [ ] Session persists across pages
- [ ] Protected routes redirect to login
- [ ] Cookies set correctly in middleware
- [ ] PKCE flow enabled (security)
- [ ] Password reset flow exists
- [ ] No service role key exposed

### ✅ Dashboard Displays Data

- [ ] Loads without error
- [ ] Handles empty state (no forms yet)
- [ ] Handles deleted forms gracefully
- [ ] Shows accurate feedback counts
- [ ] Aggregations calculated correctly
- [ ] Paginated for scale
- [ ] Loading states for slow queries
- [ ] Error boundaries catch failures

### ✅ Form Deletion

- [ ] Requires confirmation dialog
- [ ] Cascade deletes variants
- [ ] Cascade deletes feedback OR prevents deletion
- [ ] Updates dashboard immediately
- [ ] Doesn't break if form has feedback
- [ ] Logs deletion for audit
- [ ] Soft delete vs hard delete decision made

### ✅ Public Form Page

- [ ] Works without authentication
- [ ] Shows all variants
- [ ] Clear submission instructions
- [ ] Responsive on mobile
- [ ] Accessible (ARIA labels, keyboard nav)
- [ ] Handles expired/deleted forms (404)
- [ ] Handles already-submitted state
- [ ] SEO friendly (meta tags)

### ✅ Deployment

- [ ] Environment variables set in Vercel
- [ ] Database migrations applied
- [ ] RLS policies deployed
- [ ] Domain configured
- [ ] HTTPS enforced
- [ ] Error tracking enabled (Sentry)
- [ ] Analytics enabled
- [ ] Monitoring/alerts configured

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Priority |
|-------------|----------------|------------|----------|
| Foundation Setup | Wrong Supabase client initialization | Follow @supabase/ssr docs exactly, use Server/Browser client correctly | CRITICAL |
| RLS Policies | Policies block anonymous users | Test with anonymous client, use `true` policies for inserts | CRITICAL |
| Public Form Page | No rate limiting = instant spam | Add rate limiting before sharing any form publicly | HIGH |
| Form Submission | No validation = crashes/injection | Use Zod validation on all inputs | HIGH |
| Dashboard Auth | Cookies don't persist = login loops | Middleware cookie handling pattern | MEDIUM |
| Deletion Flow | Deleting forms with feedback breaks reports | Immutability + soft delete | HIGH |
| Multi-variant UX | Confusing flow for clients | Clear instructions + progress UI | MEDIUM |
| Reporting | N+1 queries = slow dashboard | Use joins, paginate, cache | MEDIUM |
| Scaling | No indexes = slow at 1000+ forms | Add indexes on FKs and slug | MEDIUM |
| Security Hardening | No CSP/CSRF = vulnerable | Add security headers + origin checks | HIGH |

---

## Research Methodology Note

**Confidence Level: MEDIUM**

This research was conducted without access to web research tools (WebSearch, WebFetch disabled). Findings are based on:
- Training data on Next.js 13+ App Router patterns (up to Jan 2025)
- Training data on Supabase common pitfalls
- Known patterns for public form platforms
- Experience with serverless Next.js deployments

**Recommended validation:**
1. Verify RLS policy patterns against current Supabase documentation
2. Check @supabase/ssr package for latest client initialization patterns
3. Validate Next.js App Router best practices (may have changed)
4. Review Vercel serverless limits (may have updated)

**High confidence areas:**
- RLS policy mistakes (well-documented pattern)
- Server/Client component boundary issues (core App Router concept)
- Rate limiting needs (universal for public forms)
- Input validation requirements (security fundamental)

**Lower confidence areas:**
- Specific API syntax (may have changed)
- New Next.js features (potential additions since training)
- Supabase connection pooling specifics (implementation details may differ)

---

## Summary of Critical Mistakes to Avoid

**Top 5 mistakes that cause rewrites or major incidents:**

1. **RLS policies wrong for anonymous access** → Forms don't work or leak data (Phase 1)
2. **No rate limiting on public forms** → Spam attack within hours of launch (Phase 2)
3. **Form mutability** → Historical feedback becomes meaningless (Phase 1)
4. **Wrong Supabase client initialization** → Memory leaks, auth bugs (Phase 1)
5. **No input validation** → Crashes, injection attacks, data corruption (Phase 1)

**"Must get right before launch" checklist:**
- ✅ RLS policies tested with anonymous client
- ✅ Rate limiting active on form submission
- ✅ All inputs validated server-side with Zod
- ✅ Forms immutable after creation
- ✅ Server/Client components correctly separated
- ✅ No secrets in client-side code
- ✅ CSRF protection enabled
- ✅ Error boundaries catch failures
- ✅ Success/error states clear to users
- ✅ Confirmation dialog on destructive actions

This document should prevent the most common Next.js + Supabase mistakes and provide clear prevention strategies for each pitfall.
