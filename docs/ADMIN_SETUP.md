# ReckoMEDIA Admin (CMS + CRM) setup: Phase 1

Phase 1 covers: admin login, dashboard, inquiries, contacts, tasks & follow-ups, and the
website contact form wired to Supabase. Homepage editor, services, pages, media, SEO and
settings are planned for the next phases.

## 1. Create the Supabase project
1. Create a project at https://supabase.com (or use one you already own).
2. **Authentication > Providers > Email:** turn **off** "Allow new users to sign up". Admins are created manually.
3. **Authentication > URL Configuration:** add `https://YOUR-DOMAIN/admin/reset-password` (and your local URL) to the redirect allow-list so password reset emails work.

## 2. Apply the database schema
Open **SQL Editor** and run `supabase/migrations/20261104000001_crm_core.sql`, or use the CLI:

```
supabase link --project-ref YOUR-PROJECT-REF
supabase db push
```

Then run `supabase/migrations/20261104000002_grants_and_admin.sql`. It grants the API roles
only the access they need (anonymous visitors get none) and registers `admin@reckomedia.com` as admin.

## 3. Create the admin account (manual alternative)
1. **Authentication > Users > Add user**: enter email and password (tick "Auto confirm").
2. Copy the new user's UUID, then run in the SQL Editor:

```sql
insert into public.profiles (id, full_name, role)
values ('PASTE-USER-UUID', 'Your Name', 'admin');
```

Only users with a row in `profiles` are admins. Without it, a signed-in user sees no CRM data (Row Level Security) and the dashboard signs them out.

## 4. Environment variables
Copy `.env.example` to `.env` and fill in the project URL and the **anon/publishable** key
(Project Settings > API). Never add the `service_role` key to this app.
On the host (Cloudflare/Lovable) add the same two `VITE_` variables, then redeploy once.

## 5. Use it
- Admin login: `/admin/login`. Typing `admin` as the username maps to `admin@reckomedia.com`. Dashboard: `/admin`.
- Website contact form submissions go to Supabase through the `submit_inquiry` function. It validates input, drops bot (honeypot) posts, ignores duplicates within 10 minutes, limits 5 per email per hour, and links the inquiry to a contact by normalized email.
- New inquiries trigger a realtime toast and bell counter for a signed-in admin.

## Security model
- Row Level Security is enabled on every table. Anonymous visitors have **no** table access; they can only call `submit_inquiry`.
- Admin access is enforced in the database with `is_admin()`, not just by hiding routes.

## Verify after setup
1. Submit the contact form at `/contact` and confirm the inquiry appears in `/admin/inquiries`.
2. Sign out and open `/admin`; you should be redirected to the login page.
3. In the SQL Editor run `select count(*) from inquiries` using the **anon** role (`set role anon;`); it must return a permission or zero-row result.

## Before going live
- **Change the temporary admin password** (`adminadmin` is only for setup). Use the reset-password flow or Authentication > Users.
- Turn off **Allow new users to sign up** (Authentication > Providers > Email).
- Rotate any `sb_secret_...` key that was ever shared in chat or email (Project Settings > API Keys).
- In Authentication > Attack Protection enable CAPTCHA and leaked-password protection, and set a minimum password length of 12.
