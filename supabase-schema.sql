-- 1. Create the games table
create table public.games (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  player_x uuid references auth.users not null,
  player_o uuid references auth.users, -- nullable until joined
  board jsonb default '[null,null,null,null,null,null,null,null,null]'::jsonb,
  turn text default 'X', -- 'X' or 'O'
  winner text, -- 'X', 'O', or 'DRAW'
  status text default 'waiting' -- 'waiting', 'playing', 'finished'
);

-- 2. Enable Row Level Security (RLS)
alter table public.games enable row level security;

-- 3. Create Policies

-- Allow any authenticated user to create a game (they become player_x automatically in backend logic, but RLS just checks authentication)
create policy "Enable insert for authenticated users only"
on public.games for insert
to authenticated
with check (true);

-- Allow users to view games IF:
-- They are player_x OR player_o OR the game is waiting (so they can join)
create policy "Enable read access for players or waiting games"
on public.games for select
to authenticated
using (
  auth.uid() = player_x or 
  auth.uid() = player_o or 
  status = 'waiting'
);

-- Allow players to update the game IF:
-- They are participants in the game
create policy "Enable update for game participants"
on public.games for update
to authenticated
using (
  auth.uid() = player_x or 
  auth.uid() = player_o
);

-- 4. Enable Realtime for the games table
-- This is crucial for the multiplayer features (Postgres Changes)
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.games;
