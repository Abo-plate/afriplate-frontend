> Updated mobile navigation: the earlier separate dashboard bar is now replaced
> by one shared five-tab bar. See [MOBILE_NAVIGATION_REVIEW.md](MOBILE_NAVIGATION_REVIEW.md)
> for the latest behaviour, 15-check results and 320/390/768px screenshots.
> Earlier entries below describe the previous Phase 1 baseline.

# Phase 1 frontend-only continuation

Backend files and settings are untouched in this continuation. Existing escrow
screens and the approved green-and-white design are retained. Real funding/release
eligibility remains a separate backend/provider prerequisite, not a frontend claim.

## Completed frontend paths

- Session restoration is validated by /api/auth/me. Login/logout updates shared
  navigation immediately. Background focus checks retain a validated session while
  rechecking, preventing file-dialog focus from discarding a message draft.
- Dashboard routes have only their dashboard mobile bottom bar; public pages keep
  the global mobile navigation with content clearance.
- Listing Message links include seller_id via to plus product_id/service_id. Guest
  users return to the intended conversation after a validated login. Opening a
  conversation calls POST /messages/conversations and never sends a fake greeting.
- Standalone and dashboard chat share one component with the existing chat styles.
  Reads/sends use canonical conversation IDs, not guessed user IDs. Server failures
  are shown and messages are displayed only after a successful API response.
- Optional UUID client_id is retained across retries. Attachments upload privately
  to the conversation API, then send only attachment IDs; authenticated downloads
  are saved as files rather than rendered as untrusted HTML. Client validation is
  an aid; server signature/size/ownership enforcement remains required.
- Conversation lists/unread counts and active history poll every five seconds.
  Older history is paginated. No socket-client dependency was added.
- Verification avoids duplicate token consumption during React effect replay.
  Resend/reset/verification use the same normalized API origin, whether the
  configured public URL ends in /api or not. Reset clears a previous session;
  signup validation matches the existing eight-character backend minimum.

## Provider setup required (not performed)

The existing backend implementation uses Resend over HTTPS. Railway Hobby requires
HTTPS email rather than SMTP. See https://docs.railway.com/networking/outbound-networking
and https://resend.com/docs/dashboard/domains/introduction .

Privately configure the backend with EMAIL_PROVIDER=resend, RESEND_API_KEY,
EMAIL_FROM at a verified sending domain, FRONTEND_URL as the trusted HTTPS frontend
origin, NODE_ENV=production and CORS_ORIGIN. A Resend account, owned sending domain,
verified SPF/DKIM and a sending API key are required for general-user production email.
Without a domain, the prepared backend also supports EMAIL_MODE=owner_test with
EMAIL_TEST_RECIPIENT set privately to the Resend account email. That mode forces
onboarding@resend.dev and blocks other recipients; it is not production email
readiness. See the backend docs/RESEND_OWNER_TEST.md for the private inbox checklist. No account was created, domain
purchased, backend variable changed or email sent by this continuation.

The frontend needs only NEXT_PUBLIC_API_URL. Never put provider keys or database
credentials in NEXT_PUBLIC variables. A provider acceptance response does not prove
inbox delivery. Registration, resend and password-reset inbox/link tests remain
unverified until an authorized real mailbox test is completed.

## Phase boundaries

The feature assessment already recorded for the overall project remains relevant.
Phase 1 backend HTTP/Socket.io security and persistence require the prepared backend
version to be deployed separately; this frontend cannot enforce database ownership.
Phases 2-4 (inventory reservations, review enforcement, portfolios, service package,
workspaces, revisions, hiring, disputes, milestones and ledgers) need backend models
and APIs. They are not represented here as completed or implemented with fake data.
No custom offers, tiers, paid bidding or connects were added.

Run npm run build, start the production frontend on 127.0.0.1:3107, then run
node scripts/check-navigation.cjs. Browser checks intercept API fixtures and block
external requests; they are not live, provider, database or inbox tests.

## Validation results

- Production build: passed (Next.js 16.1.6). Existing images.domains deprecation
  warning remains unrelated to this work.
- Four API-origin normalization unit tests: passed, without network access.
- Thirteen Chrome browser checks against the production build: passed, with no
  runtime errors. All backend/API responses were fixtures and external requests
  were blocked. They include invalid stored tokens, immediate login/logout,
  buyer/seller mobile bars, listing routing, no automatic greeting, retained retry
  IDs, upload UI and draft retention across focus validation, self-message refusal,
  resend failure/success, one verification request, forgot-password feedback and
  expired/valid/missing reset tokens.
- Dashboard widths 320/390/768, chat widths 320/390/1280 and desktop account menus
  were checked. Mobile composers remain above the global bottom navigation.
- Affected messaging/email/shared-API/session files pass targeted ESLint.
- Live inbox delivery, deployed API compatibility and production authentication
  remain unverified. No backend files, provider settings or database records were
  changed in this continuation. No commit, push, deployment or purchase was made.


## Frontend release validation ? 15 November 2026

The production build, four endpoint-normalization unit tests and thirteen
fixture-based Chrome checks passed again before commit. The existing
images.domains deprecation warning remains. No provider secrets or environment
files are included. This release requires the prepared Phase 1 backend to be
published separately for canonical conversation creation/history, authenticated
private uploads/downloads, retry deduplication, ownership enforcement and secure
HTTP/Socket.io sessions. HTTPS verification/resend/reset delivery also requires
the backend release and private provider configuration; no inbox delivery is claimed.
Vercel deployment status must be verified separately from a successful Git push.
