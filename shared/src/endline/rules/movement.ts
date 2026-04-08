import type { LegalMove, Piece, Position } from "../types/game";
import {
  getPieceAtPosition,
  isOwnBaseline,
  isPositionOccupied,
  positionKey,
  positionsEqual,
} from "../utils/board";

type SearchState = {
  current: Position;
  stepsRemaining: number;
  path: Position[];
  visited: Set<string>;
  hasLeftOwnBaselineInThisPath: boolean;
  capturedPieceId: string | null;
};

function getDiagonalDirections(): Array<{ rowDelta: number; colDelta: number }> {
  return [
    { rowDelta: -1, colDelta: -1 },
    { rowDelta: -1, colDelta: 1 },
    { rowDelta: 1, colDelta: -1 },
    { rowDelta: 1, colDelta: 1 },
  ];
}

function getAdjacentPosition(
  position: Position,
  rowDelta: number,
  colDelta: number
): Position {
  return {
    row: position.row + rowDelta,
    col: position.col + colDelta,
  };
}

function isWithinBoard(position: Position): boolean {
  return (
    position.row >= 0 &&
    position.row < 8 &&
    position.col >= 0 &&
    position.col < 8
  );
}

export function getLegalMoves(
  piece: Piece,
  pieces: Piece[],
  roll: 1 | 2 | 3 | 4
): LegalMove[] {
  if (!piece.alive || piece.locked) {
    return [];
  }

  const results: LegalMove[] = [];
  const start = piece.position;
  const startKey = positionKey(start);

  function search(state: SearchState) {
    if (state.stepsRemaining === 0) {
      if (!positionsEqual(state.current, start)) {
        results.push({
          pieceId: piece.id,
          path: state.path,
          destination: state.current,
          capturedPieceId: state.capturedPieceId,
        });
      }
      return;
    }

    for (const direction of getDiagonalDirections()) {
      const adjacent = getAdjacentPosition(
        state.current,
        direction.rowDelta,
        direction.colDelta
      );

      if (!isWithinBoard(adjacent)) {
        continue;
      }

      const adjacentKey = positionKey(adjacent);
      const adjacentPiece = getPieceAtPosition(pieces, adjacent);
      const adjacentIsOwnBaseline = isOwnBaseline(adjacent, piece.owner);
      const currentIsOwnBaseline = isOwnBaseline(state.current, piece.owner);

      // Normal non-capturing step
      if (!adjacentPiece) {
        if (adjacentKey === startKey) {
          continue;
        }

        if (state.visited.has(adjacentKey)) {
          continue;
        }

        if (piece.hasLeftBaseline && adjacentIsOwnBaseline) {
          continue;
        }

        if (state.hasLeftOwnBaselineInThisPath && adjacentIsOwnBaseline) {
          continue;
        }

        const nextHasLeftOwnBaselineInThisPath =
          state.hasLeftOwnBaselineInThisPath ||
          (currentIsOwnBaseline && !adjacentIsOwnBaseline);

        search({
          current: adjacent,
          stepsRemaining: state.stepsRemaining - 1,
          path: [...state.path, adjacent],
          visited: new Set(state.visited).add(adjacentKey),
          hasLeftOwnBaselineInThisPath: nextHasLeftOwnBaselineInThisPath,
          capturedPieceId: state.capturedPieceId,
        });

        continue;
      }

      // Capture step
      if (state.capturedPieceId !== null) {
        continue;
      }

      if (adjacentPiece.owner === piece.owner) {
        continue;
      }

      const landing = getAdjacentPosition(
        adjacent,
        direction.rowDelta,
        direction.colDelta
      );

      if (!isWithinBoard(landing)) {
        continue;
      }

      const landingKey = positionKey(landing);
      const landingIsOwnBaseline = isOwnBaseline(landing, piece.owner);

      if (landingKey === startKey) {
        continue;
      }

      if (state.visited.has(landingKey)) {
        continue;
      }

      if (isPositionOccupied(pieces, landing)) {
        continue;
      }

      if (piece.hasLeftBaseline && landingIsOwnBaseline) {
        continue;
      }

      if (state.hasLeftOwnBaselineInThisPath && landingIsOwnBaseline) {
        continue;
      }

      const nextHasLeftOwnBaselineInThisPath =
        state.hasLeftOwnBaselineInThisPath ||
        (currentIsOwnBaseline && !landingIsOwnBaseline);

      search({
        current: landing,
        stepsRemaining: state.stepsRemaining - 1,
        path: [...state.path, landing],
        visited: new Set(state.visited).add(landingKey),
        hasLeftOwnBaselineInThisPath: nextHasLeftOwnBaselineInThisPath,
        capturedPieceId: adjacentPiece.id,
      });
    }
  }

  search({
    current: start,
    stepsRemaining: roll,
    path: [start],
    visited: new Set([startKey]),
    hasLeftOwnBaselineInThisPath: false,
    capturedPieceId: null,
  });

  const deduped = new Map<string, LegalMove>();

  for (const move of results) {
    const key = `${positionKey(move.destination)}|${move.capturedPieceId ?? "none"}`;
    if (!deduped.has(key)) {
      deduped.set(key, move);
    }
  }

  return Array.from(deduped.values());
}