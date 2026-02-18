export type Player = 'X' | 'O' | null;

export type BoardState = Player[];

export type LiveGame = {
  id: string;
  player_x: string;
  player_o: string | null;
  status: string;
  winner: string | null;
  turn: string;
  board: (string | null)[];
  created_at: string;
};

export interface GameProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}
