---
phase: 04-form-creation-management
plan: 01
subsystem: forms
tags: [dependencies, validation, server-actions, ui-components]
dependency_graph:
  requires:
    - 01-01 (Supabase client setup)
    - 01-01 (Database types)
  provides:
    - Form validation schema with conditional opvolgmail logic
    - Server actions for form CRUD operations
    - shadcn form components (form, dialog, alert-dialog, switch)
  affects:
    - 04-02 (Form creation UI will use these schemas and actions)
    - 04-03 (Delete dialog will use deleteFormAction)
tech_stack:
  added:
    - react-hook-form@7.71.1 (form state management)
    - zod@4.3.6 (schema validation)
    - "@hookform/resolvers@5.2.2" (zod integration)
    - slugify@1.6.6 (URL-safe slug generation)
  patterns:
    - Zod superRefine for conditional validation
    - Server Actions with redirect after mutation
    - Batch insert for email variants
    - Type assertions for Supabase SSR compatibility
key_files:
  created:
    - src/lib/validations/form-schema.ts (Zod validation with Dutch error messages)
    - src/lib/actions/form-actions.ts (createFormAction, deleteFormAction)
    - src/components/ui/form.tsx (shadcn form component)
    - src/components/ui/dialog.tsx (shadcn dialog component)
    - src/components/ui/alert-dialog.tsx (shadcn alert-dialog for confirmations)
    - src/components/ui/switch.tsx (shadcn switch for toggles)
  modified:
    - package.json (added form dependencies)
    - package-lock.json (dependency lock)
key_decisions:
  - decision: Use Zod superRefine for conditional validation instead of discriminated unions
    rationale: More flexible for validating opvolgmail dependencies and allows better error messages
    alternatives: [discriminated unions, transform functions]
  - decision: Generate slug with random 6-char suffix using Math.random().toString(36)
    rationale: Simple collision avoidance without external UUID library
    alternatives: [nanoid, uuid, timestamp-based]
  - decision: Use type assertions (as any, as Form) for Supabase insert operations
    rationale: Known Supabase SSR typing issue with strict TypeScript - pragmatic workaround
    alternatives: [disable strict mode, create wrapper functions, wait for upstream fix]
  - decision: Batch insert all variants in single operation
    rationale: More efficient than individual inserts, maintains sort_order consistency
    alternatives: [individual inserts, transaction wrapper]
  - decision: Use AlertDialog for delete confirmation instead of Dialog
    rationale: Better accessibility for destructive actions (semantic HTML, better screen reader support)
    alternatives: [standard Dialog, custom modal]
metrics:
  duration_minutes: 5.6
  completed: 2026-02-11T05:42:17Z
---

# Phase 4 Plan 1: Dependencies and Schema Summary

One-liner: Installed react-hook-form + Zod, added shadcn form components, created validation schema with conditional opvolgmail logic, and implemented server actions for form creation with slug generation and deletion.

## Performance

Execution time: 5.6 minutes
Commits: 2 (1 per task)

## Accomplishments

Completed all foundation dependencies for Phase 4 form management:

1. Installed 4 npm packages (react-hook-form, zod, @hookform/resolvers, slugify)
2. Added 4 shadcn UI components (form, dialog, alert-dialog, switch)
3. Created Zod validation schema with:
   - Required klantnaam validation
   - Optional webhook URL validation (allows empty string or valid URL)
   - Eerste mail variants array (1-5 items required)
   - Conditional opvolgmail_1 and opvolgmail_2 validation
   - Dutch error messages for all validation rules
   - SuperRefine logic preventing opvolgmail_2 without opvolgmail_1
4. Implemented createFormAction with:
   - Server-side Zod validation
   - Unique slug generation with retry logic (3 attempts)
   - Batch insert for all email variants
   - Proper sort_order sequencing across email types
   - revalidatePath + redirect after successful creation
5. Implemented deleteFormAction with CASCADE deletion handling

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install dependencies and add shadcn components | 9d758f8 | package.json, package-lock.json, form.tsx, dialog.tsx, alert-dialog.tsx, switch.tsx |
| 2 | Create Zod validation schema and Server Actions | 8152a49 | form-schema.ts, form-actions.ts |

## Files Created

- **src/lib/validations/form-schema.ts**: Zod schema with conditional validation
  - Exports: formSchema, FormSchemaType, variantSchema
  - Validates klantnaam, webhook_url, and all variant arrays
  - SuperRefine ensures opvolgmail dependencies are met

- **src/lib/actions/form-actions.ts**: Server Actions for form management
  - createFormAction: Validates, generates slug, inserts form + variants
  - deleteFormAction: Removes form (CASCADE handles variants/feedback)
  - generateUniqueSlug helper: Slugifies client name with random suffix

- **src/components/ui/form.tsx**: shadcn Form component for react-hook-form
- **src/components/ui/dialog.tsx**: shadcn Dialog for modals
- **src/components/ui/alert-dialog.tsx**: shadcn AlertDialog for confirmations
- **src/components/ui/switch.tsx**: shadcn Switch for toggles

## Files Modified

- **package.json**: Added react-hook-form, zod, @hookform/resolvers, slugify
- **package-lock.json**: Locked dependency versions

## Decisions Made

**Validation Strategy:** Used Zod's superRefine over discriminated unions for conditional opvolgmail validation. SuperRefine provides more flexibility for complex dependencies (like opvolgmail_2 requiring opvolgmail_1) and better error messages per field.

**Slug Generation:** Implemented custom slug generator using slugify + Math.random().toString(36).substring(2, 8) for 6-character suffix. Retry logic attempts up to 3 times on collision. This avoids adding UUID/nanoid dependencies for a simple use case.

**Supabase Typing:** Used type assertions (as any, as Form) for insert operations due to known Supabase SSR typing issues with strict TypeScript. This is a documented workaround until upstream types improve. The database schema types ensure runtime safety.

**Batch Insert:** Insert all email variants in a single batch operation rather than individual inserts. This maintains sort_order consistency and reduces database round trips.

**AlertDialog for Deletion:** Used AlertDialog instead of Dialog for delete confirmation. AlertDialog provides better accessibility for destructive actions with proper ARIA attributes and keyboard navigation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Supabase SSR Type Inference:** TypeScript strict mode caused Supabase insert operations to infer as `never` type. This is a known issue with @supabase/ssr and strict typing.

**Resolution:** Applied type assertions (as any, as Form) to insert operations. This is the recommended workaround in Supabase documentation. Runtime safety is maintained through database schema types.

## Next Phase Readiness

Ready for Plan 04-02 (Form Creation UI):

- Form validation schema is complete with all required fields
- Server actions are ready for form submission
- shadcn components are installed and available
- TypeScript compiles without errors
- Next.js build succeeds

Blockers: None

Next Plan: 04-02 (Create form creation UI with react-hook-form integration)

## Self-Check

Verified all claims:

**Files exist:**
- src/lib/validations/form-schema.ts: EXISTS
- src/lib/actions/form-actions.ts: EXISTS
- src/components/ui/form.tsx: EXISTS
- src/components/ui/dialog.tsx: EXISTS
- src/components/ui/alert-dialog.tsx: EXISTS
- src/components/ui/switch.tsx: EXISTS

**Commits exist:**
- 9d758f8: EXISTS
- 8152a49: EXISTS

**Dependencies installed:**
```
react-hook-form@7.71.1: INSTALLED
zod@4.3.6: INSTALLED
@hookform/resolvers@5.2.2: INSTALLED
slugify@1.6.6: INSTALLED
```

**TypeScript compilation:** PASSED
**Next.js build:** PASSED

Self-Check: PASSED
