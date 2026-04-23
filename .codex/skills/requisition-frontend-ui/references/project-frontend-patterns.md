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
- Create/edit form pattern:
  - `src/app/dashboard/create/page.tsx`
  - `src/app/dashboard/repair-maintainance/create/page.tsx`
- Detail view pattern:
  - `src/app/dashboard/req/[id]/page.tsx`
  - `src/app/dashboard/repair-maintainance/[id]/page.tsx`

## Common structure

### Register pages

1. Header with title, subtitle, and right-aligned actions
2. Four stat cards
3. Search/filter card
4. Table/register card with title and total count

### Create pages

1. Back link
2. Single centered large card
3. Title and short explanation
4. Error alert if needed
5. Grouped form fields
6. Submit actions in footer row

### Detail pages

1. Back link
2. Main info card
3. Attachments or supporting sections
4. Right-side actions/timeline if the page needs workflow status

## What to avoid

- Do not introduce a completely different color system for one page.
- Do not use split layouts unless a nearby page already uses them.
- Do not mix a marketing-style layout into dashboard screens.
- Do not overpack controls above the fold.
- Do not create custom card treatments when an existing one already fits.
