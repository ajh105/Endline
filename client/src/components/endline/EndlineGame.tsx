import { useMemo, useState } from "react";
import {
  applyLegalMove,
  createInitialGameState,
  getLegalNonCapturingMoves,
} from "@shared";
import type { GameState, LegalMove } from "@shared";
import Board from "./Board";

function EndlineGame() {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState()
  );

  const selectedPiece =
    gameState.pieces.find((piece) => piece.id === gameState.selectedPieceId) ??
    null;

  const legalMoves = useMemo(() => {
    if (!selectedPiece || gameState.status !== "playing") {
      return [];
    }

    return getLegalNonCapturingMoves(
      selectedPiece,
      gameState.pieces,
      gameState.currentRoll
    );
  }, [selectedPiece, gameState.pieces, gameState.currentRoll, gameState.status]);

  const getLegalMoveForDestination = (
    row: number,
    col: number
  ): LegalMove | undefined => {
    return legalMoves.find(
      (move) => move.destination.row === row && move.destination.col === col
    );
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameState.status !== "playing") {
      return;
    }

    const clickedLegalMove = getLegalMoveForDestination(row, col);

    if (clickedLegalMove) {
      setGameState((current) => applyLegalMove(current, clickedLegalMove));
      return;
    }

    const clickedPiece = gameState.pieces.find(
      (piece) =>
        piece.alive &&
        piece.position.row === row &&
        piece.position.col === col
    );

    if (!clickedPiece) {
      setGameState((current) => ({
        ...current,
        selectedPieceId: null,
      }));
      return;
    }

    if (clickedPiece.owner !== gameState.currentPlayer) {
      return;
    }

    if (clickedPiece.locked) {
      return;
    }

    setGameState((current) => ({
      ...current,
      selectedPieceId:
        current.selectedPieceId === clickedPiece.id ? null : clickedPiece.id,
    }));
  };

  const handleResetGame = () => {
    setGameState(createInitialGameState());
  };

  return (
    <main className="endline-page">
      <section className="endline-header">
        <h1>Endline</h1>
        <p>Basic movement checkpoint</p>
      </section>

      <section className="endline-layout">
        <Board
          pieces={gameState.pieces}
          selectedPieceId={gameState.selectedPieceId}
          legalMoves={legalMoves}
          showMoveHints={gameState.showMoveHints}
          onSquareClick={handleSquareClick}
        />

        <aside className="endline-panel">
          <h2>Game Info</h2>
          <p>
            <strong>Status:</strong> {gameState.status}
          </p>
          <p>
            <strong>Current Player:</strong> {gameState.currentPlayer}
          </p>
          <p>
            <strong>Current Roll:</strong> {gameState.currentRoll}
          </p>
          <p>
            <strong>Win Target:</strong> {gameState.winTarget}
          </p>
          <p>
            <strong>Show Move Hints:</strong>{" "}
            {gameState.showMoveHints ? "On" : "Off"}
          </p>
          <p>
            <strong>Selected Piece:</strong>{" "}
            {selectedPiece ? selectedPiece.id : "None"}
          </p>
          <p>
            <strong>Legal Destinations:</strong> {legalMoves.length}
          </p>

          <div className="endline-panel-actions">
            <button type="button" onClick={handleResetGame}>
              Reset Game
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default EndlineGame;