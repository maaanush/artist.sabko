
# masterplan.md

## 1) App overview & objectives

An invite-only **Artist Dashboard** for your in-house print-on-demand operation. Artists:

* Sign up via **admin invite** (no public signups)
* Upload **source files** (max 15 live at a time)
* Toggle which **product categories** each artwork is eligible for
* Set **global per-category margins** (Admin defines base prices & default margins)

Admins:

* Invite artists; manage categories, base prices, default margins
* View artists & their limits, margins, bank details
* **Deactivate** artists (auto-archive all live artworks)
* Restore from archive (admin-only)
* Export bank details for manual payouts
* Receive Slack alerts on new uploads

**Customer storefront is separate**; this dashboard is creators-only for intake, pricing, and payouts info.

---

## 2) Target audience

* **Primary:** India-based creators who want a simple way to provide source files and set margins without back-and-forth.
* **Internal users:** Admins operating production, pricing, and payouts.

---

## 3) Core features & functionality

### Artist

* **Onboarding:** Name, email, password; **T\&C modal (mandatory)**; first-run profile (profile picture, pronouns \[optional], location, phone).
* **Profile picture:** Uploaded to a dedicated bucket; **always resized to 300×300** before storage.
* **Artworks tab:**

  * Upload **one source file per artwork** (PNG, JPEG, TIFF, PDF, AI, PSD, Procreate; **≤ 50 MB**).
  * Required: **Title**; Optional: **Production notes** (internal-only).
  * **Category toggles** per artwork (on/off). New categories are **enabled by default** for existing artworks.
  * Actions: **Swap** file (old file moves to archive), **Delete** (moves to archive).
  * Gallery previews: show thumbnails when possible; otherwise show **file-type icon**.
  * Hard cap: **15 live artworks** (per-artist; overrideable by Admin).
* **Margins tab:**

  * Artist sets **global per-category margin** (flat amount).
  * **Admin default margin** applies until artist customizes; artist overrides are retained if Admin changes defaults later.
* **Payments tab (India-only):**

  * Bank details (Account holder, Account number, IFSC, Bank name, Account type), **PAN (required)**, **GSTIN (optional)**, phone/email for payouts.
  * Values **masked** in UI; artists can view/edit their own details.

### Admin

* **Invitations (invite-only signups):**

  * Admin adds an email to **Invites** table; system emails a **static signup URL**.
  * Signup allowed only if the email is in the whitelist and not used.
  * Actions: **Resend** / **Revoke** invite.
* **Artists list:**

  * Columns: Name/Email • Status (Invited/Active/Deactivated) • **Artworks `live/limit` + Slots left** • Margins set? • Bank details (Complete/Incomplete) • Last upload • Actions (**Remove user** = Deactivate + auto-archive, Reactivate, Resend invite, Override cap, View Archive, Export bank CSV).
* **Categories & pricing:**

  * Create/rename/soft-disable categories.
  * Fields: **Base price** and **Default margin** (applies only to artists who haven’t customized).
  * **Base price changes recalc retail instantly** (Retail = Base + Margin).
* **Archive controls:**

  * Per-artist Archive bucket (admin-only restore). Live bucket always holds at most the artist’s cap (default 15).
* **Payouts:**

  * Manual payouts; admin can **export bank details CSV** (admin-only).
* **Ops integrations:**

  * **Slack**: New upload notifications with **short-TTL signed links** or links back to the file page.

---

## 4) High-level stack recommendations

* **Frontend:** React + Vite (desktop-first, mobile-responsive). Clean, simple UI; drag-and-drop uploads on desktop.
* **Backend & data:** **Supabase** (Auth, Postgres, Storage, Row Level Security).
* **Storage (Supabase buckets):**

  * `artworks-live/{artist_id}/{artwork_id}.{ext}`
  * `artworks-archive/{artist_id}/{artwork_id}/{timestamp}.{ext}`
  * `profile-pictures/{artist_id}/avatar.jpg` (pre-resized to 300×300)
* **Email:** Existing EmailJS for invites (static signup link).
* **Comms:** Slack bot/webhook for upload alerts.
* **Observability (optional):** Sentry for error tracking; a simple audit log table for sensitive actions.

**Why this stack?** It keeps your current MVP choices, minimizes infra, and fits your initial scale (10–15 artists, \~10–12 artworks each, 10–30 MB per file).

---

## 5) Conceptual data model (high-level)

* **users**: id, name, email, role (`admin`/`artist`), status (`invited`/`active`/`deactivated`), created\_at
* **invites**: email, invited\_by\_admin\_id, status (`invited`/`revoked`/`used`), created\_at, used\_at
* **artist\_profile**: user\_id, pronouns, location, phone, profile\_picture\_url, artwork\_cap (default 15)
* **terms\_acceptance\_audit**: user\_id, terms\_version, accepted\_at, ip\_address
* **categories**: id, label, base\_price, default\_margin, is\_active (soft-disable), created\_at, updated\_at
* **artist\_margins**: artist\_id, category\_id, margin\_value, is\_custom (default false)
* **artworks**: id, artist\_id, title, notes\_internal, file\_url (live), created\_at, updated\_at, is\_active (true = live 15)
* **artwork\_category\_toggle**: artwork\_id, category\_id, is\_enabled (default true)
* **archive\_items**: id, artist\_id, artwork\_id, file\_url (archived), reason (`swap`/`delete`/`deactivate`), archived\_at
* **payments\_bank** (admin-only read in full): artist\_id, account\_holder, account\_number (stored & masked in UI), ifsc, bank\_name, account\_type, **pan**, gstin (nullable), phone, updated\_at
* **audit\_log** (lightweight): actor\_id, action, target\_type/id, metadata, occurred\_at

  * Actions to log: upload, swap, delete → archive, category toggle change, margin change, bank edit, admin restore, remove/deactivate, cap override, export.

---

## 6) UI & UX principles

* **Desktop-first** with responsive layouts; mobile supports viewing, toggles, margins, payments edits (uploads recommended on desktop).
* **Clarity over features:** Simple tabs (**Artworks / Margins / Payments**).
* **Fast feedback on limits:** “**15/15 live artworks**” progress with **Slots left**.
* **Friendly errors:** Clear reasons for rejected files (type/size > 50 MB).
* **Icons for complex files** (AI/PSD/PDF/Procreate); thumbnails where possible.
* **Margins UX:** Show effective **Retail = Base + Margin** so artists see the outcome.
* **Admin list:** Quick actions inline; search/filter by artist, status, completeness.

---

## 7) Security & privacy (v1 “Good” posture)

* **Access control:** 2 roles (Admin, Artist) with RLS on all data.
* **Invite-only signups:** Static URL + whitelist check (no email verification by design).
* **Sensitive data handling:** Bank details masked in UI; **admin-only full view & export**.
* **Storage rules:** Artists can only access their own files; presigned URLs with **short TTL** for Slack links.
* **Auditing:** Record T\&C acceptance; log sensitive actions; retain payout/export logs.
* **Deactivation:** Blocks login; **auto-archives** live artworks; retain payout records.

---

## 8) Development phases & milestones

### Phase 1 — MVP harden (2–3 sprints)

* Invite-only signup (static URL + whitelist), T\&C modal + acceptance audit.
* Onboarding (profile picture resize & upload; pronouns, location, phone).
* Artist: Artworks (upload/swap/delete → archive), per-artwork category toggles, 15-live cap enforcement.
* Artist: Margins (global per category; shows retail calc).
* Artist: Payments (core bank fields + PAN required, GSTIN optional; masked UI).
* Admin: Categories (create/rename/soft-disable; base prices & default margins).
* Admin: Artists list with quick actions (Resend/Remove/Reactivate/Override cap/View Archive/Export bank CSV).
* Slack upload notifications with short-TTL links.
* Buckets: live, archive, profile-pictures.
* Light audit log.

### Phase 2 — Ops conveniences (optional)

* **CSV manifest** downloads (by artist/date) for ops batching.
* “New category created” banner in Margins (non-email nudge).
* One-time, expiring **invite tokens** (upgrade from static URL) if/when desired.
* Simple analytics (counts by artist, file types, sizes, last activity).

### Phase 3 — Scale & polish (later)

* Optional **ops queue** view (New/Done).
* Previews for PDFs/AI/PSD via a render service (if needed).
* Role split (Ops/Finance) if the team grows.
* International expansion rules (currency/country-based fields) if needed.

---

## 9) Potential challenges & proposed solutions

* **Large files (10–30 MB) & flaky networks:** Use resumable uploads; show progress and handle retries gracefully.
* **Unsupported thumbnails (AI/PSD/Procreate):** Default to file icons; allow optional preview upload later if needed.
* **Accidental over-/under-pricing:** Show current **Retail = Base + Margin**; Admin can update base price instantly.
* **Security of links in Slack:** Use short-TTL presigned URLs or deep links back to the app behind auth.
* **Archive growth:** Keep archives per artist; add admin tools to bulk purge later if required.
* **Manual payouts errors:** Bank CSV export with validation (IFSC format check, PAN format check) reduces mistakes.

---
