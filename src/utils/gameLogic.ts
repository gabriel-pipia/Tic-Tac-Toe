
export type Player = 'X' | 'O';
export type BoardState = (Player | null)[];

export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export function checkWinner(board: BoardState): Player | 'DRAW' | null {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (!board.includes(null)) return 'DRAW';
  return null;
}

export function getWinningLine(board: BoardState): number[] | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
}

export function getBestMove(board: BoardState, player: Player): number {
  // Simple AI: Try to win, then block, then random
  // For true production "Hard" mode, we'd use Minimax, but for this lightweight app,
  // a smart heuristic is often sufficient and faster. Let's do a depth-limited search or smart checks.
  
  const opponent = player === 'X' ? 'O' : 'X';

  // 1. Can I win now?
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const newBoard = [...board];
      newBoard[i] = player;
      if (checkWinner(newBoard) === player) return i;
    }
  }

  // 2. Must I block opponent?
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const newBoard = [...board];
      newBoard[i] = opponent;
      if (checkWinner(newBoard) === opponent) return i;
    }
  }

  // 3. Take center if available
  if (!board[4]) return 4;

  // 4. Take random available
  const available = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
  if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
  }

  return -1;
}

export function getRandomMove(board: BoardState): number {
    const available = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
    if (available.length === 0) return -1;
    return available[Math.floor(Math.random() * available.length)];
}
