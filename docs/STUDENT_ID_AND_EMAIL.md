# Student identification, email recovery and mobile controls

Release contents reviewed locally. Publication was authorized after review; deployment evidence is reported separately.
Feature runtime behavior is UNVERIFIED. No automated tests, local build, browser checks or test orders were run.
Only code/diff, import and syntax review were performed. Existing dashboard redesign and icon work remain local.

- Removed the root floating Cart and its extra mobile clearance/blanket hide rules.
- Product browsing (including homepage) and product details use one Cart in the shared header.
  It retains the existing server-confirmed count. Signup/login/messages/dashboard do not render Cart.
  The Home / Explore / Sell / Messages / Account bar remains unchanged.
- Reused MarketplaceHeader on product pages, keeping account controls in its compact mobile menu.
- Chat hides the native file-picker chrome behind Attach, constrains controls and long filenames,
  gives the message field a flexible minimum width and retains the keyboard-aware visual viewport
  and navigation clearance. Server-confirmed message persistence/retry behavior is unchanged.
- Signup Campus step collects university, matric and a JPEG/PNG student ID photo (5 MB).
  Uses the backend university catalog and stable IDs; Other asks for a full university name.
  Multipart registration saves account and private ID together. No product/Cloudinary upload is used.
- Confirmation says Student ID under review. Existing users submit/resubmit at Dashboard ->
  Settings -> Student identification. Approved public seller profiles alone show Verified student.
- /admin is restricted to a validated admin session; every backend action independently requires
  current database-backed admin authorization. Public signup cannot choose admin. Private queue
  shows pending/approved/replacement statuses, real counts, photo preview and review notes.
  Blob preview URLs are revoked on hide/unmount and are never stored publicly or in browser storage.
- Matching ID files are flagged privately. Legacy identity conflicts block approval. Replacement
  requires a reason; shared-file approval requires a reason and explicit acknowledgment. No self-approval.
- Existing verification accounts can retry at /resend-verification, from confirmation, or via login.
  Config/provider error codes are explained without exposing values or claiming inbox delivery.
- Identity review is independent of email verification and does not remove existing account access.
  ID approval does not grant any financial permission or trigger payment.

Backend migration 006 applies through the existing startup migration runner after 005, later on
an authorized deployment. It was not manually run during implementation. Deploy the reviewed backend before the new
signup form is used live. Old JSON-only registration clients need the multipart identification fields.
No new frontend environment variable is required; the existing NEXT_PUBLIC_API_URL is used.
Never add RESEND_API_KEY, identity documents, database credentials or server-only keys to public variables.

Exact Railway/Resend setup, private storage/retention limitations and parameterized founder-admin
access instructions: sibling backend docs/STUDENT_ID_AND_EMAIL_RELEASE.md.
Railway configuration, Resend sender verification, current production conflict counts, inbox
arrival and narrow-phone keyboard behavior remain unconfirmed. No tests were added or executed.

## Signup confirmation follow-up

The saved-account response is independent of email provider latency. After HTTP 201 with a
valid account ID, signup focuses a visible Student ID under review confirmation. Errors and
validation feedback are placed beside Create Account and focused, rather than appearing above
the long Campus step. Pending upload/save status is shown and the request has a 90-second
bound; a timeout explains that the account may already exist and does not retry automatically.
Malformed/non-JSON server responses cannot silently claim success. Secure UUID creation also
supports browsers with crypto.getRandomValues but no crypto.randomUUID.

Email status queued means an unconfirmed best-effort server attempt, not a durable outbox,
provider acceptance or inbox delivery. Student ID approval remains a separate admin action.
The original failed signup response/server error was unavailable; its exact rejection cause
is unconfirmed. No signup was submitted and no account or test order was created during review.
