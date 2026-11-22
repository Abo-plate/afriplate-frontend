# Seller approval UI fix

Prepared against frontend 7e100c1 and backend d07e8e3. Local commit only: no push,
deployment, tests, builds, browser checks, ID uploads or test orders.

The backend now supplies private user.selling_access on login and /auth/me from
one current-review permission service. UI checks account_id and allowed; a role,
student choice or cached vendor flag alone does not expose publishing forms.
Missing permission metadata fails closed. Legacy unconfirmed seller UI access is
preserved. Browsing, buying, messaging, Settings and order history remain available.

- Mobile Sell takes blocked accounts to /sell.
- Student Sell uses the existing private ID form, with Submit your student ID,
  Your ID is under review or Upload a replacement and the reviewer reason.
- Non-student Settings uses the same server next step and reason, including
  Application declined. /sell retains its private application/status/reapply form.
- Publishing forms consult canUseSellerTools. Existing seller dashboard and order
  sections remain accessible; their availability is not publishing authorization.
- Confirmed ID saves and clean changed-status reads request a background session
  refresh. Upload confirmation still does not await or depend on that refresh.

Only the SellerNextStep import, permission helper import, Sell banner, listing-form
check and dashboard view selection are staged from the mixed dashboard file. The
unfinished dashboard layout, Marketplace icon, Applications edits, CSS and review
screenshots/script remain uncommitted.

No migration or setup variable is added. Migration 010 stays as shipped. In a later
authorized release, deploy the backend first, confirm its exact revision/readiness,
then deploy the matching frontend. Permission races, HTTP actions, old sessions,
review-state transitions and mobile behaviour remain runtime-unverified. See the
backend docs/SELLER_APPROVAL_FIX.md for the record checks and transaction boundary.
