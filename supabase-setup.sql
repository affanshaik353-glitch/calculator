create table if not exists public.memory_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.memory_admins enable row level security;
revoke all on table public.memory_admins from anon, authenticated;

create or replace function public.is_memory_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memory_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_memory_admin() from public;
grant execute on function public.is_memory_admin() to authenticated;

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 90),
  caption text not null default '' check (char_length(caption) <= 240),
  location text not null default '' check (char_length(location) <= 80),
  category text not null check (category in ('people', 'places', 'small-things')),
  memory_date date not null default current_date,
  image_path text not null unique,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.memories enable row level security;
grant select on table public.memories to anon, authenticated;
grant insert, delete on table public.memories to authenticated;

drop policy if exists "Anyone can read memories" on public.memories;
create policy "Anyone can read memories"
on public.memories for select
to anon, authenticated
using (true);

drop policy if exists "Admins can add memories" on public.memories;
create policy "Admins can add memories"
on public.memories for insert
to authenticated
with check (
  (select public.is_memory_admin())
  and created_by = (select auth.uid())
);

drop policy if exists "Admins can delete memories" on public.memories;
create policy "Admins can delete memories"
on public.memories for delete
to authenticated
using ((select public.is_memory_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memories',
  'memories',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload memory photos" on storage.objects;
create policy "Admins can upload memory photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'memories'
  and (select public.is_memory_admin())
);

drop policy if exists "Admins can view memory photo metadata" on storage.objects;
create policy "Admins can view memory photo metadata"
on storage.objects for select
to authenticated
using (
  bucket_id = 'memories'
  and (select public.is_memory_admin())
);

drop policy if exists "Admins can delete memory photos" on storage.objects;
create policy "Admins can delete memory photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'memories'
  and (select public.is_memory_admin())
);

insert into public.memory_admins (user_id)
select id
from auth.users
where email = 'replace-with-your-admin-email@example.com'
on conflict (user_id) do nothing;