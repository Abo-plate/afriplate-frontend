# Listing campus trace and contract

Registration sends university; authController saves it in users.university.
The dashboard listing form currently omits university. Previously product/service
creation inserted only req.body.university, so omitted values became NULL.
Product/service list and search queries omitted seller_university; product detail
alone returned that field. Homepage MarketplaceCard read seller_university before
university, which also let a profile location override an explicit listing location.

The read contract now preserves raw listing university, exposes seller_university,
and adds campus = trimmed explicit listing university, else trimmed seller profile
university, else NULL. List, search and detail queries share this precedence;
university filtering uses it too. Jobs have no listing university column and expose
campus and poster_university from their poster profile. New product/service inserts
snapshot the authenticated seller's database campus only when no nonblank explicit
location is supplied. No browsing user's profile or hardcoded campus is consulted.

Existing records were not updated or backfilled. Missing listing locations resolve
at read time only. If both sources are absent the UI still honestly says Campus not
provided. Actual live API rows and affected existing record IDs remain unconfirmed:
no production API/database or existing local database was accessed. The regression
suite compares controller JSON from real queries against an isolated PostgreSQL
fixture database; this is not evidence about deployed records.

Before any record cleanup, a separately authorized read-only audit should list
product/service IDs whose NULLIF(BTRIM(university),'') IS NULL, joining their seller
IDs to users to distinguish recoverable profile fallback from missing-both values.
Review the returned IDs before proposing any backfill. No migration is required.

Frontend listingCampus consistently prioritizes explicit listing university, then
canonical campus, then legacy seller/poster fields; listing grids and detail pages
use it. Seller identity panels retain the seller profile campus separately.

These backend changes and the frontend changes must both be deployed to fix legacy
missing-location cards. A frontend-only deployment cannot invent omitted API data.

Validation: frontend campus unit tests and production build passed; 76 backend tests passed, including real isolated PostgreSQL campus regressions. No live records were read or modified.
