export type UserProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  wins: number;
  losses: number;
  draws: number;
  total_wins?: number; // For when we have period wins vs total wins
  is_public?: boolean;
  created_at?: string | null;
};
