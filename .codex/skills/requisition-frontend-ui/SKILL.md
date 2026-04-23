---
name: requisition-frontend-ui
description: Build, redesign, or review frontend pages and components for this Requisition App Next repository. Use when working on dashboard pages, forms, tables, cards, filters, navigation, spacing, admin tooling, or visual consistency in `src/app/**`, especially when matching existing requisition, repair-maintainance, attendance, salary-advance, roles, designations, overview, profile, or auth UI patterns.
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
- For repeated form controls, prefer shared helpers like `FormSelect` before styling another page-local field.
- For repeated page title/subtitle/action rows, prefer the shared `PageHeader` helper before hand-rolling another header block.
- For repeated proof/photo/document preview blocks, prefer the shared `AttachmentCard` helper before building another local upload or preview card.
- For repeated register/table cards, prefer the shared `RegisterTableShell` helper before building another page-local register wrapper.
- For repeated register export actions, prefer the shared export menu and export helpers before adding another page-local CSV or PDF exporter.
- For repeated detail label/value blocks, prefer the shared helpers in `src/app/dashboard/components/detail-info.tsx` before creating another local `DetailRow` or `InfoField`.
- For workflow/status history blocks, use the shared `StatusTimeline` directly instead of wrapping it inside another extra card with the same job.
- For detail pages, mirror `dashboard/req/[id]/page.tsx` or the repair detail page first.
- For admin configuration pages, mirror `dashboard/roles/page.tsx` or `dashboard/designations/page.tsx` first.
- For command-center/dashboard work, mirror `dashboard/overview/page.tsx` first.

## Interaction Rules

- Primary actions should use the bright indigo button style already present in the repo.
- Secondary actions should usually be border buttons with `border-white/10`.
- Search and filter controls should sit together in one card, not scattered around the page.
- Dashboard/register filters should use the shared component at `src/app/dashboard/components/filter-dropdown.tsx` with a true custom dropdown panel, not a wrapper around native `<select>/<option>`.
- Form/admin/detail selects should use the shared component at `src/app/dashboard/components/form-select.tsx` with a true custom dropdown panel, not repeated raw `<select>` markup or a thin native wrapper.
- Repeated page title/subtitle/action rows should use the shared component at `src/app/dashboard/components/page-header.tsx` unless the page intentionally needs a different structure.
- Repeated attachment/proof/photo blocks should use the shared component at `src/app/dashboard/components/attachment-card.tsx` instead of page-local preview cards.
- Repeated register/table sections should use the shared component at `src/app/dashboard/components/register-table-shell.tsx` instead of page-local register card wrappers.
- Repeated register export actions should use the shared `ExportMenu` and `export-utils.ts` helpers instead of duplicating CSV/PDF export logic per page.
- Repeated detail label/value blocks should use `DetailInfoRow` or `DetailInfoField` from `src/app/dashboard/components/detail-info.tsx` instead of page-local copies.
- Repeated workflow/status history sections should use `src/app/dashboard/status-timeline.tsx` directly, not an outer wrapper plus the timeline card inside it.
- Stat cards should be clickable only when they actually filter or change state.
- Save/update/delete/admin actions should show visible success or failure feedback. Prefer a compact toast over browser `alert()` for dashboard actions.
- Admin utility actions such as page access save, custom role save, designation save, or demo seeding should always show toast feedback.
- Avoid decorative UI that does not help the workflow.
- Prefer clear labels over clever labels.
- When a page depends on page access, custom roles, or designation defaults, keep those controls visible and explicit instead of hiding the source of behavior.

## Frontend Review Checklist

When the user asks for a frontend change, review your output against this checklist before finishing:

- Does this page look like it belongs beside the existing dashboard pages?
- Did I reuse a local reference page rather than mixing in unrelated patterns?
- Is the information hierarchy obvious within 3 seconds?
- Are spacing, card sizes, and headings consistent with adjacent pages?
- Is the page still usable on smaller widths?
- Did I keep the UI calm and structured instead of over-designing it?
- Did I reuse or create a shared component for repeated controls instead of making a one-page-only fix?
- If I introduced a reusable select/dropdown, is the opened option panel also custom-styled instead of falling back to browser-default UI?
- If the user asked for a reference match, did I match the structure first and styling second?
- If this page affects admin control, did I make role/designation/page-access behavior understandable from the UI?

## Suggesting Better Versions

When the user gives a vague frontend request, propose better options grounded in this repo's existing design language. Prefer suggestions like:

- "Keep the repair-style register layout and only swap the content model."
- "Reuse the create-page shell and tighten field grouping."
- "Use the same stat/filter/table stack so the module feels native to the app."
- "This pattern repeats in multiple modules, so it should become a shared component before we keep patching it page by page."

Do not suggest a flashy redesign unless the user explicitly wants a new visual direction.

## Concrete Examples

### Requisition register page

When updating a requisition-style register page:

- Reuse the repair register page shell first.
- Keep the order: header, stat cards, search/filter row, register table.
- Put summary counts in the stat cards, not in extra floating badges.
- Keep the table dense but readable with a short secondary line under the primary cell content.
- Use the shared dashboard filter dropdown for approval, priority, route, department, or other register filters.

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
- Use the shared dashboard filter dropdown instead of raw browser selects for register filters.
- Use short operational labels and avoid verbose card copy.

Good suggestion:

- "Keep the repair page structure and swap the metrics or labels only if the workflow changes; do not redesign the register shell."

### Repair create page

When updating repair create pages:

- Start from `src/app/dashboard/repair-maintainance/create/page.tsx`.
- Preserve the top metadata row pattern when the form has generated fields like request ID or timestamp.
- Put file upload blocks inside a bordered subsection instead of creating a detached panel.
- Keep the submit CTA as the only strong footer action unless draft/save is truly needed.

### Admin configuration pages

When updating roles, designations, workflow config, or page-access-related UI:

- Start from `src/app/dashboard/roles/page.tsx`, `src/app/dashboard/designations/page.tsx`, or the users management modal patterns.
- Use one large management card grid instead of inventing a totally different admin layout.
- Keep edit/delete controls compact and secondary to the data itself.
- Explain defaults clearly in labels, especially when a designation auto-fills a custom role or a role defines default page access.
- For admin list/register filters, use the shared dashboard filter dropdown. If styled form selects repeat across forms, extract a separate shared form-select component instead of reusing raw native selects page by page.

Good suggestion:

- "Keep the admin card grid pattern and make the role or designation effect obvious in the form labels instead of adding extra explanation panels."

### Overview dashboard

When updating `src/app/dashboard/overview/page.tsx`:

- Treat it like the project command center, not a generic analytics page.
- Preserve the draggable board behavior unless the user explicitly asks to remove it.
- Keep admin utility actions like `Seed Demo Data` small and near the top controls.
- Use the existing toast pattern for overview mutations.

Good suggestion:

- "Keep the overview header compact, put operational actions in the top-right, and refresh the summary after mutations so the board feels live."

## Notes

- This repo currently favors practical Tailwind utility composition over abstracted design-system components.
- When introducing new helpers, keep them small and obvious. If the same small control appears on multiple pages, prefer one shared component over multiple local copies, and say so early instead of waiting for repeated user correction.
- Avoid changing the global visual language while solving a page-level request.
- This repo now has admin-facing systems for custom roles, designations, page access, workflow config, and demo seeding. Frontend changes should respect those control surfaces instead of hardcoding behavior in a single page.
