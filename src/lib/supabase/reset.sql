-- ============================================
-- FULL CLEANUP SCRIPT
-- Removes ALL project-specific tables, functions,
-- triggers, storage, policies, and realtime config.
-- Run this in the Supabase SQL Editor to reset
-- your project to a clean stock state.
-- ============================================


-- ──────────────────────────────────────────────
-- 1. REALTIME: Remove tables from publication
-- ──────────────────────────────────────────────
do $$
begin
  alter publication supabase_realtime drop table public.games;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime drop table public.profiles;
exception when others then null;
end $$;


-- ──────────────────────────────────────────────
-- 2. STORAGE: Remove policies & bucket
-- ──────────────────────────────────────────────

-- Drop all storage policies for the avatars bucket
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Users can upload an avatar." on storage.objects;
drop policy if exists "Users can update their own avatar." on storage.objects;
drop policy if exists "Users can delete their own avatar." on storage.objects;

-- NOTE: Supabase blocks direct SQL deletion from storage tables.
-- To fully clean up storage, use the Supabase Dashboard:
-- 1. Go to Storage > avatars > Select All > Delete (empty the bucket)
-- 2. Then delete the "avatars" bucket itself from the Dashboard


-- ──────────────────────────────────────────────
-- 3. TRIGGERS: Remove auth trigger
-- ──────────────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;


-- ──────────────────────────────────────────────
-- 4. RLS POLICIES: Remove all table policies
-- ──────────────────────────────────────────────

-- Games policies
drop policy if exists "Enable insert for authenticated users only" on public.games;
drop policy if exists "Enable read access for players or waiting games" on public.games;
drop policy if exists "Enable update for game participants" on public.games;
drop policy if exists "Enable delete for participants" on public.games;

-- Profiles policies
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;


-- ──────────────────────────────────────────────
-- 5. TABLES: Drop all project tables
-- ──────────────────────────────────────────────
-- Order matters: games references auth.users, profiles references auth.users
drop table if exists public.games cascade;
drop table if exists public.profiles cascade;


-- ──────────────────────────────────────────────
-- 6. FUNCTIONS: Drop all project functions
-- ──────────────────────────────────────────────
drop function if exists public.handle_new_user() cascade;
drop function if exists public.delete_own_account() cascade;


-- ──────────────────────────────────────────────
-- 7. AUTH: Delete all user accounts
-- ──────────────────────────────────────────────
-- WARNING: This permanently deletes ALL user accounts!
delete from auth.users;