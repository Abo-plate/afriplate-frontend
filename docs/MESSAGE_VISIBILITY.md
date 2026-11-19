# Private drafts and personal message deletion

Prepared locally for review. No commits, pushes, deployments, tests, local build,
browser checks, live API requests, database changes or test orders were performed.
Runtime and desktop/mobile behavior remain unverified.

The implementation is shared by standalone /messages, Dashboard -> Messages and
order-workspace messaging through src/components/PrivateMessages.js. The unfinished
dashboard layout, its screenshots/check script and the existing bell-icon edit were
preserved. The five mobile navigation tabs and current theme tokens remain intact.

## Behavior

- Opening Message seller still obtains the canonical listing-specific conversation,
  but does not add a draft to either inbox. Draft text stays in component memory.
  A private unbound upload is not a sent attachment and creates no recipient activity.
- Inbox visibility/previews/unread counts come from the backend's visible saved
  messages. Existing empty threads are filtered without deleting or merging them.
  Returning to the same buyer/seller/listing reuses the canonical conversation.
- Each sent or received message has a touch-sized outline three-dot action button.
  Delete for me opens a confirmation with Cancel/Delete, keyboard focus handling,
  busy feedback, error feedback and Retry delete. There is no optimistic removal.
- A successful DELETE applies the server's filtered history and inbox snapshot.
  Deleting the last visible message hides the inbox entry; the open composer can
  remain available without making an inbox entry. A later saved message restores it.
- Personal deletion affects only this authenticated account and is stored in
  PostgreSQL. The other participant keeps their messages and private attachments.
  Refresh, older-page reads and another device use the same stored visibility rules.
- The client tracks personal visibility versions. Stale pages cannot re-add a hidden
  message; a newer deletion version refreshes the cached history. Newer saved messages
  are retained if an older deletion snapshot arrives late. Read receipts do not regress.
- Failed deletion leaves the message in place and allows retry. If a response is lost
  after the server commits, canonical polling can reveal that it already succeeded;
  repeating the DELETE is safe. A failed refresh is not presented as an unsaved send.
- Conversation/history polling remains every five seconds while this view is active,
  with refresh on focus. Other devices therefore synchronize through polling; browser
  background throttling can delay it. No new Socket.io dependency was installed.
- The shared mobile badge uses server-derived counts, refreshed on confirmed message
  changes. Request sequencing prevents an older unread response from undoing deletion.
- Focus/session validation for the same user retains a draft. Login/logout/account
  changes isolate private state and discard stale asynchronous responses. Draft text
  and unbound attachment selections are not persisted across a page reload.

## Backend contract and setup

Requires additive backend migration 007_message_visibility.sql after 006, through the
existing startup migration runner. It was not applied locally. No new env variables
or packages are required. Existing authentication, listing/order keys, file validation,
private download URLs and retry UUIDs are retained. No payment operation is enabled.

Added: DELETE /api/messages/conversations/:conversation_id/messages/:message_id.
The response contains the canonical history/inbox/unread snapshot for the deleting
account. History includes visibility_version, snapshot_last_id and read_count.
A replay of a hidden send returns hidden_for_me rather than restoring that message.
Socket consumers also have delete_message and the owner-only message_hidden event;
the current shared frontend uses HTTP polling.

Backend details: sibling afriplate-backend/docs/MESSAGE_VISIBILITY.md.
Deploy both sides after review and refresh old browser tabs. No deployment or runtime
success is claimed from static source parsing or diff review.

Service offer cards follow the same personal visibility rules. See
[SERVICE_CHAT_OFFERS.md](SERVICE_CHAT_OFFERS.md) for migration 008, the offer
contract and immutable unpaid-order terms. Hiding a card does not withdraw it.
