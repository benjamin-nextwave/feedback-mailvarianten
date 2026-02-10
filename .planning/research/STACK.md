# Stack Research

**Domain:** Client email feedback platform
**Researched:** 2026-02-10
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x (App Router) | Full-stack React framework | App Router with Server Components for optimal performance; API routes for backend; built-in Vercel deployment |
| TypeScript | 5.x | Type safety | Catches errors at compile time; excellent Supabase type generation support |
| Tailwind CSS | 4.x | Utility-first CSS | Rapid UI development; built-in with create-next-app; consistent design system |
| Supabase | Latest (@supabase/supabase-js v2) | Database + Auth + RLS | PostgreSQL with row-level security; built-in auth; JS client for both browser and server |
| React | 19.x | UI library | Ships with Next.js 15; Server Components support |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/ssr | 0.5.x | Supabase SSR helpers for Next.js | Creating server/browser Supabase clients with cookie-based auth |
| sonner | 2.x | Toast notifications | Lightweight, accessible toast library; works great with Next.js App Router |
| slugify | 1.6.x | URL slug generation | Creating human-friendly slugs from client names |
| nanoid | 5.x | Short unique ID generation | Appending random strings to slugs for uniqueness |
| clsx | 2.x | Conditional class names | Combining Tailwind classes conditionally |
| tailwind-merge | 2.x | Merge Tailwind classes | Avoiding class conflicts when merging utility classes |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Linting | Ships with create-next-app; use next/core-web-vitals config |
| Prettier | Code formatting | With prettier-plugin-tailwindcss for class sorting |
| Supabase CLI | Local development + migrations | `supabase init`, `supabase migration new`, type generation |

## Installation

```bash
# Create Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# UI utilities
npm install sonner clsx tailwind-merge

# Slug generation
npm install slugify nanoid

# Dev dependencies
npm install -D prettier prettier-plugin-tailwindcss supabase
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| sonner | react-hot-toast | If you need more customization; sonner is simpler and lighter |
| @supabase/ssr | next-auth | If using multiple auth providers; overkill for Supabase-only auth |
| Tailwind CSS | shadcn/ui | If you want pre-built components; adds complexity for this simple app |
| slugify + nanoid | uuid | If slugs don't need to be human-readable |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Prisma | Adds ORM complexity; Supabase JS client handles queries directly with RLS | @supabase/supabase-js |
| NextAuth.js | Unnecessary abstraction over Supabase Auth; adds config overhead | @supabase/ssr with Supabase Auth |
| styled-components / CSS modules | Conflicts with Tailwind utility-first approach | Tailwind CSS |
| @supabase/auth-helpers-nextjs | Deprecated in favor of @supabase/ssr | @supabase/ssr |
| Pages Router patterns | App Router is the standard; mixing causes confusion | App Router only |
| Heavy form libraries (Formik, React Hook Form) | Overkill for this app's simple forms; native form handling with Server Actions is sufficient | Native forms + Server Actions |

## Supabase Client Setup Pattern

**Browser client** (`lib/supabase-client.ts`):
- Uses `createBrowserClient` from `@supabase/ssr`
- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Server client** (`lib/supabase-server.ts`):
- Uses `createServerClient` from `@supabase/ssr` with cookie handling
- For Server Components, Route Handlers, Server Actions
- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (RLS enforced)

**Admin client** (for webhook/service operations):
- Uses `createClient` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`
- Bypasses RLS — use only in server-side code

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15.x | React 19.x | Bundled together; don't install React separately |
| @supabase/ssr 0.5.x | @supabase/supabase-js 2.x | Must use v2 of supabase-js |
| Tailwind CSS 4.x | Next.js 15.x | Built-in support via create-next-app |

## Sources

- Next.js official docs — App Router, Server Components, Server Actions
- Supabase official docs — Auth, RLS, JS client, SSR guide
- Tailwind CSS docs — v4 setup with Next.js
- Vercel deployment docs — Next.js on Vercel

---
*Stack research for: Client email feedback platform*
*Researched: 2026-02-10*
