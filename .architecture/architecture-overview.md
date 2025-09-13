+---------------------------+                    +---------------------------+
|   Artist / Admin Browser  |                    |        Slack (Ops)        |
|  (Desktop-first, mobile R)|                    |  #uploads channel         |
+-------------+-------------+                    +-------------+-------------+
              |                                                    ^
              v                                                    |
+-------------+-------------+                         (short-TTL)  |
|   Frontend (Vite + React) |---------------------+  presigned URL |
|  Tabs: Artworks/Margins/  |                     |  or deep link  |
|        Payments           |                     |                |
+-------------+-------------+                     |                |
              | Supabase JS SDK                   |                |
              v                                   |                |
   +----------+-----------+                       |                |
   |   Supabase Auth      |<----------------------+                |
   +----------+-----------+                                        |
              |                                                    |
              v                                                    |
   +----------+-----------+       +---------------------------+    |
   |   Supabase Postgres  |<----->|   Supabase Edge Function |<---+
   |  (RLS policies)      |  (optional for server-side ops)  |
   +----------+-----------+       +-----------+---------------+
              |                                   |
              |                                   | (move/copy, archive,
              v                                   |  masked exports, etc.)
   +----------+-----------+                       |
   |  Supabase Storage    |<----------------------+
   |  Buckets:            |
   |   - artworks-live    |
   |   - artworks-archive |
   |   - profile-pictures |
   +----------+-----------+
              ^
              |
   +----------+-----------+
   |  EmailJS (Invites)   |
   |  Static signup URL   |
   +----------------------+


Key boundaries

Public web: Frontend only (no secrets).

Supabase: Auth, DB (RLS), Storage.

Edge Function (optional but recommended): server-side actions like archive moves, cap enforcement on the server, bank CSV exports with access checks, Slack notifications with short-TTL URLs.