# Applications and shared-header fix - local review

## Confirmed styling cause

MarketplaceHeader renders .ap-header, .ap-header-inner, .ap-brand,
.ap-desktop-nav, .ap-header-actions, .ap-menu-button and .ap-mobile-menu.
Their layout/visibility styles previously lived in src/app/home.css, imported
only by the homepage and cart. Applications and order workspaces imported the
component without that stylesheet. Additionally, --ap-line and --ap-green were
scoped to .ap-home, which those pages do not use. The header therefore lacked
its flex layout, nowrap logo, navigation gaps, menu-button hiding and breakpoints
on direct visits. This is a shared stylesheet ownership problem, not missing
page-specific spacing. No browser reproduction was run during this change.

## Shared fix

- Move the header/brand rules out of home.css into a component-owned
  src/components/marketplace-header.css imported by Marketplace.js.
- Use root design tokens directly, including Inter, rather than .ap-home aliases.
- Keep the homepage's existing brand/links/account component. Desktop controls
  share one flex row; the compact menu starts at 900px to accommodate tablets.
  At phone widths account controls remain in the menu and the existing shared
  bottom bar. No second bottom navigation or page-specific header is introduced.
- Remove the cart's now-unnecessary import of all homepage styles. Applications,
  order workspaces and the new job form receive the fix through the same component.
- Mobile menu links close the menu on navigation. Homepage content styles and
  seller-dashboard files are not redesigned.

## Applications

My applications now has Applications sent / Jobs posted tabs, keyboard navigation,
real counts after successful authenticated loads, a compact Refresh button and
purposeful empty states. Populated cards show job title, real poster name (or an
explicit poster-ID fallback against older APIs), date, readable status and a next
action. Proposals and portfolio snapshots remain accessible in expandable details;
withdrawals retain the existing authenticated endpoint and retry UUID hook.
Posted-job cards retain links to the existing owner-only hiring panel. Payment
explanations stay at the actual hiring decision rather than in empty states.
Counts and empty results are not shown while a request is loading or has failed.
The backend adds only poster_name to the private own-applications response; no
company information is fabricated and no schema change is required.

## Approved job-posting form

The existing /jobs/create link pointed to a missing route (and was captured by
/jobs/[id]). Following explicit user confirmation, a small authenticated form now
uses existing jobsAPI.create / POST /api/jobs: title, description, positive NGN
budget, existing category enum (including tutoring) and optional deadline. Server
validation rejects invalid title/budget/category/description/deadline inputs with
400 responses. Identity still comes from authentication. The form does not call
payments, create orders, select an applicant or change hiring permissions.

No automatic POST retries are introduced. Double clicks are locked while pending.
After an uncertain network/server response, the form directs the user to check
posted jobs before explicitly allowing another attempt. The existing creation API
has no server-side idempotency key; manual re-submission can still create another
job, so this limitation is not described as server-enforced deduplication.

## Files / boundaries

Frontend: src/components/Marketplace.js, marketplace-header.css,
src/app/home.css, src/app/cart/page.js, src/app/applications/page.js,
applications.module.css, src/app/jobs/create/page.js, job-create.module.css,
and this report. The existing Marketplace bell-icon edit is preserved locally
and excluded from this release, along with the unfinished dashboard redesign.
Backend: src/services/jobApplicationService.js (poster name),
src/controllers/jobController.js (creation validation).

Pre-existing dashboard redesign/CSS/screenshots/check script remain unchanged.
Application selection, withdrawal and hiring API routes are unchanged. No database
configuration, migration, payment guard, order-workspace behaviour, stock/cart
logic or Phase 2A work is changed. No new packages or environment variables.

Reviewed source, API request/response fields, CSS ownership/cascade and Git diffs.
No automated tests, browser checks, local builds or live feature requests were run.
No jobs/orders/applications were created. Rendering, compilation and runtime
behaviour remain UNVERIFIED. This report was prepared before publication.
Publication is now authorized separately; a push alone is not deployment evidence.
