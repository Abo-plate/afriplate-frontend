# Service listings and private chat offers

Prepared locally for review. No tests, build, browser checks, database writes, live
requests, commits, pushes or deployments were performed. Runtime behavior, SQL
execution, concurrent requests and narrow-phone layouts remain unverified.

## Listing contract

Service list, search and detail responses retain first_name, last_name and the
existing listing campus fields, and add seller_name, seller_avatar, seller_campus,
review_count and average_rating. The byline uses the owner's profile campus;
explicit listing locations remain separate. No existing listings are rewritten.
The rating summary uses the same verified, completed, paid-purchase predicate as
public reviews. No ratings, avatars, campus values or descriptions are fabricated.

## Private API

All endpoints require current authentication and conversation membership:

- POST /api/messages/conversations/:conversation_id/offers
  takes client_id (UUID), scope, price (naira decimal), delivery_days and
  revision_allowance (the listing's current allowance, for change detection).
- POST /api/messages/conversations/:conversation_id/offers/:offer_id/:action
  takes client_id; action is accept, decline or withdraw.

Only the actual service owner can send/withdraw. Only the other participant can
accept/decline. The buyer must have sent a saved message or attachment about that
service first. Product, direct and order chats cannot create service offers. There
is at most one pending offer per conversation. Pending offers do not expire
automatically; withdraw or decline before sending another. Public prices stay
unchanged. Sending requires an active listing/conversation and a known revision
allowance. Existing contact-sharing moderation is retained.

Opening the composer and drafting make no API write. Sending saves the offer and
one ordinary message atomically. The saved message drives inbox visibility and
unread counts. Workflow retry receipts and conversation locks prevent repeated
sends; replays do not republish Socket.io events. History attaches current offer
state. The frontend polls every five seconds while active and on focus; response
actions are synchronized through history, not a new incoming-message notification.

Acceptance locks the conversation/offer and creates one pending (unpaid) order,
links it uniquely to the offer, and records activity in the same transaction.
Repeated acceptance returns the same order, including with a new retry UUID.
Conflicting terminal actions return a controlled conflict. Roles are checked
before replaying actions. No payment evidence, ledger, payout or wallet is created.

Prices use integer kobo and half-up fee rounding. Existing service rules apply:
minimum NGN 1,000; buyer fee 2%; seller fee 11%; buyer total = price + buyer fee;
seller amount = price - seller fee. The maximum buyer total is NGN 99,999,999.99,
matching the existing order column precision. Scope, public title, price, fee
rates/amounts, delivery days (1-365) and revisions are snapshotted. The existing
workspace is reused. Delivery days run from the guarded start-of-work action,
after requirements/agreement and verified payment; acceptance starts no clock.
An already mutually agreed deadline extension is preserved.

## Personal deletion and private attachments

Migration 007's per-user visibility applies to offer cards, history, inbox previews
and unread counts. Deleting a card does not withdraw its offer or remove its terms.
Accepted orders remain linked in conversation context even if all cards are hidden,
and remain accessible through the participant-only workspace/order history. A hidden
card is not restored by retry, polling or an action response. Existing private
attachment validation, authenticated downloads and message ownership are retained.

## Schema and release setup

Include both 007_message_visibility.sql and 008_service_chat_offers.sql. The existing
src/config/bootstrap.js invokes src/migrations/index.js before listening. That
runner orders numbered SQL files lexically and tracks them in schema_migrations,
so 007 follows 006 and 008 follows 007. No separate migration command is required
by that startup path. Neither new migration has been applied during this work.

007 adds personal-deletion markers. 008 creates service_chat_offers and nullable
unique links from messages and orders. Existing messages, listings, orders and
attachments are not deleted or backfilled. Existing rows have no offer link.
There are no new packages or environment variables. Working database/TLS settings
and real-money middleware remain unchanged. The checkout UI blocks payment and
does not initialize a provider transaction; no fake-payment endpoint was added.

Deploy matching frontend/backend only after review. Source checks do not establish
live delivery, payment readiness, migration success or two-participant correctness.
