# Supabase Setup (Tables, Policies, Env)

This project uses Supabase for data persistence. Follow these steps to configure the required tables and policies for the admin portal.

## 1) Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_USER=admin
VITE_ADMIN_PASS=admin123
```

- For development, you can keep the default admin credentials above. Change them for production.
- The app reads these values via `src/services/supabase.js` and `src/pages/admin/auth.js`.

## 2) Run the SQL Schema

Open Supabase dashboard → SQL editor and run the contents of `supabase_schema.sql` from the project root.

This creates two tables used by the admin portal:
- `pickup_points`: to manage locations where IDs can be collected.
- `citizen_seekers`: to register people looking for their ID cards.

It also sets permissive Row Level Security (RLS) policies for development to allow the anon key to read/write. For production, replace these policies with a proper auth-protected setup.

## 3) Development vs Production

- DEV: The provided policies allow the anon key to manage data directly from the browser. This is convenient but not secure for production.
- PROD: Use Supabase Auth (email/password, magic link, or OAuth) and restrict policies to authenticated users and roles, or move admin mutations behind a secure API.

## 4) Optional Indexes and Search

- The schema includes indexes on common search fields (name, phone). For accent-insensitive search, consider adding `unaccent` and storing normalized columns.

## 5) Troubleshooting

- If you get errors on insert/update/delete, verify that RLS is enabled and the policies exist, or temporarily disable RLS for DEV only.
- Confirm your `.env` values are loaded by restarting `npm run dev` after changes.