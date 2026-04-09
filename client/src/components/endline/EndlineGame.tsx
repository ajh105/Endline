import { useEffect, useMemo, useState } from "react";
import {
  applyLegalMove,
  createInitialGameState,
  getLegalMoves,
  passTurnWithMessage,
  positionKey,
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

    return getLegalMoves(
      selectedPiece,
      gameState.pieces,
      gameState.currentRoll
    );
  }, [selectedPiece, gameState.pieces, gameState.currentRoll, gameState.status]);

  const groupedMoves = useMemo(() => {
    const grouped = new Map<string, LegalMove[]>();

    for (const move of legalMoves) {
      const key = positionKey(move.destination);
      const existing = grouped.get(key) ?? [];
      existing.push(move);
      grouped.set(key, existing);
    }

    return grouped;
  }, [legalMoves]);

  const getMovesForDestination = (row: number, col: number): LegalMove[] => {
    return groupedMoves.get(`${row},${col}`) ?? [];
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameState.status !== "playing") {
      return;
    }

    const destinationMoves = getMovesForDestination(row, col);

    if (destinationMoves.length > 0) {
      setGameState((current) => {
        const currentPreview = current.previewMove;

        if (
          currentPreview &&
          currentPreview.destination.row === row &&
          currentPreview.destination.col === col
        ) {
          const currentIndex = destinationMoves.findIndex(
            (move) =>
              move.pieceId === currentPreview.pieceId &&
              move.capturedPieceId === currentPreview.capturedPieceId &&
              move.path.length === currentPreview.path.length &&
              move.path.every(
                (position, index) =>
                  position.row === currentPreview.path[index]?.row &&
                  position.col === currentPreview.path[index]?.col
              )
          );

          const nextIndex =
            currentIndex >= 0 ? (currentIndex + 1) % destinationMoves.length : 0;

          return {
            ...current,
            previewMove: destinationMoves[nextIndex],
          };
        }

        return {
          ...current,
          previewMove: destinationMoves[0],
        };
      });

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
        previewMove: null,
        turnMessage: null,
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
      previewMove: null,
      turnMessage: null,
    }));
  };

  const handleResetGame = () => {
    setGameState(createInitialGameState());
  };

  const handleToggleHints = () => {
    setGameState((current) => ({
      ...current,
      showMoveHints: !current.showMoveHints,
    }));
  };

  const handleConfirmMove = () => {
    if (!gameState.previewMove) {
      return;
    }

    setGameState((current) => applyLegalMove(current, current.previewMove!));
  };

  const previewMove = gameState.previewMove;
  const previewPath = previewMove?.path ?? [];
  const previewDestination = previewMove?.destination ?? null;
  const capturedPiece =
    previewMove?.capturedPieceId
      ? gameState.pieces.find((piece) => piece.id === previewMove.capturedPieceId) ?? null
      : null;

  const pathVariantCount = previewDestination
    ? getMovesForDestination(previewDestination.row, previewDestination.col).length
    : 0;

  useEffect(() => {
    if (gameState.status !== "playing") {
      return;
    }

    const hasAnyLegalMove = gameState.pieces.some((piece) => {
      if (!piece.alive || piece.locked || piece.owner !== gameState.currentPlayer) {
        return false;
      }

      return getLegalMoves(piece, gameState.pieces, gameState.currentRoll).length > 0;
    });

    if (hasAnyLegalMove) {
      return;
    }

    const playerLabel =
      gameState.currentPlayer.charAt(0).toUpperCase() +
      gameState.currentPlayer.slice(1);

    const message = `${playerLabel} has no legal moves for roll ${gameState.currentRoll}. Turn passes.`;

    const timeoutId = window.setTimeout(() => {
      setGameState((current) => {
        if (
          current.status !== "playing" ||
          current.currentPlayer !== gameState.currentPlayer ||
          current.currentRoll !== gameState.currentRoll
        ) {
          return current;
        }

        return passTurnWithMessage(current, message);
      });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [
    gameState.currentPlayer,
    gameState.currentRoll,
    gameState.pieces,
    gameState.status,
  ]);

  return (
    <main className="endline-page">
      <section className="endline-header">
        <h1>Endline</h1>
        <p>Winner banner checkpoint</p>
      </section>

      {gameState.winner ? (
        <section className={`endline-winner-banner ${gameState.winner}`}>
          <h2>
            {gameState.winner === "red" ? "Red Wins!" : "Blue Wins!"}
          </h2>
          {gameState.winReason ? <p>{gameState.winReason}</p> : null}
        </section>
      ) : null}

      <section className="endline-layout">
        <Board
          pieces={gameState.pieces}
          selectedPieceId={gameState.selectedPieceId}
          legalMoves={legalMoves}
          showMoveHints={gameState.showMoveHints}
          previewPath={previewPath}
          previewDestination={previewDestination}
          previewCapturedPieceId={previewMove?.capturedPieceId ?? null}
          isGameOver={gameState.status !== "playing"}
          onSquareClick={handleSquareClick}
        />

        <aside className="endline-panel">
          <h2>Game Info</h2>
          <p>
            <strong>Status:</strong> {gameState.status}
          </p>

          {gameState.turnMessage ? (
            <div className="endline-turn-message">{gameState.turnMessage}</div>
          ) : null}

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

          <div className="endline-preview-box">
            <h3>Preview</h3>
            <p>
              <strong>Capture:</strong> {previewMove?.capturedPieceId ? "Yes" : "No"}
            </p>
            <p>
              <strong>Path Length:</strong>{" "}
              {previewMove ? previewMove.path.length - 1 : 0}
            </p>
            <p>
              <strong>Destination:</strong>{" "}
              {previewDestination
                ? `(${previewDestination.row}, ${previewDestination.col})`
                : "None"}
            </p>
            <p>
              <strong>Captured Piece:</strong>{" "}
              {capturedPiece ? capturedPiece.id : "None"}
            </p>
            <p>
              <strong>Path Option Count:</strong> {pathVariantCount}
            </p>
          </div>

          <div className="endline-panel-actions">
            <button type="button" onClick={handleToggleHints}>
              {gameState.showMoveHints ? "Hide Move Hints" : "Show Move Hints"}
            </button>

            <button
              type="button"
              onClick={handleConfirmMove}
              disabled={!gameState.previewMove}
            >
              Move
            </button>

            <button type="button" onClick={handleResetGame}>
              Reset Game
            </button>
          </div>

          <p className="endline-help-text">
            Tap a highlighted destination to preview a path. Tap the same
            destination again to cycle path options when more than one exists.
          </p>
        </aside>
      </section>
    </main>
  );
}

export default EndlineGame;