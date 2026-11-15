> Updated mobile navigation: the earlier separate dashboard bar is now replaced
> by one shared five-tab bar. See [MOBILE_NAVIGATION_REVIEW.md](MOBILE_NAVIGATION_REVIEW.md)
> for the latest behaviour, 15-check results and 320/390/768px screenshots.
> Earlier entries below describe the previous Phase 1 baseline.

# Navigation and activity investigation

The frontend lives in this repository, separately from afriplate-backend.

## Verification

Build with npm run build. Start that build on localhost using:

    npm run start -- --hostname 127.0.0.1 --port 3107

In another terminal run:

    node scripts/check-navigation.cjs

The script uses installed Google Chrome and Node's built-in WebSocket client;
no browser package is needed. NAV_TEST_CHROME can select another Chromium binary.
It uses a fresh temporary browser profile. API calls are intercepted with fixtures,
other external page requests are blocked, and no live backend/database is queried.
The numeric order/user IDs in the test are fixtures, not findings about real records.

Checks cover guest navigation, invalid tokens, immediate login/logout updates,
buyer/seller dashboards at mobile widths, safe content clearance, profile settings,
marketplace menus, desktop navigation, session-validation outages and retry.

## Old activity source

No Itel power bank title or dated demo order was found in frontend source. Seller
Recent Activity initializes empty and maps the orders returned from
GET /api/orders?role=seller&limit=6. The displayed title uses product_title or
service_title, the status comes from status, and the date comes from created_at.
The backend query joins orders to listings and exposes ordered_at as created_at.
The activity list does not restore orders from browser storage. Browser storage
holds the authentication token and user profile, which can select a different
API account; it does not supply this activity content.

Therefore the code path is API-backed. The actual old order ID, response, connected
database and database environment have not been inspected and remain unconfirmed.
Activity DOM rows now retain the returned ID in data-order-id for investigation.
No database records were removed and no demo-order fallback was found to remove.

The separately inspected backend local .env still references Supabase. This does
not prove which database the deployed frontend/backend used for the old activity.
Check the browser's orders response and the deployed API configuration privately
before considering record cleanup. Never put credentials in screenshots or logs.
