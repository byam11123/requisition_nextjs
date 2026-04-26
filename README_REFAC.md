# Requisition App - Modular Monolith Architecture

This project has been refactored from a monolithic Next.js application into a **Modular Monolith** using a **Service / Hook / Repository** pattern.

## Directory Structure

```bash
src/
  ├── modules/               # Feature-based modules
  │   ├── [module-name]/
  │   │   ├── components/    # Module-specific UI
  │   │   ├── hooks/         # Logic hooks (useRequisitions, etc.)
  │   │   ├── repository/    # Direct database access (Supabase)
  │   │   ├── services/      # Business logic & data processing
  │   │   └── types/         # Module-specific types
  ├── components/            # Global shared components (UI Kit)
  ├── lib/                   # Infrastructure & Utilities
  │   ├── supabase/          # Supabase client setup
  │   ├── utils/             # Helper functions
  └── types/                 # Global types
```

## Pattern Rules

1.  **Strict 200-line limit**: No file should exceed 200 lines. Split components and services if they grow too large.
2.  **No direct DB access in UI**: Use hooks that call services.
3.  **No direct API calls in UI**: Call services via hooks.
4.  **Repository per feature**: All Supabase queries must live in a repository class.
5.  **Service per feature**: All business logic must live in a service class.

## Getting Started

### Local Setup
1. Copy `.env.example` to `.env.local` and fill in Supabase credentials.
2. Run `npm install`.
3. Run `npm run dev`.

### Testing
- Run unit tests: `npm run test`
- Run E2E tests: `npx playwright test`

## Deployment
Automated via GitHub Actions when pushing to `main` (Production) or `develop` (Staging).
Required Secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `JWT_SECRET`
