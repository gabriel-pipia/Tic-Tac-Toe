-- Allow participants to delete their games if status is 'abandoned' or 'waiting'

drop policy if exists "Enable delete for participants" on public.games;

create policy "Enable delete for participants"
on public.games for delete
to authenticated
using (
  (auth.uid() = player_x or auth.uid() = player_o) and 
  (status = 'waiting' or status = 'abandoned' or status = 'rematch_rejected')
);
