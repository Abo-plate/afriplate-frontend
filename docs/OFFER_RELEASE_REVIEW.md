# Offer and message visibility release review

Source review on 19 November 2026. The user authorized backend publication first,
then verification of the serving revision and /api/ready HTTP 200 before frontend
publication. Tests remain skipped. This document records source reasoning, not a
successful runtime concurrency or access-control test. Deployment evidence must be
reported separately after publication.

## Competing offer actions

serviceOfferService.respond begins a workflowCore.transaction. It locks the
conversation with messageService.member(..., true), then reads the listing FOR
SHARE and the matching offer FOR UPDATE. The locks remain held through commit or
rollback. Both Accept and Withdraw acquire those locks in the same order.

- Two Accept requests: the first creates a pending unpaid order and changes the
  offer to accepted in one transaction. The second sees accepted and returns the
  existing order without INSERT. The same UUID replays workflow_commands; a new
  UUID also returns the existing order through the terminal-state check.
- Accept versus Withdraw: the first committed action determines the outcome. If
  Accept wins, Withdraw sees accepted and returns 409. If Withdraw wins, Accept
  sees withdrawn and returns 409, with no order. If an action fails before commit,
  its order, offer update, activity and retry receipt all roll back together.
- Migration 008 independently makes orders.service_offer_id UNIQUE and
  service_chat_offers.order_id UNIQUE. A second order for the same offer cannot
  be inserted, even if application retry handling were accidentally bypassed.
  The offer check requires an order link exactly when accepted. One partial
  unique index allows at most one pending offer per conversation.

The boundary is one order per accepted offer, not one lifetime order per listing
or conversation: participants may agree a subsequent, separately sent offer.
Acceptance changes neither payment evidence nor money balances. No payment route
or database transport configuration is changed by this release.

## Authentication and durable terms

HTTP offer and personal-deletion endpoints require protect, which validates the
token against current account/auth-version state. The member query checks the
authenticated actor against the two conversation IDs. Offers use the actual
listing owner, rather than trusting the conversation's legacy role labels or any
request-supplied sender/buyer/seller IDs. Only that seller sends/withdraws; only
the other participant accepts/declines. Respond also checks the offer's service
and both participants match the locked conversation/listing before any replay.
Socket personal deletion reauthenticates on every event and uses the same member
and deletion service. It cannot grant access by joining a client-named room.

Delete for me inserts only the authenticated account's unique visibility marker.
It does not delete or update the message, the other person's marker/history,
attachments, offer scope/prices or order snapshots. Message ID must belong to the
authorized conversation. History, previews, unread counts and downloads consult
the viewer's marker. Agreed order links are returned in participant-only context
even when the card is hidden; the separate order workspace retains its snapshots.

## Existing conversations and migrations

007 creates an initially empty marker table and indexes. 008 creates an initially
empty offer table, plus nullable unique offer links on existing orders/messages.
PostgreSQL permits multiple NULL values in these ordinary unique constraints.
No old conversations are merged, rekeyed or removed; no legacy message, order or
attachment is backfilled or erased. Empty threads are filtered by reads, while
their existing canonical keys remain reusable.

The existing runner applies 007 then 008 after earlier migrations, inside one
transaction under its migration advisory lock, and records filenames only on
success. Bootstrap waits for it before opening HTTP. Failure rolls back that
migration transaction and fails startup; separate earlier base-table initialization
is not covered by that rollback. DDL needs table locks and can delay startup when
other transactions hold conflicting locks. These files do not silently tolerate
untracked manual tables/columns of the same names: such drift fails clearly.

## Findings fixed during this review

1. A completed frontend action retained its retry UUID indefinitely. An identical
   new offer after withdrawal could replay the withdrawn offer. Keys now survive
   only uncertain outcomes and clear after confirmed success. Pending guards and
   backend receipts still handle duplicate/uncertain sends.
2. The service list-view action read user without binding the session hook. It now
   uses the validated shared session, as the grid view already did.
3. Response actions now explicitly reject inconsistent service/participant links,
   in addition to the existing member, role and listing-owner checks.

## Validation limits

Syntax, undefined-variable, local-import, CSS parsing, credential-pattern and diff
review are source checks only. No automated tests, browser checks, test accounts,
test orders or direct production SQL were run. Concurrent actions, cross-device
deletion, two-participant attachment access, offer retries and mobile layouts need
runtime verification after review. Deployment/readiness observations establish
availability and revision, not these business behaviours.

Unfinished dashboard layout/CSS, dashboard screenshots/check script and the prior
bell icon edit must remain outside this release. The dashboard file needs no
service-label change relative to HEAD and is excluded entirely. Service wording
is updated in the services pages and shared mobile navigation. See SERVICE_CHAT_OFFERS.md and
MESSAGE_VISIBILITY.md for API/setup details.
