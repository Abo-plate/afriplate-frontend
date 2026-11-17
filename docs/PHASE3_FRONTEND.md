# Phase 3 frontend ? local and runtime unverified

No tests, browser checks, builds or test orders were run/created. This handoff was prepared before publication; the combined release is now
authorized separately. A successful push alone does not confirm deployment. Source and diff review only. Existing
unfinished dashboard layout/Marketplace changes are preserved.

New routes:

- /orders/:id: participant workspace with snapshotted scope/fees, explicit buyer
  and seller agreement, versioned buyer instructions/topics/scheduling preferences,
  private files, progress/deadline, deliveries/revisions, extension approval,
  existing private order chat and timestamped activity history.
- /applications: private own applications and owned-job links. Job detail uses
  JobApplicationsPanel for proposals, own portfolio references, withdrawal, private
  owner review, rejection and selection of a single applicant.

Existing purchase and received-order cards link to the workspace. Dashboard menus
link to applications. The shared Home/Explore/Sell/Messages/Account bar is retained;
Account is highlighted for orders/applications. Desktop/mobile styles, loading,
empty, error and confirmed-success states are implemented but not rendered/checked.
Explicit refresh controls retrieve other-party changes; order chat uses its existing
polling. No service listing structure, tiers, packages or custom offers were added.

API contract:

- GET /api/orders/:id returns order, participants, requirements, requirements_status,
  deliveries, revisions, deadline_requests, activity, private file metadata.
- POST /api/orders/:id/actions/:action takes client_id plus action payload. Actions:
  terms, requirements, agree, start, deliver, revision, accept, deadline_request,
  deadline_respond. Term/requirement agreement is separate from payment.
- POST /api/orders/:id/files?purpose=requirements|delivery&client_id=UUID takes one
  multipart file. PNG/JPEG/PDF up to 5 MB; three per published submission. Draft
  upload selection is explicit. Download via authenticated GET /files/:fileId,
  saved as a blob attachment instead of opening untrusted contents inline.
- Existing POST /api/messages/conversations accepts order_id for participant-only
  order chat. PrivateMessages uses its optional orderId prop; listing/direct chat
  and message/attachment retry contracts remain intact.
- GET /api/jobs/applications/mine, GET /api/jobs/posted/mine, GET
  /api/jobs/:id/applications (owner only), GET /api/jobs/:id/applied (own status).
- POST /api/jobs/:id/apply: proposal, portfolio_ids, client_id. Other decisions use
  POST /api/jobs/:id/applications/withdraw|hire|reject with application_id, client_id.

useWorkflowCommand blocks simultaneous requests and retains a UUID for retries
with the same path/details until a successful server response. Keys are retained
in mounted-page memory, not across tab closure/reload. Refresh state after uncertain
results/reloads. Server uniqueness/state checks remain authoritative. Cached private
responses are bound to the validated account; stale responses are discarded.

Requirements can be prepared before payment. Work start, delivery, revision and
acceptance remain disabled without trusted payment evidence and an order already
processing. Selecting an applicant creates a pending UNPAID order with the poster
as buyer and worker as seller. No action collects money. Acceptance records
completion and explicitly does NOT pay out. Existing real-money guards remain.

Required setup: matching backend and migration 005 (depends on Phase 2B migration
004). No new variables or packages; NEXT_PUBLIC_API_URL remains the API setting.
Order files are in persistent private PostgreSQL storage, not public Cloudinary.
Original listing scope/price/revisions are frozen at order creation. Open legacy
orders need explicit original terms for both parties to confirm; no history is
invented. Scope/allowance renegotiation after recording is not added; deadline
extensions require the other participant's approval. Scheduling is text, not a
calendar booking system. File retention/history pagination remain later work.

Full schema/state/permission details and changed backend file list are in the
sibling backend docs/PHASE3.md. Runtime behaviour, compilation, migration execution,
concurrency, permissions and desktop/mobile rendering are UNVERIFIED.

## Release review

Phase 2B is retained from ca7b5f1. The Phase 3 release includes all new workspace,
application and retry-hook files, dashboard feature links and order-context chat.
Chat state resets when account/order changes. The unfinished dashboard redesign,
its CSS/screenshots/check script, and Marketplace whitespace edit remain local.
No new environment variables or packages are needed. Backend startup applies
unapplied 004 then 005 automatically before serving; no separate command is needed.
Migration execution and authenticated feature behaviour remain unverified.
No tests, local builds, browser checks or test orders were run for this review.
