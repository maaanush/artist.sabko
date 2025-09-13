Core flows (step-by-step)
1) Invite-only signup

Admin enters email in Admin Dashboard → creates row in invites (status invited).

EmailJS sends a static signup URL (no token).

Artist opens signup page → submits name, email, password, checks T&C (modal).

Backend verifies email is whitelisted & unused → creates Supabase Auth user, users + artist_profile.

Record T&C acceptance audit (user, version, timestamp, IP).

First-run onboarding → profile picture (resized to 300×300 then stored in profile-pictures), pronouns (opt), location, phone → land on dashboard.

2) Upload artwork (15 live cap)

Artist opens Artworks tab → clicks Upload.

Frontend requests presigned URL for artworks-live/{artist_id}/{artwork_id}.{ext} (enforce ≤ 50 MB and allowed types).

On success, create artworks row (is_active=true, title, notes). Default category toggles ON for all existing categories.

Slack notification posts (via Edge Function or webhook) with short-TTL link or deep link to the file page.

Cap enforcement: if artist at limit, Disable upload and prompt to swap or delete.

3) Swap / Delete → Archive

Artist chooses Swap or Delete on an artwork.

Edge Function (recommended) moves current file from artworks-live → artworks-archive/{artist_id}/{artwork_id}/{timestamp} and updates archive_items.

For Swap, accept new file → update artworks.file_url (still counts toward live cap).

UI reflects live count and slots left.

4) Margins & pricing

Admin manages categories (categories table): create/rename/soft-disable, set base_price and default_margin.

Artist sets global per-category margin (flat amount) in Margins tab.

Retail shown as Base + Margin (informational).

Base price changes → retail recalculates instantly in UI/exports.

Default margin applies only to artists who have not customized; custom overrides persist on admin updates.

5) Remove user (deactivate + auto-archive)

Admin clicks Remove user on Artists list.

System deactivates the user (blocks login).

All live artworks auto-move to archive (Edge Function batch), retaining history and clearing live slots.

Payout records and audits remain for compliance.

6) Payments (manual payouts)

Artist fills Payments tab (India-only): bank details, PAN (required), GSTIN (optional).

Values masked in UI; Admins can export CSV (one-time export with audit entry).

Payouts are handled manually outside the system.

Components & responsibilities (at a glance)

Frontend (Vite + React)

Tabs: Artworks / Margins / Payments; Admin views: Artists, Categories

Validates file types/size; shows 15/15 live quota; thumbnails/icons

No secrets; uses Supabase JS; opens T&C modal; polished desktop-first UX

Supabase Auth

Two roles: artist, admin

Invite-only: signup allowed only if email in invites and unused

Supabase Postgres

Tables: users, invites, artist_profile, terms_acceptance_audit,
categories, artist_margins, artworks, artwork_category_toggle,
archive_items, payments_bank, audit_log

RLS: artists only see their own rows; admin full access

Supabase Storage

Buckets: artworks-live, artworks-archive, profile-pictures

Presigned URLs (short TTL) for Slack and controlled downloads

Edge Functions (recommended)

Archive moves, bulk deactivation archival, secure CSV export, Slack notifier

Server-side validation (cap enforcement, input sanity checks)

EmailJS

Sends static signup link invite emails

Slack

Receives upload alerts; links are short-lived or deep links behind auth

Security & privacy posture (v1 “Good”)

Access control with RLS; two roles only

Invite-only signup; no email verification by design

Bank/PAN/GSTIN masked in UI; admin-only full export

Short-TTL presigned URLs in Slack

Audit logs for sensitive actions (uploads, margin/bank edits, exports, deactivations)

Soft-disable categories; rename preserves mappings

Scalability notes (for your 3–6 mo targets)

Expected scale: 10–15 artists; ~10–12 artworks each; 10–30 MB per file

Storage/CDN: Supabase Storage handles this easily; consider resumable uploads to smooth flaky networks

DB indices: on artist_id for artworks, archive_items, artist_margins; on email for users/invites

Ops: Optional nightly manifest CSV by artist/date if batching helps production