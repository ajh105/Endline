import { BOARD_SIZE, DEFAULT_WIN_TARGET } from "../constants/game";
import type { GameState, Piece, PlayerId, SquareColor } from "../types/game";

function getSquareColor(row: number, col: number): SquareColor {
  return (row + col) % 2 === 0 ? "light" : "dark";
}

function createBaselinePieces(player: PlayerId): Piece[] {
  const row = player === "red" ? BOARD_SIZE - 1 : 0;
  const pieces: Piece[] = [];

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    pieces.push({
      id: `${player}-${col}`,
      owner: player,
      position: { row, col },
      locked: false,
      hasLeftBaseline: false,
      alive: true,
      squareColor: getSquareColor(row, col),
    });
  }

  return pieces;
}

function rollD4(): 1 | 2 | 3 | 4 {
  return (Math.floor(Math.random() * 4) + 1) as 1 | 2 | 3 | 4;
}

export function createInitialGameState(): GameState {
  return {
    pieces: [...createBaselinePieces("red"), ...createBaselinePieces("blue")],
    currentPlayer: "red",
    currentRoll: rollD4(),
    status: "playing",
    winner: null,
    winTarget: DEFAULT_WIN_TARGET,
    showMoveHints: true,
    selectedPieceId: null,
  };
}