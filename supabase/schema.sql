-- =============================================
-- BiZ Content — Supabase Schema
-- =============================================

-- 1. Profiles table (synced from Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Generation logs
create table if not exists public.generation_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  platform text not null,
  category text not null,
  tone text not null,
  title text not null,
  used_image boolean not null default false,
  used_ocr boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3. Saved contents (Memory Box)
create table if not exists public.saved_contents (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  slot_index int not null check (slot_index >= 0 and slot_index <= 2),
  content_text text,
  image_url text,
  platform text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slot_index)
);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

alter table public.profiles enable row level security;
alter table public.generation_logs enable row level security;
alter table public.saved_contents enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Generation logs: users can insert their own, admins can read all
create policy "Users can insert own logs"
  on public.generation_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can view own logs"
  on public.generation_logs for select
  using (auth.uid() = user_id);

-- Saved contents: users can CRUD their own
create policy "Users can view own saved contents"
  on public.saved_contents for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved contents"
  on public.saved_contents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own saved contents"
  on public.saved_contents for update
  using (auth.uid() = user_id);

create policy "Users can delete own saved contents"
  on public.saved_contents for delete
  using (auth.uid() = user_id);

-- Index for faster queries
create index if not exists idx_generation_logs_created_at on public.generation_logs(created_at desc);
create index if not exists idx_generation_logs_user_id on public.generation_logs(user_id);
create index if not exists idx_saved_contents_user_id on public.saved_contents(user_id);
