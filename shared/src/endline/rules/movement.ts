import type { LegalMove, Piece, Position } from "../types/game";
import {
  getPieceAtPosition,
  getDiagonalNeighbors,
  isOwnBaseline,
  isPositionOccupied,
  positionKey,
  positionsEqual,
} from "../utils/board";

type NormalSearchState = {
  current: Position;
  stepsRemaining: number;
  path: Position[];
  visited: Set<string>;
  hasLeftOwnBaselineInThisPath: boolean;
};

function getDiagonalDirections(): Array<{ rowDelta: number; colDelta: number }> {
  return [
    { rowDelta: -1, colDelta: -1 },
    { rowDelta: -1, colDelta: 1 },
    { rowDelta: 1, colDelta: -1 },
    { rowDelta: 1, colDelta: 1 },
  ];
}

function getOffsetPosition(
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

function searchNormalMoves(
  piece: Piece,
  pieces: Piece[],
  start: Position,
  state: NormalSearchState,
  results: LegalMove[],
  capturedPieceId: string | null
) {
  if (state.stepsRemaining === 0) {
    if (!positionsEqual(state.current, start)) {
      results.push({
        pieceId: piece.id,
        path: state.path,
        destination: state.current,
        capturedPieceId,
      });
    }
    return;
  }

  const neighbors = getDiagonalNeighbors(state.current);

  for (const next of neighbors) {
    const nextKey = positionKey(next);
    const nextIsOwnBaseline = isOwnBaseline(next, piece.owner);
    const currentIsOwnBaseline = isOwnBaseline(state.current, piece.owner);

    if (isPositionOccupied(pieces, next)) {
      continue;
    }

    if (nextKey === positionKey(start)) {
      continue;
    }

    if (state.visited.has(nextKey)) {
      continue;
    }

    if (piece.hasLeftBaseline && nextIsOwnBaseline) {
      continue;
    }

    if (state.hasLeftOwnBaselineInThisPath && nextIsOwnBaseline) {
      continue;
    }

    const nextHasLeftOwnBaselineInThisPath =
      state.hasLeftOwnBaselineInThisPath ||
      (currentIsOwnBaseline && !nextIsOwnBaseline);

    searchNormalMoves(
      piece,
      pieces,
      start,
      {
        current: next,
        stepsRemaining: state.stepsRemaining - 1,
        path: [...state.path, next],
        visited: new Set(state.visited).add(nextKey),
        hasLeftOwnBaselineInThisPath: nextHasLeftOwnBaselineInThisPath,
      },
      results,
      capturedPieceId
    );
  }
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

  // Branch 1: pure non-capturing moves
  searchNormalMoves(
    piece,
    pieces,
    start,
    {
      current: start,
      stepsRemaining: roll,
      path: [start],
      visited: new Set([startKey]),
      hasLeftOwnBaselineInThisPath: false,
    },
    results,
    null
  );

  // Branch 2: capture must happen on the first movement step only
  for (const direction of getDiagonalDirections()) {
    const adjacent = getOffsetPosition(
      start,
      direction.rowDelta,
      direction.colDelta
    );

    if (!isWithinBoard(adjacent)) {
      continue;
    }

    const adjacentPiece = getPieceAtPosition(pieces, adjacent);

    if (!adjacentPiece) {
      continue;
    }

    if (adjacentPiece.owner === piece.owner) {
      continue;
    }

    const landing = getOffsetPosition(
      adjacent,
      direction.rowDelta,
      direction.colDelta
    );

    if (!isWithinBoard(landing)) {
      continue;
    }

    const landingKey = positionKey(landing);
    const landingIsOwnBaseline = isOwnBaseline(landing, piece.owner);
    const startIsOwnBaseline = isOwnBaseline(start, piece.owner);

    if (landingKey === startKey) {
      continue;
    }

    if (isPositionOccupied(pieces, landing)) {
      continue;
    }

    if (piece.hasLeftBaseline && landingIsOwnBaseline) {
      continue;
    }

    const hasLeftOwnBaselineInThisPath =
      startIsOwnBaseline && !landingIsOwnBaseline;

    searchNormalMoves(
      piece,
      pieces,
      start,
      {
        current: landing,
        stepsRemaining: roll - 1,
        path: [start, landing],
        visited: new Set([startKey, landingKey]),
        hasLeftOwnBaselineInThisPath,
      },
      results,
      adjacentPiece.id
    );
  }

  const deduped = new Map<string, LegalMove>();

  for (const move of results) {
    const pathKey = move.path.map((position) => positionKey(position)).join("|");
    const key = `${move.destination.row},${move.destination.col}|${
      move.capturedPieceId ?? "none"
    }|${pathKey}`;

    if (!deduped.has(key)) {
      deduped.set(key, move);
    }
  }

  return Array.from(deduped.values());
}