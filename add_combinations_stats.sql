
-- 1. Add winning_line to games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS winning_line jsonb;

-- 2. Add game_combinations to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS game_combinations jsonb DEFAULT '{}'::jsonb;

-- 3. Add score columns to games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS score_x integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_o integer DEFAULT 0;

-- 4. Update existing nulls to empty object if any
UPDATE public.profiles 
SET game_combinations = '{}'::jsonb 
WHERE game_combinations IS NULL;
