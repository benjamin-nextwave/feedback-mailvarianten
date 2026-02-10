# Architecture Patterns

**Domain:** Client Email Feedback Platform
**Stack:** Next.js App Router + Supabase + TypeScript + Tailwind CSS
**Researched:** 2026-02-10
**Confidence:** MEDIUM (based on training data - official docs not accessible for verification)

## Research Limitations

⚠️ **Important:** This architecture research was conducted without access to current official documentation (WebSearch/WebFetch unavailable). Recommendations are based on:
- Training data knowledge of Next.js App Router and Supabase patterns (as of January 2025)
- Logical inference from project requirements
- Standard architectural principles

**Status:** MEDIUM confidence overall. Recommend validating against current Next.js and Supabase documentation before implementation.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                           │
├──────────────────────┬──────────────────────────────────────┤
│  Dashboard (Auth)    │    Public Form (Anon)                │
│  /dashboard/*        │    /feedback/[slug]                  │
└──────────┬───────────┴──────────────┬───────────────────────┘
           │                          │
           │ Authenticated requests   │ Anonymous requests
           │ (user JWT)               │ (anon key)
           │                          │
           ▼                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Next.js App Router (Server)                      │
├───────────────────────────────────────────────────────────────┤
│  Route Handlers                Server Components              │
│  - API endpoints               - Page rendering               │
│  - Server Actions             - Data fetching                │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    │ Both flows use Supabase client
                    │ (different auth contexts)
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│                   Supabase Backend                           │
├──────────────────────────────────────────────────────────────┤
│  Auth Service        Database (PostgreSQL)        Storage    │
│  - Email/password    - forms                      (future)   │
│  - Session mgmt      - email_variants                        │
│                      - feedback_responses                    │
│                      - RLS policies                          │
└──────────────────────────────────────────────────────────────┘
```

## Core Architecture Pattern

**Hybrid Server-First with Dual Auth Context**

This application uses a **split authentication model**:
1. **Agency flow**: Authenticated users via Supabase Auth
2. **Client flow**: Anonymous public access with anon key

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Rendering Strategy** | Server Components default | SEO for public forms, performance, security |
| **Data Fetching** | Server-side with Supabase | RLS enforced at database, no client-side exposure |
| **Auth Pattern** | Dual-client (server + client) | Server for initial render, client for interactions |
| **State Management** | React Server Components + URL state | Minimize client JS, leverage platform |
| **API Layer** | Server Actions + Route Handlers | Server Actions for mutations, Route Handlers for complex logic |

---

## Component Architecture

### 1. Authentication Layer

**Two Supabase Client Instances Required:**

```typescript
// lib/supabase-server.ts - For authenticated dashboard routes
// Uses cookies, validates JWT, enforces RLS with user context

// lib/supabase-client.ts - For anonymous public forms
// Uses anon key, no user context, RLS enforces public access
```

**Component Responsibility:**

| Component | Auth Type | Purpose |
|-----------|-----------|---------|
| Dashboard routes (`/dashboard/*`) | Server-side auth | Protected routes, read cookies, verify session |
| Login page (`/login`) | Client-side auth | Sign in form, set session cookie |
| Public form (`/feedback/[slug]`) | Anonymous client | Read-only access, no user context |

**Data Flow:**
```
Dashboard → Cookies → Server Supabase Client → Authenticated DB queries
Public Form → Anon Key → Client Supabase Client → Anonymous DB queries
```

### 2. Route Architecture

**App Router Structure:**

```
/src/app/
├── layout.tsx                    # Root layout (metadata, providers)
├── page.tsx                      # Landing/redirect to dashboard
├── login/
│   └── page.tsx                  # Client Component (auth form)
├── dashboard/
│   ├── layout.tsx                # Auth boundary (middleware redirect)
│   ├── page.tsx                  # Dashboard home (forms list)
│   ├── new/
│   │   └── page.tsx              # Create form wizard
│   └── forms/
│       └── [id]/
│           ├── page.tsx          # Form detail + feedback viewer
│           └── edit/
│               └── page.tsx      # Edit form (optional)
└── feedback/
    └── [slug]/
        └── page.tsx              # Public feedback form
```

**Route Responsibilities:**

| Route | Type | Data Access | Key Logic |
|-------|------|-------------|-----------|
| `/login` | Public Client | None | Supabase auth sign in |
| `/dashboard` | Protected Server | Fetch user's forms | List view, RLS filters by user |
| `/dashboard/new` | Protected Client | Create form | Form builder, Server Action submit |
| `/dashboard/forms/[id]` | Protected Server | Fetch form + feedback | Display feedback, export |
| `/feedback/[slug]` | Public Server | Fetch form by slug | Display variants, submit feedback |

### 3. Data Access Layer

**Pattern: Server-Side Data Fetching with RLS**

```typescript
// Recommended pattern for dashboard routes
async function getFormWithFeedback(formId: string) {
  const supabase = createServerClient() // Uses cookies

  const { data, error } = await supabase
    .from('forms')
    .select(`
      *,
      email_variants (*),
      feedback_responses (*)
    `)
    .eq('id', formId)
    .single()

  // RLS automatically filters to current user's forms
  return data
}

// Pattern for public routes
async function getPublicForm(slug: string) {
  const supabase = createClientComponentClient() // Uses anon key

  const { data, error } = await supabase
    .from('forms')
    .select(`
      *,
      email_variants (*)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  // RLS allows public read of active forms
  return data
}
```

**Component Boundaries:**

```
Server Components (Dashboard)
↓ Fetch data with auth context
↓
Supabase Server Client
↓ Enforces RLS with user_id
↓
Database

---

Client Components (Public Form)
↓ Fetch data with anon key
↓
Supabase Client
↓ Enforces RLS for public access
↓
Database
```

### 4. Component Layer Structure

**Component Organization:**

```
/src/components/
├── ui/                           # shadcn/ui primitives
│   ├── button.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   ├── card.tsx
│   └── ...
├── dashboard/                    # Dashboard-specific components
│   ├── FormsList.tsx             # Server Component - displays forms
│   ├── FormCard.tsx              # Server Component - form item
│   ├── FeedbackTable.tsx         # Server Component - feedback display
│   ├── FormBuilder.tsx           # Client Component - create form UI
│   └── ExportButton.tsx          # Client Component - CSV export
└── feedback/                     # Public form components
    ├── FeedbackForm.tsx          # Client Component - main form
    ├── EmailVariantCard.tsx      # Server Component - display variant
    └── RatingInput.tsx           # Client Component - rating widget
```

**Component Patterns:**

| Pattern | When to Use | Example |
|---------|-------------|---------|
| **Server Component** | Display data, no interactivity | FormsList, FeedbackTable |
| **Client Component** | Forms, interactions, state | FormBuilder, FeedbackForm |
| **Server → Client** | Pass data as props | Server fetches, Client displays/interacts |
| **Server Action** | Mutations from Client | Submit feedback, create form |

### 5. Data Mutation Layer

**Server Actions Pattern:**

```typescript
// app/actions/feedback.ts
'use server'

export async function submitFeedback(formData: FormData) {
  const supabase = createClientComponentClient()

  // Validation
  const data = {
    variant_id: formData.get('variant_id'),
    rating: formData.get('rating'),
    comment: formData.get('comment')
  }

  // Insert (RLS enforces public write access)
  const { error } = await supabase
    .from('feedback_responses')
    .insert(data)

  if (error) throw error

  revalidatePath('/feedback/[slug]')
  return { success: true }
}

// app/actions/forms.ts
'use server'

export async function createForm(formData: CreateFormData) {
  const supabase = createServerClient() // Auth context

  // RLS enforces user_id automatically
  const { data, error } = await supabase
    .from('forms')
    .insert({
      title: formData.title,
      slug: formData.slug,
      // user_id added by RLS policy
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard')
  redirect(`/dashboard/forms/${data.id}`)
}
```

**Mutation Flow:**

```
Client Component
↓ User interaction (form submit)
↓
Server Action
↓ Validate data
↓ Call Supabase (appropriate client)
↓
Database (RLS enforces permissions)
↓
Revalidate cache
↓
Redirect or return result
```

---

## Recommended Project Structure

```
feedback-platform/
├── .planning/
│   └── research/                 # This file
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── feedback/
│   │   └── api/                  # Optional: Route handlers for complex logic
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── dashboard/            # Dashboard-specific
│   │   └── feedback/             # Public form-specific
│   ├── lib/
│   │   ├── supabase-server.ts    # Server client factory
│   │   ├── supabase-client.ts    # Client component client factory
│   │   ├── types.ts              # Database types
│   │   ├── utils.ts              # Utilities (cn, etc.)
│   │   └── validations.ts        # Zod schemas
│   └── actions/
│       ├── feedback.ts           # Public form actions
│       └── forms.ts              # Dashboard form actions
├── supabase/
│   ├── migrations/               # Database migrations
│   └── seed.sql                  # Optional: seed data
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

**File Responsibilities:**

| File/Directory | Purpose | When to Modify |
|----------------|---------|----------------|
| `app/*/page.tsx` | Route definitions | Adding/modifying routes |
| `components/` | Reusable UI | Building features |
| `lib/supabase-*.ts` | Supabase client setup | Never (unless auth changes) |
| `lib/types.ts` | TypeScript types | After DB schema changes |
| `actions/*.ts` | Server-side mutations | Adding features with data writes |
| `supabase/migrations/` | Database schema | Schema changes |

---

## Architectural Patterns to Follow

### Pattern 1: Server-First Data Fetching

**What:** Fetch data in Server Components, pass to Client Components as props

**When:** Default for all data access

**Example:**
```typescript
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: forms } = await supabase.from('forms').select('*')

  return <FormsList forms={forms} /> // Pass to Client Component
}

// components/dashboard/FormsList.tsx (Client Component)
'use client'
export function FormsList({ forms }: { forms: Form[] }) {
  // Client-side interactivity
  return <div>...</div>
}
```

**Benefits:**
- SEO-friendly (HTML includes data)
- Faster initial load (no client JS needed for data)
- Secure (credentials never exposed to client)

### Pattern 2: Optimistic UI with Server Actions

**What:** Update UI immediately, then confirm with server

**When:** Interactive mutations (submit feedback, create form)

**Example:**
```typescript
'use client'
import { useOptimistic } from 'react'
import { submitFeedback } from '@/actions/feedback'

export function FeedbackForm() {
  const [optimisticFeedback, addOptimisticFeedback] = useOptimistic(
    feedback,
    (state, newFeedback) => [...state, newFeedback]
  )

  async function handleSubmit(formData: FormData) {
    addOptimisticFeedback({ ...formData }) // Instant UI update
    await submitFeedback(formData) // Server validation
  }

  return <form action={handleSubmit}>...</form>
}
```

### Pattern 3: Dual Supabase Client Pattern

**What:** Separate client factories for authenticated vs. anonymous access

**When:** Always (architecture requirement)

**Implementation:**

```typescript
// lib/supabase-server.ts - Dashboard routes
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// lib/supabase-client.ts - Public forms
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Critical:** Never mix these. Dashboard = server client. Public forms = browser client.

### Pattern 4: RLS as Security Boundary

**What:** Database enforces all access control via Row Level Security

**When:** Every table, every query

**Example:**
```sql
-- forms table: users can only see their own forms
CREATE POLICY "Users can view own forms"
ON forms FOR SELECT
USING (auth.uid() = user_id);

-- forms table: public can read active forms by slug
CREATE POLICY "Public can view active forms"
ON forms FOR SELECT
USING (is_active = true);

-- feedback_responses: anyone can insert (with rate limiting)
CREATE POLICY "Anyone can submit feedback"
ON feedback_responses FOR INSERT
WITH CHECK (true);
```

**Benefits:**
- Security enforced at database level
- No need for authorization checks in application code
- Works even if application logic has bugs

### Pattern 5: URL State for Public Forms

**What:** Use URL params for state instead of client-side state management

**When:** Public forms, shareable states

**Example:**
```typescript
// feedback/[slug]/page.tsx
export default function FeedbackPage({
  searchParams,
}: {
  searchParams: { submitted?: string }
}) {
  const showThankYou = searchParams.submitted === 'true'

  if (showThankYou) {
    return <ThankYouMessage />
  }

  return <FeedbackForm />
}

// After submission, redirect to same page with param
redirect(`/feedback/${slug}?submitted=true`)
```

**Benefits:**
- Shareable state (copy URL)
- Works without JavaScript
- No client-side state management needed

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Database Queries in Dashboard

**What:** Using Supabase client directly in dashboard Client Components

**Why bad:**
- Breaks Server Component streaming
- Exposes queries to client (security risk)
- Slower initial load (client JS + network request)

**Instead:**
```typescript
// ❌ BAD
'use client'
export function FormsList() {
  const [forms, setForms] = useState([])

  useEffect(() => {
    supabase.from('forms').select('*').then(setForms)
  }, [])
}

// ✅ GOOD
// Server Component fetches, passes to Client Component
export default async function DashboardPage() {
  const forms = await getForms()
  return <FormsList forms={forms} />
}
```

### Anti-Pattern 2: Mixing Auth Contexts

**What:** Using authenticated client for public routes or vice versa

**Why bad:**
- RLS policies won't work correctly
- Security vulnerabilities
- Confusing debugging

**Instead:**
- Dashboard routes → `createServerClient()` (auth context)
- Public forms → `createBrowserClient()` (anon context)
- Never mix

### Anti-Pattern 3: Over-Componentization

**What:** Breaking every UI element into separate files

**Why bad:**
- Hard to navigate codebase
- Over-abstraction for simple app
- Premature optimization

**Instead:**
- Start with co-located components in page files
- Extract to `/components` when reused 3+ times
- Keep related logic together

### Anti-Pattern 4: API Routes for Simple Mutations

**What:** Creating `/api/feedback/submit` route handler instead of Server Action

**Why bad:**
- More boilerplate (request parsing, response formatting)
- Separate from component logic
- No automatic revalidation

**Instead:**
```typescript
// ✅ Use Server Actions for simple mutations
'use server'
export async function submitFeedback(formData: FormData) {
  // Validation + database insert
  revalidatePath('/feedback/[slug]')
}

// ⚠️ Use Route Handlers only for:
// - Webhooks
// - Third-party integrations
// - Complex business logic
```

### Anti-Pattern 5: No TypeScript Types for Database

**What:** Using `any` or generic objects for database entities

**Why bad:**
- No autocomplete
- Runtime errors from typos
- Hard to refactor

**Instead:**
```typescript
// Generate types from Supabase schema
// lib/types.ts
export type Database = {
  public: {
    Tables: {
      forms: {
        Row: {
          id: string
          title: string
          slug: string
          user_id: string
          created_at: string
        }
        Insert: Omit<Row, 'id' | 'created_at'>
        Update: Partial<Insert>
      }
      // ...
    }
  }
}
```

---

## Data Flow Patterns

### Flow 1: Dashboard - View Forms List

```
1. User navigates to /dashboard
   ↓
2. Server Component renders
   ↓
3. createServerClient() - uses cookies for auth
   ↓
4. SELECT * FROM forms WHERE user_id = <current_user>
   ↓ (RLS enforces user_id filter)
5. Database returns user's forms
   ↓
6. Server renders HTML with data
   ↓
7. Browser displays page (no JS needed)
```

### Flow 2: Dashboard - Create New Form

```
1. User clicks "New Form" → navigate to /dashboard/new
   ↓
2. Client Component renders form builder
   ↓
3. User fills form, clicks Submit
   ↓
4. Form calls Server Action: createForm()
   ↓
5. Server Action validates data
   ↓
6. createServerClient() - auth context from cookies
   ↓
7. INSERT INTO forms (...) - RLS adds user_id
   ↓
8. Database returns new form
   ↓
9. revalidatePath('/dashboard') - clear cache
   ↓
10. redirect(`/dashboard/forms/${newFormId}`)
    ↓
11. User sees new form detail page
```

### Flow 3: Public - View Feedback Form

```
1. Client receives URL: /feedback/abc123
   ↓
2. Server Component renders page
   ↓
3. createBrowserClient() - anon key (no auth)
   ↓
4. SELECT * FROM forms WHERE slug = 'abc123' AND is_active = true
   ↓ (RLS allows public read of active forms)
5. Database returns form + email variants
   ↓
6. Server renders HTML
   ↓
7. Browser displays page
   ↓
8. Client Component hydrates for interactivity
```

### Flow 4: Public - Submit Feedback

```
1. User fills feedback form, selects rating
   ↓
2. Client Component calls Server Action: submitFeedback()
   ↓
3. Server Action validates data (Zod schema)
   ↓
4. createBrowserClient() - anon key
   ↓
5. INSERT INTO feedback_responses (variant_id, rating, comment, ...)
   ↓ (RLS allows public insert)
6. Database stores feedback
   ↓
7. revalidatePath('/feedback/[slug]') - update any cached data
   ↓
8. Return success
   ↓
9. Client shows thank you message (URL param: ?submitted=true)
```

### Flow 5: Dashboard - View Feedback for Form

```
1. User navigates to /dashboard/forms/[id]
   ↓
2. Server Component renders
   ↓
3. createServerClient() - auth context
   ↓
4. SELECT forms.*, email_variants.*, feedback_responses.*
   FROM forms
   LEFT JOIN email_variants ON ...
   LEFT JOIN feedback_responses ON ...
   WHERE forms.id = [id] AND forms.user_id = <current_user>
   ↓ (RLS ensures user owns this form)
5. Database returns form with nested variants and feedback
   ↓
6. Server renders feedback table
   ↓
7. Browser displays page
   ↓
8. Client Components hydrate for sorting, filtering, export
```

---

## Integration Points

### Supabase Integration

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Optional: for admin operations
```

**Client Setup:**
```typescript
// lib/supabase-server.ts
export function createServerClient() { /* ... */ }

// lib/supabase-client.ts
export function createBrowserClient() { /* ... */ }
```

**Authentication Middleware:**
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  // Protect /dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*']
}
```

### Vercel Deployment

**Build Configuration:**
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Environment Variables: Add Supabase keys

**Environment Variables Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Vercel-Specific Optimizations:**
- Server Components use Edge Runtime (fast responses)
- Automatic ISR for public pages
- Image optimization via `next/image`

---

## Build Order Recommendations

### Phase 1: Foundation (Core Infrastructure)

**Build first because everything depends on it:**

1. **Database schema + RLS policies**
   - Can't build anything without data layer
   - Affects all subsequent components

2. **Supabase client setup**
   - Server client factory
   - Browser client factory
   - Test both auth contexts work

3. **TypeScript types**
   - Generate from database schema
   - Ensures type safety throughout

**Deliverable:** Working Supabase connection, RLS verified, types generated

---

### Phase 2: Authentication (Dashboard Gate)

**Build second because dashboard requires auth:**

1. **Login page** (`/login`)
   - Client Component with Supabase auth
   - Sign in form

2. **Auth middleware**
   - Protect `/dashboard/*` routes
   - Redirect to login if not authenticated

3. **Test auth flow**
   - Sign up → sign in → session persists

**Deliverable:** Working login, protected dashboard routes

---

### Phase 3: Dashboard - View (Read Operations)

**Build third - simplest dashboard functionality:**

1. **Dashboard home** (`/dashboard`)
   - Server Component
   - Fetch forms, display list
   - "New Form" button (doesn't work yet)

2. **Form detail page** (`/dashboard/forms/[id]`)
   - Server Component
   - Fetch form + variants + feedback
   - Display feedback table

**Deliverable:** Can view forms and feedback (read-only)

---

### Phase 4: Dashboard - Create (Write Operations)

**Build fourth - adds creation capability:**

1. **Create form page** (`/dashboard/new`)
   - Client Component with form builder
   - Add email variants dynamically
   - Server Action to save

2. **Server Actions**
   - `createForm()` - insert form + variants
   - Validation with Zod

**Deliverable:** Can create forms end-to-end

---

### Phase 5: Public Form (Core Product Value)

**Build fifth - the main product feature:**

1. **Public form page** (`/feedback/[slug]`)
   - Server Component for initial render
   - Client Component for form interactions

2. **Feedback submission**
   - Server Action: `submitFeedback()`
   - Thank you state (URL param)

3. **Public data access**
   - Verify RLS allows anonymous reads
   - Test submission flow

**Deliverable:** End-to-end public feedback flow

---

### Phase 6: Polish (UX Enhancements)

**Build last - nice-to-haves:**

1. **Export feedback** (CSV download)
2. **Form status toggle** (active/inactive)
3. **Delete forms**
4. **Edit forms** (optional)

**Deliverable:** Production-ready platform

---

## Dependency Graph

```
Database Schema
    ↓
Supabase Clients + Types
    ↓
    ├─→ Auth (Login + Middleware)
    │       ↓
    │   Dashboard Pages (Read)
    │       ↓
    │   Dashboard Pages (Write)
    │
    └─→ Public Form (Read + Write)
            ↓
        Polish Features
```

**Critical Path:** Database → Clients → Auth → Dashboard → Public Form

**Parallelizable:**
- Dashboard Read + Dashboard Write (can build simultaneously once Auth exists)
- Polish features (independent of each other)

---

## Scalability Considerations

### At 100 users (MVP)

**Approach:**
- Default Supabase free tier (500MB database, 2GB bandwidth)
- No caching needed
- Single region deployment (Vercel)

**Bottlenecks:** None expected

---

### At 10K users

**Approach:**
- Supabase Pro tier ($25/mo - 8GB database, 250GB bandwidth)
- Enable Vercel Edge caching for public forms
- Database indexes on frequently queried columns (slug, user_id)

**Potential Issues:**
- Slow queries on feedback_responses table → add indexes
- Public form bandwidth → enable Vercel CDN caching

**Optimizations:**
```sql
-- Add indexes for performance
CREATE INDEX idx_forms_slug ON forms(slug);
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_feedback_variant_id ON feedback_responses(variant_id);
CREATE INDEX idx_feedback_created_at ON feedback_responses(created_at DESC);
```

---

### At 1M users (Unlikely for this product)

**Approach:**
- Database read replicas for dashboard queries
- Redis cache for frequently accessed public forms
- CDN caching for static assets
- Consider database partitioning for feedback_responses

**Major Changes:**
- Separate read/write database connections
- Implement query caching layer
- Rate limiting per IP for public submissions

**Architecture Shift:**
- Move from monolith to API-first architecture
- Separate dashboard and public form deployments
- Dedicated caching layer

**Note:** For a feedback form platform, 1M users is unlikely. Most growth will be in feedback submissions, not forms. Optimize for read-heavy workload on public forms.

---

## Security Considerations

### RLS Policy Verification

**Critical:** Test RLS policies thoroughly before launch.

```sql
-- Test as authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO '<test_user_id>';
SELECT * FROM forms; -- Should only see own forms

-- Test as anonymous user
SET LOCAL ROLE anon;
SELECT * FROM forms WHERE slug = 'test123'; -- Should see active forms only
INSERT INTO feedback_responses (...); -- Should be allowed
UPDATE forms SET is_active = false; -- Should fail
```

### Rate Limiting

**Problem:** Public forms can be spammed

**Solution:**
```sql
-- Supabase function to rate limit by IP
CREATE OR REPLACE FUNCTION rate_limit_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- Check submissions from this IP in last hour
  IF (
    SELECT COUNT(*)
    FROM feedback_responses
    WHERE ip_address = NEW.ip_address
    AND created_at > NOW() - INTERVAL '1 hour'
  ) > 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER feedback_rate_limit
BEFORE INSERT ON feedback_responses
FOR EACH ROW EXECUTE FUNCTION rate_limit_feedback();
```

### Environment Variable Security

**Never commit:**
- `SUPABASE_SERVICE_ROLE_KEY` (if used)
- Any private keys

**Public variables (safe to expose):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These are meant to be public. Security is enforced by RLS.

---

## Monitoring & Observability

### Recommended Metrics

| Metric | What to Track | Tool |
|--------|---------------|------|
| **Database Performance** | Query time, connection count | Supabase Dashboard |
| **API Response Time** | Server Action duration | Vercel Analytics |
| **Error Rate** | Failed submissions, auth errors | Vercel Logs |
| **User Activity** | Forms created, feedback submitted | Custom analytics |

### Logging Strategy

```typescript
// lib/logger.ts
export function logEvent(event: string, data: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (e.g., Vercel Analytics)
    console.log(JSON.stringify({ event, data, timestamp: new Date() }))
  } else {
    console.log(event, data)
  }
}

// Usage in Server Actions
export async function submitFeedback(formData: FormData) {
  try {
    // ... submission logic
    logEvent('feedback_submitted', { variant_id, rating })
  } catch (error) {
    logEvent('feedback_error', { error: error.message })
    throw error
  }
}
```

---

## Testing Strategy

### Unit Tests

**What to test:**
- Utility functions (`lib/utils.ts`)
- Validation schemas (Zod)
- Component rendering (React Testing Library)

**Not needed for MVP:** Deep test coverage. Focus on critical paths.

### Integration Tests

**What to test:**
- Server Actions (mock Supabase)
- Auth flow (sign up → sign in → session)
- RLS policies (database-level tests)

**Example:**
```typescript
// __tests__/actions/feedback.test.ts
import { submitFeedback } from '@/actions/feedback'

describe('submitFeedback', () => {
  it('should insert feedback with valid data', async () => {
    const formData = new FormData()
    formData.set('variant_id', 'uuid')
    formData.set('rating', '5')

    const result = await submitFeedback(formData)
    expect(result.success).toBe(true)
  })
})
```

### E2E Tests

**What to test:**
- Critical user flows (create form → submit feedback → view feedback)

**Tool:** Playwright

**Minimal test suite:**
```typescript
// e2e/feedback-flow.spec.ts
test('complete feedback flow', async ({ page }) => {
  // Dashboard: Create form
  await page.goto('/dashboard/new')
  await page.fill('[name="title"]', 'Test Form')
  await page.click('button[type="submit"]')

  // Get public URL
  const publicUrl = await page.locator('[data-testid="public-url"]').textContent()

  // Public: Submit feedback
  await page.goto(publicUrl)
  await page.click('[data-rating="5"]')
  await page.fill('[name="comment"]', 'Great email!')
  await page.click('button[type="submit"]')

  // Verify thank you message
  await expect(page.locator('text=Thank you')).toBeVisible()
})
```

---

## Documentation Requirements

### For Development Team

**Required docs:**
- `README.md` - Setup instructions
- `ARCHITECTURE.md` - This file
- `.env.example` - Required environment variables

**Optional docs:**
- API documentation (if complex)
- Deployment guide

### For Maintenance

**Document in code comments:**
- RLS policy logic (why specific rules)
- Complex Server Actions
- Non-obvious component patterns

**Example:**
```typescript
/**
 * Creates a new feedback form with email variants.
 *
 * RLS Policy: Automatically sets user_id from JWT token.
 * This ensures users can only create forms for themselves.
 *
 * @param formData - Form data including title, slug, and variants
 * @returns Newly created form with ID
 */
export async function createForm(formData: CreateFormData) {
  // ...
}
```

---

## Future Architecture Considerations

### Potential Enhancements

1. **Real-time Updates**
   - Use Supabase Realtime for live feedback updates
   - Dashboard shows new feedback without refresh
   - Implementation: Subscribe to `feedback_responses` changes

2. **File Uploads**
   - Allow email variant screenshots
   - Use Supabase Storage
   - Implementation: Add `image_url` column, upload to bucket

3. **Multi-tenant**
   - Agency has multiple team members
   - Add `teams` table, update RLS policies
   - Implementation: Add team_id foreign key to forms

4. **White-labeling**
   - Custom domains for public forms
   - Vercel domain routing
   - Implementation: Add `custom_domain` column, configure DNS

5. **Analytics Dashboard**
   - Aggregate feedback statistics
   - Charts and graphs
   - Implementation: Add aggregation queries, charting library

**Architecture Impact:** All enhancements fit within current architecture. No major refactoring needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Next.js App Router Patterns** | MEDIUM | Based on training data (Jan 2025), not verified against current 2026 docs |
| **Supabase Architecture** | MEDIUM | Standard patterns from training, but RLS specifics not verified |
| **Component Boundaries** | HIGH | Logical inference from project requirements |
| **Data Flow** | HIGH | Standard React + Server Components patterns |
| **Build Order** | HIGH | Based on dependency analysis of requirements |
| **Scalability** | LOW | Theoretical, not based on real-world load testing |
| **Security** | MEDIUM | RLS patterns from training, but should be verified |

**Overall Confidence:** MEDIUM

**Recommendation:** Validate the following against current official documentation before implementation:
1. Next.js App Router Server Actions patterns (2026 updates)
2. Supabase RLS best practices for dual auth contexts
3. `@supabase/ssr` package API (may have changed since training)
4. Next.js middleware patterns for auth

---

## Sources

**Note:** Unable to access official documentation due to tool restrictions. This architecture is based on:

- Training data knowledge (January 2025) of Next.js App Router and Supabase
- Logical inference from project requirements provided
- Standard architectural principles for web applications

**Verification Needed:**
- [ ] Next.js official docs: App Router patterns (https://nextjs.org/docs)
- [ ] Supabase official docs: RLS patterns (https://supabase.com/docs/guides/auth/row-level-security)
- [ ] Supabase official docs: Next.js integration (https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [ ] Next.js + Supabase example repos (https://github.com/vercel/next.js/tree/canary/examples/with-supabase)

---

## Next Steps for Validation

Before implementation, recommend:

1. **Verify Supabase SSR package API**
   - Check `@supabase/ssr` documentation
   - Confirm `createServerClient` and `createBrowserClient` signatures

2. **Verify Next.js Server Actions patterns**
   - Check current best practices for form submissions
   - Verify `revalidatePath` and `redirect` behavior

3. **Test RLS policies**
   - Create test database
   - Verify authenticated vs. anonymous access works as designed

4. **Review Vercel deployment docs**
   - Confirm environment variable handling
   - Check for any Next.js 15+ deployment changes

This architecture provides a solid foundation, but treating it as MEDIUM confidence means validating critical paths before building.
