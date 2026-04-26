# Migration Notes

## Authentication Module

| Original Location | New Modular Location | Description |
|-------------------|----------------------|-------------|
| `src/app/page.tsx` | `src/modules/auth/components/login-form.tsx` | Split login form logic. |
| `src/app/page.tsx` | `src/modules/auth/components/signup-form.tsx` | Split signup form logic. |
| `src/app/page.tsx` | `src/app/page.tsx` | Refactored into a thin shell component. |
| `src/app/api/login/route.ts` | `src/modules/auth/services/auth.service.ts` | Business logic for login moved to service. |
| `src/app/api/signup/route.ts` | `src/modules/auth/services/auth.service.ts` | Business logic for signup moved to service. |
| `src/app/api/signup/route.ts` | `src/modules/auth/repository/auth.repository.ts` | Database queries moved to repository. |
| `src/lib/auth.ts` | `src/modules/auth/services/auth.service.ts` | JWT generation moved to service. |
| `src/lib/stores/dev-auth-store.ts` | `src/modules/auth/hooks/use-auth-store.ts` | Client-side auth state moved to Zustand. |

## Requisition Management

| Original Location | New Modular Location | Description |
|-------------------|----------------------|-------------|
| `src/app/dashboard/page.tsx` | `src/modules/requisitions/components/requisition-register.tsx` | Container for requisition list logic. |
| `src/app/dashboard/page.tsx` | `src/modules/requisitions/components/requisition-table.tsx` | Requisition table component. |
| `src/app/dashboard/page.tsx` | `src/modules/requisitions/components/requisition-stats.tsx` | Requisition statistics component. |
| `src/app/dashboard/page.tsx` | `src/modules/requisitions/components/requisition-filters.tsx` | Requisition filter bar component. |
| `src/app/dashboard/page.tsx` | `src/modules/requisitions/services/requisition.service.ts` | List fetching and stats logic moved to service. |
| `src/app/dashboard/page.tsx` | `src/modules/requisitions/repository/requisition.repository.ts` | Requisition database queries moved to repository. |
| `src/app/dashboard/page.tsx` | `src/modules/requisitions/hooks/use-requisitions.ts` | List state management moved to hook. |
| `src/utils/format.ts` | `src/utils/format.ts` | Extracted formatDate utility. |
