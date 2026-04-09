import type { GameState, LegalMove, PlayerId, Position } from "../types/game";
import { getBaselineRow, isOwnBaseline } from "../utils/board";

function rollD4(): 1 | 2 | 3 | 4 {
  return (Math.floor(Math.random() * 4) + 1) as 1 | 2 | 3 | 4;
}

function getOpponent(player: PlayerId): PlayerId {
  return player === "red" ? "blue" : "red";
}

function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function applyLegalMove(
  gameState: GameState,
  move: LegalMove
): GameState {
  const piece = gameState.pieces.find(
    (currentPiece) => currentPiece.id === move.pieceId
  );

  if (!piece) {
    return gameState;
  }

  const destination = move.destination;
  const opponentBaselineRow = getBaselineRow(getOpponent(piece.owner));
  const reachedOpponentBaseline = destination.row === opponentBaselineRow;

  const updatedPieces = gameState.pieces.map((currentPiece) => {
    if (currentPiece.id === move.capturedPieceId) {
      return {
        ...currentPiece,
        alive: false,
      };
    }

    if (currentPiece.id !== move.pieceId) {
      return currentPiece;
    }

    const startedOnOwnBaseline = isOwnBaseline(
      currentPiece.position,
      currentPiece.owner
    );
    const leftOwnBaselineThisMove =
      startedOnOwnBaseline && !isOwnBaseline(destination, currentPiece.owner);

    return {
      ...currentPiece,
      position: destination,
      hasLeftBaseline:
        currentPiece.hasLeftBaseline || leftOwnBaselineThisMove,
      locked: reachedOpponentBaseline,
    };
  });

  const redLockedCount = updatedPieces.filter(
    (currentPiece) => currentPiece.owner === "red" && currentPiece.locked
  ).length;

  const blueLockedCount = updatedPieces.filter(
    (currentPiece) => currentPiece.owner === "blue" && currentPiece.locked
  ).length;

  const redAliveCount = updatedPieces.filter(
    (currentPiece) => currentPiece.owner === "red" && currentPiece.alive
  ).length;

  const blueAliveCount = updatedPieces.filter(
    (currentPiece) => currentPiece.owner === "blue" && currentPiece.alive
  ).length;

  if (redLockedCount >= gameState.winTarget) {
    return {
      ...gameState,
      pieces: updatedPieces,
      status: "red_won",
      winner: "red",
      selectedPieceId: null,
      previewMove: null,
      winReason: "Red reached the win target.",
    };
  }

  if (blueLockedCount >= gameState.winTarget) {
    return {
      ...gameState,
      pieces: updatedPieces,
      status: "blue_won",
      winner: "blue",
      selectedPieceId: null,
      previewMove: null,
      winReason: "Blue reached the win target.",
    };
  }

  if (redAliveCount < gameState.winTarget) {
    return {
      ...gameState,
      pieces: updatedPieces,
      status: "blue_won",
      winner: "blue",
      selectedPieceId: null,
      previewMove: null,
      winReason: "Red no longer has enough remaining pieces to meet the win target.",
    };
  }

  if (blueAliveCount < gameState.winTarget) {
    return {
      ...gameState,
      pieces: updatedPieces,
      status: "red_won",
      winner: "red",
      selectedPieceId: null,
      previewMove: null,
      winReason: "Blue no longer has enough remaining pieces to meet the win target.",
    };
  }

  return {
    ...gameState,
    pieces: updatedPieces,
    currentPlayer: getOpponent(gameState.currentPlayer),
    currentRoll: rollD4(),
    rollKey: gameState.rollKey + 1,
    selectedPieceId: null,
    previewMove: null,
    turnMessage: null,
    winReason: null,
    status: "playing",
    winner: null,
  };
}

export function passTurnWithMessage(
  gameState: GameState,
  message: string
): GameState {
  return {
    ...gameState,
    currentPlayer: getOpponent(gameState.currentPlayer),
    currentRoll: rollD4(),
    rollKey: gameState.rollKey + 1,
    selectedPieceId: null,
    previewMove: null,
    turnMessage: message,
    winReason: null,
  };
}