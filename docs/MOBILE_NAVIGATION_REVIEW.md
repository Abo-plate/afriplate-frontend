# Shared mobile navigation ? review build

15 November 2026. Local changes only; no commit, push or deployment for this work.
The existing cart/checkout edits and all backend work were preserved.

## Behaviour

One shared component, components/MobileBottomNav.js, appears through 768px on
public pages and buyer/seller dashboards. Five equally spaced outline-icon tabs:
Home, Explore, Sell, Messages and Account. Explore exposes Products, Services and
Jobs. Account points to dashboard only after validated login, otherwise login.
Sell opens product/service choices; guests return through login to the selected
existing creation form. Buyers get seller-account guidance; no fake conversion or
verification badge is introduced. Existing backend responses remain authoritative.

Both old dashboard bottom bars and their styles are removed. A labelled internal
section selector keeps every buyer/seller section accessible on mobile; desktop
sidebars remain. Their icons now use the same outline icon component.

The fixed bar has a subtle top border, Inter font declaration, green active state,
48px-or-larger touch areas, safe-area padding and one shared content-clearance
variable. It hides while text inputs are focused and restores on blur. Messaging
sizes against the visual viewport, including keyboards that leave layout height
unchanged. Viewport metadata supports edge-to-edge safe areas and content resizing.
Menus close on Escape, outside click or selection. No emoji icons are used in the
new navigation or dashboard section icons. Existing unrelated content is retained.

Unread badges use only the authenticated GET /api/messages/unread-count response's
integer unread field. Zero, invalid, missing or failed counts show no badge.
Polling is every 15 seconds and stops on logout; guests never see stale counts.
Backend message ownership, persistent attachments and deduplication still require
the prepared Phase 1 backend deployment. The listing-create endpoints currently
require authentication but do not enforce seller role themselves; this frontend
restriction does not replace server authorization. No backend was modified here.

## Validation

- Production build passed (Next.js 16.1.6). Existing images.domains warning remains.
- Four endpoint unit tests passed; targeted lint passed for the shared navigation,
  messages, login and layout files. git diff --check passed.
- Fifteen Chrome checks passed, zero browser runtime errors. Public product/service/
  job routes, all three listing-detail types, both dashboards and messaging passed
  at 320, 390 and 768px. Checks assert one bar, no old bars, viewport anchoring,
  clearance, equal widths, route state and no horizontal overflow.
- Tests cover invalid stored tokens, immediate login/logout, safe Sell return paths,
  seller forms, buyer restrictions, internal sections, menus, unread zero/missing,
  session outages, messaging retry IDs, attachments and email UI regressions.
- Keyboard tests cover focused listing inputs, focus/blur restoration, a resized
  460px viewport and a simulated 320px visual-only viewport for the composer.
- All API data is synthetic fixture data. No production API, database, provider,
  real inbox or physical phone was tested. The pictured unread count and listings
  are fixtures, never demo fallback content in the app. External font requests are
  blocked by the test harness, so screenshots can use fallback glyphs; the bar's
  CSS font family is asserted as Inter. Physical iOS/Android safe areas and actual
  keyboard behaviour remain a recommended device smoke check.

Reproduce with npm run build; npm run start -- --hostname 127.0.0.1 --port 3107;
then node scripts/check-navigation.cjs. Tests save new screenshots to a temporary
Chrome profile, and block external requests. No new package was installed.

## Screenshot gallery

All images below come from the final passing run and are safe synthetic fixtures.

| Page | 320px | 390px | 768px |
| --- | --- | --- | --- |
| Guest Home | [320px](screenshots/mobile-navigation/guest-home-320.png) | [390px](screenshots/mobile-navigation/guest-home-390.png) | [768px](screenshots/mobile-navigation/guest-home-768.png) |
| Home | [320px](screenshots/mobile-navigation/home-320.png) | [390px](screenshots/mobile-navigation/home-390.png) | [768px](screenshots/mobile-navigation/home-768.png) |
| Products | [320px](screenshots/mobile-navigation/products-320.png) | [390px](screenshots/mobile-navigation/products-390.png) | [768px](screenshots/mobile-navigation/products-768.png) |
| Services | [320px](screenshots/mobile-navigation/services-320.png) | [390px](screenshots/mobile-navigation/services-390.png) | [768px](screenshots/mobile-navigation/services-768.png) |
| Jobs | [320px](screenshots/mobile-navigation/jobs-320.png) | [390px](screenshots/mobile-navigation/jobs-390.png) | [768px](screenshots/mobile-navigation/jobs-768.png) |
| Product detail | [320px](screenshots/mobile-navigation/listing-320.png) | [390px](screenshots/mobile-navigation/listing-390.png) | [768px](screenshots/mobile-navigation/listing-768.png) |
| Service detail | [320px](screenshots/mobile-navigation/service-listing-320.png) | [390px](screenshots/mobile-navigation/service-listing-390.png) | [768px](screenshots/mobile-navigation/service-listing-768.png) |
| Job detail | [320px](screenshots/mobile-navigation/job-listing-320.png) | [390px](screenshots/mobile-navigation/job-listing-390.png) | [768px](screenshots/mobile-navigation/job-listing-768.png) |
| Buyer dashboard | [320px](screenshots/mobile-navigation/buyer-dashboard-320.png) | [390px](screenshots/mobile-navigation/buyer-dashboard-390.png) | [768px](screenshots/mobile-navigation/buyer-dashboard-768.png) |
| Seller dashboard | [320px](screenshots/mobile-navigation/seller-dashboard-320.png) | [390px](screenshots/mobile-navigation/seller-dashboard-390.png) | [768px](screenshots/mobile-navigation/seller-dashboard-768.png) |
| Messages | [320px](screenshots/mobile-navigation/messages-320.png) | [390px](screenshots/mobile-navigation/messages-390.png) | [768px](screenshots/mobile-navigation/messages-768.png) |
| Service creation | [320px](screenshots/mobile-navigation/sell-service-320.png) | [390px](screenshots/mobile-navigation/sell-service-390.png) | [768px](screenshots/mobile-navigation/sell-service-768.png) |

Additional views: [Explore menu](screenshots/mobile-navigation/explore-menu-390.png),
[Product creation](screenshots/mobile-navigation/sell-product-390.png),
[Buyer seller guidance](screenshots/mobile-navigation/buyer-sell-guidance.png),
[Keyboard viewport](screenshots/mobile-navigation/messages-keyboard.png).
