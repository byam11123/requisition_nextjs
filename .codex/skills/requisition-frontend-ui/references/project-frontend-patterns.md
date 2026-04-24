# Project Frontend Patterns

## Core visual language

- App shell uses `bg-slate-950` with subtle indigo glow.
- Main content cards usually use `bg-slate-900/50`, `border border-white/5`, and `rounded-2xl` or `rounded-3xl`.
- Primary text is usually `text-slate-100`.
- Secondary text is usually `text-slate-400` or `text-slate-500`.
- Primary CTA buttons usually use `bg-indigo-600 hover:bg-indigo-500 text-white`.
- Mutation feedback should be visible. For admin save/update actions, prefer a compact toast in the top-right instead of `alert()`.

## Reference pages

- Register/dashboard pattern:
  - `src/app/dashboard/repair-maintainance/page.tsx`
  - `src/app/dashboard/page.tsx`
  - `src/app/dashboard/attendance/page.tsx`
  - `src/app/dashboard/salary-advance/page.tsx`
- Create/edit form pattern:
  - `src/app/dashboard/create/page.tsx`
  - `src/app/dashboard/repair-maintainance/create/page.tsx`
- Detail view pattern:
  - `src/app/dashboard/req/[id]/page.tsx`
  - `src/app/dashboard/repair-maintainance/[id]/page.tsx`
- Admin management pattern:
  - `src/app/dashboard/roles/page.tsx`
  - `src/app/dashboard/designations/page.tsx`
- Command center pattern:
  - `src/app/dashboard/overview/page.tsx`

## Common structure

### Register pages

1. Header with title, subtitle, and right-aligned actions
2. Four stat cards
3. Search/filter card
4. Table/register card with title and total count

Registers in this repo should stay aligned:

- row checkboxes when bulk actions/export are present
- consistent search/filter strip
- shared `PageHeader` for title/subtitle/right-action rows
- shared dashboard filter dropdowns with custom option panels instead of page-local raw select styling
- same action column expectations across modules
- similar spacing between stat cards, filters, and main table

### Create pages

1. Back link
2. Single centered large card
3. Title and short explanation
4. Error alert if needed
5. Grouped form fields
6. Submit actions in footer row

Create and admin pages in this repo should stay aligned:

- shared `FormSelect` for repeated select-style form fields, with a custom dropdown panel rather than browser-default opened options
- shared `PageHeader` for repeated title/subtitle/action rows on dashboard and admin screens
- shared dashboard filter dropdown only for register/list filters
- avoid styling native selects independently on each form page

### Detail pages

1. Back link
2. Main info card
3. Attachments or supporting sections
4. Right-side actions/timeline if the page needs workflow status

Detail pages in this repo should stay aligned:

- use shared `AttachmentCard` for repeated photo/proof/document preview blocks
- use shared `RegisterTableShell` for repeated register/table cards
- use shared `DetailInfoRow` or `DetailInfoField` for repeated label/value display blocks
- use shared `StatusTimeline` directly without nesting it inside another lookalike card
- keep attachment previews calm and operational, not gallery-like
- use the same empty-state language for missing evidence where possible

### Admin pages

1. Header with title, subtitle, and right-aligned create action
2. Card grid of saved entities
3. Compact edit/delete controls
4. Modal form for create/edit
5. Toast feedback for save/delete

Admin list pages should also reuse `PageHeader` for the top title/action row unless the page intentionally has a more specialized hero or settings layout.

### Overview page

1. Header with title and top-right actions
2. Global search block
3. KPI cards
4. Desktop-style draggable board
5. Toast feedback for overview mutations such as demo seeding

## What to avoid

- Do not introduce a completely different color system for one page.
- Do not use split layouts unless a nearby page already uses them.
- Do not mix a marketing-style layout into dashboard screens.
- Do not overpack controls above the fold.
- Do not create custom card treatments when an existing one already fits.
- Do not restyle native `<select>` controls independently on each page when a shared dashboard filter component already exists.
- Do not keep cloning raw form `<select>` markup when the shared `FormSelect` component fits.
- Do not treat a wrapper around native `<select>/<option>` as a finished reusable solution when the browser-default opened panel still breaks the UI language.
- Do not hide role/designation/page-access logic behind unclear labels.
- Do not use browser `alert()` for admin save actions when the repo already uses `ActionToast`.
