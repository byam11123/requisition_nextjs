---
name: requisition-backend-api
description: Build, extend, or review backend API logic for this Requisition App Next repository. Use when working on App Router route handlers in `src/app/api/**`, Prisma data access, JWT auth helpers, role-based workflow logic, uploads, dev bypass stores, or schema-backed backend changes tied to requisitions, repair-maintainance, users, login, and related modules.
---

# Requisition Backend Api

## Overview

Use this skill to keep backend changes aligned with the repo's existing App Router + Prisma architecture. Prefer extending the current route patterns, auth flow, and workflow rules instead of inventing a parallel backend style.

Read [references/project-backend-patterns.md](references/project-backend-patterns.md) before making substantial backend changes.

## Workflow

1. Inspect the relevant route handler and at least one sibling route that already implements a similar pattern.
2. Read the relevant Next.js guide in `node_modules/next/dist/docs/` before changing route handler structure or server behavior.
3. Identify whether the task touches:
   - auth or identity
   - requisition CRUD
   - approval, payment, or dispatch workflow
   - repair-maintainance data mapping
   - uploads and file persistence
   - Prisma schema/data model
4. Reuse the closest local route pattern first.
5. After editing, sanity-check:
   - auth and role gate correctness
   - dev bypass behavior
   - BigInt handling in JSON responses
   - Prisma field names and enum values
   - response shape consistency with the frontend that consumes it

## Backend Rules

- Preserve the current stack: Next.js App Router route handlers, `NextRequest`, `NextResponse`, Prisma, PostgreSQL, and JWT helpers in `src/lib/auth.ts`.
- Reuse `getUserFromRequest(req)` for bearer-token auth unless there is a strong reason not to.
- Keep role checks explicit in the route handler.
- Prefer matching the repo's existing response pattern:
  - `401` for missing auth
  - `403` for role violations
  - `404` for missing user or entity
  - `500` for unexpected failures
- Keep backend logic close to the route for now; do not introduce a service layer unless the user asks for that refactor.
- Preserve the current dev-bypass approach for test users when touching modules that already use it.

## Prisma Rules

- Read `prisma/schema.prisma` before introducing or renaming fields.
- Preserve BigInt compatibility in route responses where existing modules already patch `BigInt.prototype.toJSON`.
- Use existing enum values exactly as declared in Prisma.
- Match existing relation names and mapped column names instead of guessing.
- When adding schema-backed fields, think through:
  - route read shape
  - route write shape
  - frontend expectations
  - upload field mapping if files are involved

## Route Patterns

- For list/create modules, start from:
  - `src/app/api/requisitions/route.ts`
  - `src/app/api/repair-maintainance/route.ts`
- For workflow update routes, start from:
  - `src/app/api/requisitions/[id]/approve/route.ts`
  - `src/app/api/requisitions/[id]/payment/route.ts`
  - `src/app/api/requisitions/[id]/dispatch/route.ts`
- For file uploads, start from:
  - `src/app/api/uploads/route.ts`

## Frontend Contract Rules

- Do not silently change field names returned to the frontend.
- If a route is shaping DB rows into frontend-specific objects, preserve that mapping style unless the user asks to redesign the contract.
- For repair-maintainance, remember the module is stored on top of the requisition model plus `cardSubtitleInfo` JSON metadata.
- Keep both database-backed and dev-store-backed response objects aligned.

## Concrete Examples

### Requisition list/create route

When updating requisition list or create behavior:

- Start from `src/app/api/requisitions/route.ts`.
- Preserve the `DEV_IDS` bypass pattern if the route already supports it.
- Keep organization scoping based on the authenticated user.
- Generate request IDs in the same repo-native style instead of inventing a new format.

Good suggestion:

- "Extend the existing requisitions route and keep the same auth, org filtering, and request ID generation pattern."

### Repair maintainance route

When updating repair-maintainance backend behavior:

- Start from `src/app/api/repair-maintainance/route.ts`.
- Preserve `requiredFor: MODULE_KEY` as the module discriminator.
- Keep repair-specific metadata inside `cardSubtitleInfo` unless the schema is explicitly being changed.
- Keep the mapped response shape friendly for the existing frontend.

Good suggestion:

- "Add the new repair field to both the `cardSubtitleInfo` metadata payload and the mapped API response so frontend and DB stay aligned."

### Approval / payment / dispatch routes

When updating workflow routes:

- Start from the corresponding route under `src/app/api/requisitions/[id]/...`.
- Keep role checks explicit and local to the route.
- Update both dev store and Prisma-backed code paths if the route already supports both.
- Preserve timestamps like `approvedAt`, `paidAt`, `dispatchedAt`, plus audit fields such as `approvedById`, `paidById`, and `dispatchedById`.

Good suggestion:

- "Mirror the existing payment route shape and update both the in-memory dev store and Prisma update block in the same change."

### Upload route

When updating uploads:

- Start from `src/app/api/uploads/route.ts`.
- Keep category-to-field mapping explicit.
- If a file affects repair-only metadata, update both the stored file and the repair metadata sync logic.
- Do not break the public URL format without checking frontend consumers.

## Backend Review Checklist

When the user asks for a backend change, review your output against this checklist before finishing:

- Did I reuse a nearby route pattern instead of creating a new backend style?
- Are auth and role checks still correct?
- Did I keep dev bypass behavior in sync with the real Prisma-backed path?
- Did I preserve response shapes expected by the frontend?
- Did I read the Prisma schema before touching data fields?
- If files or workflow states changed, did I update all related branches consistently?

## Suggesting Better Versions

When the user gives a vague backend request, propose better options grounded in this repo's architecture. Prefer suggestions like:

- "Extend the existing requisition route instead of creating a second parallel endpoint."
- "Keep repair metadata in `cardSubtitleInfo` unless we are ready for a schema migration."
- "Update both the dev store and Prisma path together so local testing and real data behave the same."

Do not suggest a large backend abstraction or architectural rewrite unless the user explicitly wants one.

## Notes

- This repo currently favors pragmatic route-local logic over deeper backend layering.
- The frontend often depends on backend-shaped fields directly, so contract drift is costly.
- When changing workflow logic, check approve, payment, and dispatch routes together instead of in isolation.
