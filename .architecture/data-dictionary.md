## Data Dictionary (Phase 2)

### users

- **id** (uuid, PK): App user id.
- **name** (text): Display name.
- **email** (text, unique): Login/identifier.
- **role** (enum user_role): admin | artist.
- **status** (enum user_status): invited | active | deactivated.
- **created_at** (timestamptz): Creation timestamp.

### invites

- **email** (text, PK): Invited email.
- **invited_by_admin_id** (uuid, FK users.id): Admin who invited.
- **status** (enum invite_status): invited | revoked | used.
- **created_at** (timestamptz): When created.
- **used_at** (timestamptz, nullable): When consumed.

### artist_profile

- **user_id** (uuid, PK/FK users.id): Artist user id.
- **pronouns** (text, nullable)
- **location** (text, nullable)
- **phone** (text, nullable)
- **profile_picture_url** (text, nullable)
- **artwork_cap** (int, default 15): Live artworks cap.

### terms_acceptance_audit

- **id** (bigserial, PK)
- **user_id** (uuid, FK users.id)
- **terms_version** (text): Version string.
- **accepted_at** (timestamptz): Timestamp.
- **ip_address** (inet, nullable)

### categories

- **id** (bigserial, PK)
- **label** (text, unique)
- **base_price** (numeric(10,2) >= 0)
- **default_margin** (numeric(10,2) >= 0)
- **is_active** (boolean, default true)
- **created_at** (timestamptz)
- **updated_at** (timestamptz)

### artworks

- **id** (uuid, PK)
- **artist_id** (uuid, FK users.id)
- **title** (text)
- **notes_internal** (text, nullable)
- **file_url** (text)
- **is_active** (boolean, default true)
- **created_at** (timestamptz)
- **updated_at** (timestamptz)

### artist_margins

- **artist_id** (uuid, PK/FK users.id)
- **category_id** (bigint, PK/FK categories.id)
- **margin_value** (numeric(10,2) >= 0, default 0)
- **is_custom** (boolean, default false)

### artwork_category_toggle

- **artwork_id** (uuid, PK/FK artworks.id)
- **category_id** (bigint, PK/FK categories.id)
- **is_enabled** (boolean, default true)

### archive_items

- **id** (bigserial, PK)
- **artist_id** (uuid, FK users.id)
- **artwork_id** (uuid, FK artworks.id)
- **file_url** (text)
- **reason** (enum archive_reason): swap | delete | deactivate
- **archived_at** (timestamptz)

### payments_bank

- **artist_id** (uuid, PK/FK users.id)
- **account_holder** (text)
- **account_number** (text)
- **ifsc** (text)
- **bank_name** (text)
- **account_type** (text)
- **pan** (text)
- **gstin** (text, nullable)
- **phone** (text, nullable)
- **updated_at** (timestamptz)

### audit_log

- **id** (bigserial, PK)
- **actor_id** (uuid, FK users.id)
- **action** (text)
- **target_type** (text, nullable)
- **target_id** (text, nullable)
- **metadata** (jsonb, nullable)
- **occurred_at** (timestamptz)
