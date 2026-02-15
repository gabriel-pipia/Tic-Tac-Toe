-- 1. Create Profiles Table (Public User Data)
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  username text unique,
  avatar_url text,
  wins integer default 0,
  losses integer default 0,
  draws integer default 0,
  game_combinations jsonb default '{}'::jsonb,
  
  constraint username_length check (char_length(username) >= 3)
);

-- 2. Enable RLS on Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- 3. Create Games Table
create table public.games (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  player_x uuid references auth.users not null,
  player_o uuid references auth.users, -- nullable until joined
  board jsonb default '[null,null,null,null,null,null,null,null,null]'::jsonb,
  turn text default 'X', -- 'X' or 'O'
  winner text, -- 'X', 'O', or 'DRAW'
  winning_line jsonb, -- array of 3 indices like [0,1,2]
  score_x integer default 0,
  score_o integer default 0,
  status text default 'waiting' -- 'waiting', 'playing', 'finished'
);

-- 4. Enable RLS on Games
alter table public.games enable row level security;

-- Allow authenticated users to create a game
create policy "Enable insert for authenticated users only"
on public.games for insert
to authenticated
with check (true);

-- Allow users to view games IF related to them or waiting
create policy "Enable read access for players or waiting games"
on public.games for select
to authenticated
using (
  auth.uid() = player_x or 
  auth.uid() = player_o or 
  status = 'waiting'
);

-- Allow players to update their games
-- Allow players to update their games OR join a waiting game
create policy "Enable update for game participants"
on public.games for update
to authenticated
using (
  auth.uid() = player_x or 
  auth.uid() = player_o or
  (status = 'waiting' and player_o is null)
);

-- 5. Trigger to automatically create profile on signup
-- This handles the metadata passed from the client during signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Enable Realtime for both tables
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.profiles;

-- 7. Storage Bucket for Avatars
-- Create a public bucket named 'avatars'
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow public access to view avatars
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatar
create policy "Users can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- Allow users to update their own avatar
create policy "Users can update their own avatar."
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'avatars' );

-- Allow users to delete their own avatar
create policy "Users can delete their own avatar."
  on storage.objects for delete
  using ( auth.uid() = owner and bucket_id = 'avatars' );

-- Allow participants to delete a game
create policy "Enable delete for participants"
on public.games for delete
to authenticated
using (
  auth.uid() = player_x or 
  auth.uid() = player_o
);
