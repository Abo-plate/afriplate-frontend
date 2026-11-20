# Seller listing count correction

Prepared locally on 20 November 2026. The user subsequently authorized publication;
deployment evidence is reported separately after checking the serving revisions.
No tests, builds, browser checks, private live-account reads or database writes
were performed. The actual listing totals for the reporting account are unconfirmed.

## Confirmed source cause

The published SellerOverview labels the card Active Listings / Products & services,
but requests only /api/products?mine=true&limit=1. It uses total if present, otherwise
the page's count, so an older/incomplete response can leave it at 1. Even when the
current products API returns a correct total, service listings are never included.
The unpublished dashboard redesign also used a products-only request and labelled
it Active products. The existing seller summary API had no listing counts.

## Correction

GET /api/orders/seller/dashboard-summary remains authenticated and retains all
existing fields. It adds summary.activeProducts, activeServices and activeListings.
The counts come from parameterized scalar COUNT queries restricted to req.user.id,
not from the size of a page or a join with order rows. The two counts share one SQL
statement snapshot. activeListings is their sum. Responses are private/no-store.

The frontend consumes these counts from the summary it already requests; there is
no extra product-page request or fallback to a fabricated 0/1. The card shows Active
listings, with a products/services breakdown. Failed/missing/malformed counts show
Unavailable. It refreshes on mounting/returning to Overview, window focus, visibility
and a confirmed listing-change event. Stale/unmounted responses cannot overwrite
newer account data. Successful create/remove actions emit that refresh event.

Active means status='active', matching the existing My Listings APIs. This counts
listing entries, not stock units, orders, prices or jobs. Paused inventory, sold-out
inventory and unconfirmed stock remain separate inventory states on active product
records; their values are not changed. Deleted/inactive listings are excluded.

No schema migration, packages, new variables or data correction is needed. Payment
guards, database connection settings, messaging and the unfinished dashboard layout
are preserved. Publish the backend before the frontend when release is authorized;
the old backend lacks the new count fields. Runtime totals, focus/change refresh
and layouts remain unverified under the instruction to skip tests.
