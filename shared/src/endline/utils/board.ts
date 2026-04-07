import { BOARD_SIZE } from "../constants/game";
import type { Piece, PlayerId, Position } from "../types/game";

export function isWithinBoard(position: Position): boolean {
  return (
    position.row >= 0 &&
    position.row < BOARD_SIZE &&
    position.col >= 0 &&
    position.col < BOARD_SIZE
  );
}

export function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function positionKey(position: Position): string {
  return `${position.row},${position.col}`;
}

export function getPieceAtPosition(
  pieces: Piece[],
  position: Position
): Piece | undefined {
  return pieces.find(
    (piece) =>
      piece.alive &&
      piece.position.row === position.row &&
      piece.position.col === position.col
  );
}

export function isPositionOccupied(
  pieces: Piece[],
  position: Position
): boolean {
  return getPieceAtPosition(pieces, position) !== undefined;
}

export function getBaselineRow(player: PlayerId): number {
  return player === "red" ? BOARD_SIZE - 1 : 0;
}

export function isOwnBaseline(position: Position, player: PlayerId): boolean {
  return position.row === getBaselineRow(player);
}

export function getDiagonalNeighbors(position: Position): Position[] {
  return [
    { row: position.row - 1, col: position.col - 1 },
    { row: position.row - 1, col: position.col + 1 },
    { row: position.row + 1, col: position.col - 1 },
    { row: position.row + 1, col: position.col + 1 },
  ].filter(isWithinBoard);
}