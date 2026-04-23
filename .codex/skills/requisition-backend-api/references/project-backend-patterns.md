# Project Backend Patterns

## Core stack

- Next.js App Router route handlers under `src/app/api/**`
- `NextRequest` and `NextResponse`
- Prisma with PostgreSQL
- JWT bearer auth from `src/lib/auth.ts`
- Shared Prisma client in `src/lib/prisma.ts`

## Core auth pattern

- Parse bearer token with `getUserFromRequest(req)`.
- Return `401` when auth is missing or invalid.
- Perform explicit role checks in the route handler.

## Prisma pattern

- Prisma client uses `@prisma/adapter-pg`.
- BigInt fields are common across the schema.
- Several routes patch `BigInt.prototype.toJSON` to keep JSON responses serializable.

## Route families

### Requisitions

- `src/app/api/requisitions/route.ts`
- `src/app/api/requisitions/[id]/route.ts`
- `src/app/api/requisitions/[id]/approve/route.ts`
- `src/app/api/requisitions/[id]/payment/route.ts`
- `src/app/api/requisitions/[id]/dispatch/route.ts`

These are the main reference routes for CRUD and workflow state transitions.

### Repair/Maintainance

- `src/app/api/repair-maintainance/route.ts`
- `src/app/api/repair-maintainance/[id]/route.ts`

This module is implemented on top of the `Requisition` model, with extra repair-specific metadata stored in `cardSubtitleInfo`.

### Uploads

- `src/app/api/uploads/route.ts`

Uploads save files to `public/uploads` and then patch either requisition fields or repair metadata mappings.

## Dev bypass pattern

- Some routes use a shared `DEV_IDS` set such as `9999`, `9998`, `9997`, `9996`.
- In dev bypass mode, routes use in-memory stores on `globalThis`.
- When changing these routes, keep the dev path and Prisma path behavior aligned.

## Important data-model ideas

- `Organization` scopes most business data.
- `User.role` drives route permissions.
- `Requisition` is the main business model.
- Repair/Maintainance reuses `Requisition` plus `requiredFor` and `cardSubtitleInfo`.
- Approval, payment, and dispatch are represented as explicit fields on `Requisition`.

## What to avoid

- Do not introduce a second auth pattern beside `getUserFromRequest` unless needed.
- Do not rename response fields casually; frontend pages depend on them.
- Do not update only the Prisma-backed branch when a route already has a dev bypass branch.
- Do not invent new enum strings that are not in `prisma/schema.prisma`.
- Do not bypass organization scoping when reading or writing real data.
