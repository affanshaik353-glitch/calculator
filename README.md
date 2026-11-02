# Kept

A photo-first shared memories archive built with HTML, CSS, and vanilla JavaScript. The gallery runs as a preview without a backend; Supabase enables shared photo storage and authenticated admin controls.

## Supabase setup

1. Create a Supabase project and add your admin account under **Authentication → Users**. Keep public sign-ups disabled.
2. In `supabase-setup.sql`, replace `replace-with-your-admin-email@example.com` with the admin account email, then run the file in the Supabase SQL Editor.
3. Copy the project URL and publishable key from the Supabase project API settings into `supabase-config.js`. These are browser-visible values; never put a secret or service-role key in this file.
4. In Supabase **Authentication → URL Configuration**, set the site URL and redirect allowlist to `https://affanshaik353-glitch.github.io`.
5. Commit the updated files to the repository's `main` branch. GitHub Pages publishes the site at <https://affanshaik353-glitch.github.io/calculator/>.

The SQL creates the memories table, public read access, a public image bucket, and row-level policies that restrict uploads and deletes to the user IDs listed in `memory_admins`. Admin status is checked by the database; hiding controls in the browser is not the security boundary.

## Preview

Without Supabase credentials, the gallery shows a small sample collection and admin sign-in is disabled. Once connected, the sample photos are replaced by the shared archive. Admins can add JPG, PNG, or WebP photos up to 10 MB, add a title and optional details, and remove memories.
