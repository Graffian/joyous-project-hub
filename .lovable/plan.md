## Grant admin access to ayushkantworks@gmail.com

**Prerequisite:** The person must sign up at `/auth` first so a user account exists. Once they've signed up, I'll run a one-line data change to give them admin.

### What will happen

- Look up the user with email `ayushkantworks@gmail.com` in the auth users table.
- Insert a row into `user_roles` with that user's id and role `admin` (safe if re-run — uses `ON CONFLICT DO NOTHING`).

After that, they can sign in and visit `/admin` to see Menu, Orders, and Cooks tabs like you.

### Technical detail

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email = 'ayushkantworks@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

If the insert affects 0 rows, it means they haven't signed up yet — ask them to create an account at `/auth`, then approve this again.