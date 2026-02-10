# User Setup Guide - Plan 01-01

## Environment Variables

These environment variables must be configured in `.env.local` before running the application.

| Variable | Source | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL | Public URL for your Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon/public key | Public anonymous key (safe to expose in browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → service_role key | Secret key with full access (NEVER expose in browser) |

## Account Setup

### 1. Create Supabase Project

1. Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in or create an account
3. Click "New Project"
4. Choose an organization (or create one)
5. Enter project details:
   - Name: `nextwave-feedback` (or your preferred name)
   - Database Password: Generate a strong password (save it securely)
   - Region: Choose closest to your location
6. Click "Create new project" and wait for provisioning to complete

### 2. Copy Environment Variables

1. Once the project is ready, navigate to **Project Settings** → **API**
2. Copy the following values to your `.env.local` file:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (click "Reveal" to show)

Example `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Configuration

### Run Migration SQL

1. In Supabase Dashboard, navigate to **SQL Editor**
2. Click **New query**
3. Open `supabase/migrations/20260210000000_create_initial_schema.sql` in your code editor
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Verify success: You should see "Success. No rows returned"

### Verify Tables Created

1. Navigate to **Table Editor** in Supabase Dashboard
2. You should see three new tables:
   - `forms`
   - `email_variants`
   - `feedback_responses`
3. Click on each table to verify columns match the schema

## Verification

After completing the setup, verify everything works:

```bash
# Build the application
npm run build

# Start the development server
npm run dev
```

Visit `http://localhost:3000` — you should see the "NextWave Solutions" homepage.

## Troubleshooting

**Build fails with "Invalid Supabase URL":**
- Ensure `.env.local` exists and contains all three environment variables
- Verify the URL starts with `https://` and ends with `.supabase.co`
- Restart the dev server after adding environment variables

**Migration fails with "relation already exists":**
- The tables were already created. You can skip this step or drop the tables and re-run the migration.

**Cannot connect to Supabase:**
- Verify your project is not paused (free tier projects pause after 1 week of inactivity)
- Check that the API keys are correct and not expired
- Ensure your IP is not blocked by database network restrictions
