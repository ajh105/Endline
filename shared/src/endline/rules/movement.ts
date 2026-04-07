import type { LegalMove, Piece, Position } from "../types/game";
import {
  getDiagonalNeighbors,
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
};

export function getLegalNonCapturingMoves(
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
        });
      }
      return;
    }

    const neighbors = getDiagonalNeighbors(state.current);

    for (const next of neighbors) {
      const nextKey = positionKey(next);

      if (isPositionOccupied(pieces, next)) {
        continue;
      }

      if (nextKey === startKey) {
        continue;
      }

      if (state.visited.has(nextKey)) {
        continue;
      }

      if (piece.hasLeftBaseline && isOwnBaseline(next, piece.owner)) {
        continue;
      }

      search({
        current: next,
        stepsRemaining: state.stepsRemaining - 1,
        path: [...state.path, next],
        visited: new Set(state.visited).add(nextKey),
      });
    }
  }

  search({
    current: start,
    stepsRemaining: roll,
    path: [start],
    visited: new Set([startKey]),
  });

  const deduped = new Map<string, LegalMove>();

  for (const move of results) {
    const key = positionKey(move.destination);
    if (!deduped.has(key)) {
      deduped.set(key, move);
    }
  }

  return Array.from(deduped.values());
}