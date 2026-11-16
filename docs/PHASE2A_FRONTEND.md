# Phase 2A frontend ? unpublished review

Search now waits for URL initialization, discards stale responses, passes q and
all filters to the product API, retains the URL for refresh, and uses explicit
pagination. Search clearing restores the unsearched list. The backend implements
matching/price/campus/category filtering and stable sorting. No-match and fetch
errors remain distinct. Popularity sorting was removed because it had no real data.

The shared CartProvider polls one authenticated server cart, updates on mutations
and focus, and never derives a badge from local demo data. Cart entry is in desktop
account navigation and floats above the unchanged five-tab mobile bar. It hides
with the keyboard and page clearance includes both controls. Logout hides private
cart data. Signed-in carts live in PostgreSQL, so login/refresh restores them.

Product details submit product_id, quantity and expected_unit_price; paused,
sold-out and unknown inventory cannot be added. The cart uses server summary and
line totals, quantity controls, removal, current-stock notices and explicit current
price acceptance. Checkout stays disabled; saving a cart does not reserve stock.
The older checkout client now supplies its displayed price and single-item quantity
when creating a product order; real-money backend guards remain closed.

Seller create form asks for a nonnegative whole-number quantity and Available or
Paused state. My Listings includes editable inventory with save feedback and
pagination. Existing unfinished dashboard layout/styles were preserved. The
seller summary reads total (falling back to count for older responses).

Backend migration 003 is required before using this frontend with its cart and
inventory APIs. Deploy neither side until reviewed. Public listing IDs 2, 3 and 4
currently expose no stock fields; sellers must supply quantities after migration.
No backfill or production records were changed. Email is unchanged and remains
paused. No messaging component was edited.

Validation: production build passed; 7 frontend unit tests passed; 20 Phase 2A
Chrome fixture checks passed; 15 existing navigation/messaging browser checks also passed. Phase 2A covered 320, 390, 768 and 1440px, including combined search
requests, clearing, quantity persistence, inventory saves and guest state. Browser
API data is mocked and external traffic blocked. Backend real PostgreSQL tests
are documented in the sibling docs/PHASE2A.md. This is not live deployment testing.

Screenshots (fixtures):

- [Search at 320px](screenshots/phase2a/search-320.png)
- [No results at 390px](screenshots/phase2a/search-no-results-390.png)
- [Cart at 390px](screenshots/phase2a/cart-390.png)
- [Cart at 1440px](screenshots/phase2a/cart-1440.png)
- [Seller create at 390px](screenshots/phase2a/seller-create-390.png)
- [Seller inventory at 390px](screenshots/phase2a/seller-inventory-390.png)

Reproduce with npm run build, npm run start -- --hostname 127.0.0.1 --port 3108,
then node scripts/check-phase2a.cjs. Do not use production credentials in browser
fixtures. No package installations, commits, pushes or deployments were made.
