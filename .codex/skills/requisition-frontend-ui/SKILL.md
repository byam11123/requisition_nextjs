---
name: requisition-frontend-ui
description: Build, redesign, or review frontend pages and components for this Requisition App Next repository. Use when working on dashboard pages, forms, tables, cards, filters, navigation, spacing, or visual consistency in `src/app/**`, especially when matching existing requisition, repair-maintainance, attendance, salary-advance, profile, or auth UI patterns.
---

# Requisition Frontend Ui

## Overview

Use this skill to keep frontend work aligned with the repo's existing dashboard language instead of inventing a new one per page. Prefer improving the current system over introducing a fresh visual direction unless the user explicitly asks for a redesign.

Read [references/project-frontend-patterns.md](references/project-frontend-patterns.md) before making substantial UI changes.

## Workflow

1. Inspect the target page and at least one nearby reference page that already looks correct.
2. Read the relevant Next.js guide in `node_modules/next/dist/docs/` before changing component patterns or form behavior.
3. Decide whether the task is:
   - dashboard/register page
   - create/edit form page
   - detail page
   - shared layout/navigation work
4. Reuse the matching local pattern before inventing a new layout.
5. After editing, sanity-check:
   - visual consistency with nearby pages
   - desktop and mobile spacing
   - button hierarchy
   - filter/search placement
   - empty states and loading states

## Layout Rules

- Preserve the existing dark dashboard shell: `bg-slate-950`, `bg-slate-900/50`, `border-white/5`, `text-slate-100`, `text-slate-400`.
- Prefer rounded containers already used in the repo: `rounded-xl`, `rounded-2xl`, `rounded-3xl`.
- Keep the standard page rhythm:
  - page header
  - top action area
  - stat cards if the page is a register/dashboard
  - search/filter bar
  - main card for table or form
- For dashboard/register pages, mirror `repair-maintainance/page.tsx` first.
- For create/edit pages, mirror `dashboard/create/page.tsx` and `dashboard/repair-maintainance/create/page.tsx` first.
- For detail pages, mirror `dashboard/req/[id]/page.tsx` or the repair detail page first.

## Interaction Rules

- Primary actions should use the bright indigo button style already present in the repo.
- Secondary actions should usually be border buttons with `border-white/10`.
- Search and filter controls should sit together in one card, not scattered around the page.
- Stat cards should be clickable only when they actually filter or change state.
- Save/update/delete/admin actions should show visible success or failure feedback. Prefer a compact toast over browser `alert()` for dashboard actions.
- Avoid decorative UI that does not help the workflow.
- Prefer clear labels over clever labels.

## Frontend Review Checklist

When the user asks for a frontend change, review your output against this checklist before finishing:

- Does this page look like it belongs beside the existing dashboard pages?
- Did I reuse a local reference page rather than mixing in unrelated patterns?
- Is the information hierarchy obvious within 3 seconds?
- Are spacing, card sizes, and headings consistent with adjacent pages?
- Is the page still usable on smaller widths?
- Did I keep the UI calm and structured instead of over-designing it?
- If the user asked for a reference match, did I match the structure first and styling second?

## Suggesting Better Versions

When the user gives a vague frontend request, propose better options grounded in this repo's existing design language. Prefer suggestions like:

- "Keep the repair-style register layout and only swap the content model."
- "Reuse the create-page shell and tighten field grouping."
- "Use the same stat/filter/table stack so the module feels native to the app."

Do not suggest a flashy redesign unless the user explicitly wants a new visual direction.

## Concrete Examples

### Requisition register page

When updating a requisition-style register page:

- Reuse the repair register page shell first.
- Keep the order: header, stat cards, search/filter row, register table.
- Put summary counts in the stat cards, not in extra floating badges.
- Keep the table dense but readable with a short secondary line under the primary cell content.

Good suggestion:

- "Use the repair register layout exactly, but replace its business columns with requisition columns like material, site, requester, approval, payment, and dispatch."

### Requisition create page

When updating a create form for requisitions:

- Start from `src/app/dashboard/create/page.tsx`.
- Keep one centered card with grouped sections.
- Put core required fields first.
- Put optional fields under a bordered subsection.
- Keep actions in the bottom-right footer row.

Good suggestion:

- "Keep the existing create-page shell and only tighten the field grouping so the main request data appears above optional commercial details."

### Repair register page

When updating repair dashboard or register pages:

- Start from `src/app/dashboard/repair-maintainance/page.tsx`.
- Preserve the active stat-card filtering pattern.
- Keep search and dropdown filters together in one card.
- Use short operational labels and avoid verbose card copy.

Good suggestion:

- "Keep the repair page structure and swap the metrics or labels only if the workflow changes; do not redesign the register shell."

### Repair create page

When updating repair create pages:

- Start from `src/app/dashboard/repair-maintainance/create/page.tsx`.
- Preserve the top metadata row pattern when the form has generated fields like request ID or timestamp.
- Put file upload blocks inside a bordered subsection instead of creating a detached panel.
- Keep the submit CTA as the only strong footer action unless draft/save is truly needed.

## Notes

- This repo currently favors practical Tailwind utility composition over abstracted design-system components.
- When introducing new helpers, keep them small and obvious.
- Avoid changing the global visual language while solving a page-level request.
