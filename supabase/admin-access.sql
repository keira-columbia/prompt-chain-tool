alter table public.profiles
add column if not exists is_superadmin boolean not null default false;

-- Run the following once in the Supabase SQL editor, replacing the email
-- with the Google account used to access this admin panel.
update public.profiles
set is_superadmin = true
where id = (select id from auth.users where email = 'YOUR_GOOGLE_EMAIL');

create index if not exists profiles_is_superadmin_idx
on public.profiles (is_superadmin)
where is_superadmin = true;
