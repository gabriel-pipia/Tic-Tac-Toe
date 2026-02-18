
import { BoardState, Player } from '@/types/game';

export const checkWinner = (squares: BoardState): Player | 'DRAW' | null => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }

  // Check for draw (all squares filled)
  if (!squares.includes(null)) {
      return 'DRAW';
  }

  return null;
};

export const getWinningLine = (squares: BoardState): number[] | null => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return lines[i];
    }
  }
  return null;
};

export function getBestMove(squares: BoardState, aiPlayer: 'X'|'O'): number {
  const opponent = aiPlayer === 'X' ? 'O' : 'X';

  const emptyIndices = squares.map((val, idx) => val === null ? idx : null).filter((val) => val !== null) as number[];

  // 1. Check if AI can win immediately
  for (let i of emptyIndices) {
      const tempSquares = [...squares];
      tempSquares[i] = aiPlayer;
      if (checkWinner(tempSquares) === aiPlayer) return i;
  }

  // 2. Check if Opponent can win immediately (Block)
  for (let i of emptyIndices) {
      const tempSquares = [...squares];
      tempSquares[i] = opponent;
      if (checkWinner(tempSquares) === opponent) return i;
  }

  // 3. Take Center if available
  if (squares[4] === null) return 4;

  // 4. Take random corner
  const corners = [0, 2, 6, 8].filter(idx => squares[idx] === null);
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

  // 5. Take random available
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}
