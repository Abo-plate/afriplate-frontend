# Non-student signup: local review

Prepared on 22 November 2026; publication was authorized after local review.
No local tests, builds, browser checks, account/application submissions, ID uploads
or test orders ran. Deployment/revision evidence is separate from workflow validation.
Source parsing/review does not verify runtime behaviour.

## Current published baseline

Frontend main/origin/main: 3bcf3f0 (after the owner's d83a89c reference).
Backend main/origin/main: 69f0a53 (after af57e91). Public Railway readiness returned
200 with that exact backend revision; public Vercel metadata reported production
success for that frontend revision. The four previously requested ID/admin/stock/
order features are present in that release, with business actions still unverified.
Full code/release evidence is in backend docs/NON_STUDENT_SIGNUP.md.

## Local changes

- Signup asks Are you currently a student? Yes retains the existing private-ID
  Campus step. No creates a buyer with two form steps and sends no campus/matric/
  level/photo fields. Confirmation matches the saved account type.
- Non-student Sell navigation opens /sell: Apply to sell on AfriPlate. Settings
  and existing buyer-dashboard Sell links also lead there. Existing student and
  legacy account flows are retained, not inferred from missing matric data.
- Applications collect a business/trading name and description. Drafts stay in
  memory; failed requests retain inputs and check the saved application on retry.
- Admin > Seller applications provides private pending/all/approved/declined
  lists, actual counts and approve/decline decisions. Decline requires a reason;
  the backend prevents self-review and conflicting or duplicate decisions.
- Approved applicants refresh their account to open the seller dashboard. Seller
  approval never renders Verified student. The existing student badge still
  requires approved student ID status.

## API agreement and setup

Signup POST /api/auth/register adds is_student (multipart true/false). The shared
session adds student_membership (student/non_student/unconfirmed), nullable
is_student and vendor_status (not_applied/pending/approved/declined).

GET/POST /api/auth/vendor-application are owner-only. POST fields: client_id,
business_name, description and expected_user_id. GET returns account_id,
student_membership, vendor_status and application; POST confirms account_id,
vendor_status and the saved application. Admin GET /api/admin/vendor-applications
accepts status/page; POST /api/admin/vendor-applications/:id/review accepts action
approve/decline and reason. Lists expose decision dates/reviewer to staff only.

Backend migration 010_non_student_vendors.sql is required after 009 through the
existing startup runner. Do not publish this frontend before that backend. No new
packages, environment variables, provider accounts or payment setup are required.
Legacy accounts default to unconfirmed; no bulk reclassification is included.
Explicit non-student to student conversion needs a later support/review path.

Unfinished dashboard layout, Applications and Marketplace icon work remain local.
Only narrow Settings/Sell eligibility changes were layered onto the dashboard.
Real signup, email, authorization, concurrent requests, private application review
and mobile behaviour remain unverified. Payments and working DB settings are unchanged.

## Product/signup cleanup in this release

The product detail Buyer Protection card and its three notices are removed.
Signup no longer shows the Resend verification footer link or confirmation button;
its unused resend/email-feedback state is removed. Existing email-provider and
account-recovery endpoints/pages are unchanged. Real-money routes remain disabled.
