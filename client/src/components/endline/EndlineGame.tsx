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
import { useNavigate } from "react-router-dom";
import GameTopBar from "./GameTopBar";
import QuitMatchModal from "./QuitMatchModal";
import RulesPanel from "./RulesPanel";
import SettingsPanel from "./SettingsPanel";
import DiceDisplay from "./DiceDisplay";

type AnimationState = {
  move: LegalMove;
  stepIndex: number;
};

function EndlineGame() {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState()
  );

  const [animationState, setAnimationState] = useState<AnimationState | null>(null);

  const navigate = useNavigate();

  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);

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

    if (isAnimating) {
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
    setAnimationState(null);
    setGameState(createInitialGameState());
  };

  const handleQuitMatch = () => {
    setIsQuitModalOpen(false);
    navigate("/");
  };

  const handleToggleHints = () => {
    setGameState((current) => ({
      ...current,
      showMoveHints: !current.showMoveHints,
    }));
  };

  const handleConfirmMove = () => {
    if (!gameState.previewMove || isAnimating) {
      return;
    }

    const moveToAnimate = gameState.previewMove;

    setGameState((current) => ({
      ...current,
      selectedPieceId: null,
      previewMove: null,
      turnMessage: null,
    }));

    setAnimationState({
      move: moveToAnimate,
      stepIndex: 0,
    });
  };

  const previewMove = gameState.previewMove;
  const previewPath = previewMove?.path ?? [];
  const previewDestination = previewMove?.destination ?? null;

  const isAnimating = animationState !== null;

  const animatingMove = animationState?.move ?? null;

  const animationPiece = useMemo(() => {
    if (!animationState) {
      return null;
    }

    const piece = gameState.pieces.find(
      (currentPiece) => currentPiece.id === animationState.move.pieceId
    );

    if (!piece) {
      return null;
    }

    const currentPosition = animationState.move.path[animationState.stepIndex];

    if (!currentPosition) {
      return null;
    }

    return {
      pieceId: piece.id,
      owner: piece.owner,
      locked: false,
      row: currentPosition.row,
      col: currentPosition.col,
    };
  }, [animationState, gameState.pieces]);

  const hiddenPieceIds = useMemo(() => {
    if (!animatingMove) {
      return [];
    }

    const ids = [animatingMove.pieceId];

    if (animatingMove.capturedPieceId) {
      ids.push(animatingMove.capturedPieceId);
    }

    return ids;
  }, [animatingMove]);

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

  useEffect(() => {
    if (!animationState) {
      return;
    }

    const { move, stepIndex } = animationState;
    const finalStepIndex = move.path.length - 1;

    if (stepIndex >= finalStepIndex) {
      const finishTimeout = window.setTimeout(() => {
        setGameState((current) => applyLegalMove(current, move));
        setAnimationState(null);
      }, 180);

      return () => window.clearTimeout(finishTimeout);
    }

    const stepTimeout = window.setTimeout(() => {
      setAnimationState((current) => {
        if (!current) {
          return null;
        }

        return {
          ...current,
          stepIndex: current.stepIndex + 1,
        };
      });
    }, 220);

    return () => window.clearTimeout(stepTimeout);
  }, [animationState]);

  return (
    <main className="endline-page">
      <GameTopBar
        currentPlayer={gameState.currentPlayer}
        onOpenRules={() => {
          setIsRulesOpen((current) => !current);
          setIsSettingsOpen(false);
        }}
        onOpenSettings={() => {
          setIsSettingsOpen((current) => !current);
          setIsRulesOpen(false);
        }}
        onOpenQuit={() => setIsQuitModalOpen(true)}
      />

      {gameState.winner ? (
        <section className={`endline-winner-banner ${gameState.winner}`}>
          <h2>
            {gameState.winner === "red" ? "Red Wins!" : "Blue Wins!"}
          </h2>
          {gameState.winReason ? <p>{gameState.winReason}</p> : null}
        </section>
      ) : null}

      {isRulesOpen ? (
        <div
          className="endline-modal-backdrop"
          onClick={() => setIsRulesOpen(false)}
        >
          <div
            className="endline-modal-panel-wrap"
            onClick={(event) => event.stopPropagation()}
          >
            <RulesPanel onClose={() => setIsRulesOpen(false)} />
          </div>
        </div>
      ) : null}

      {isSettingsOpen ? (
        <div
          className="endline-modal-backdrop"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="endline-modal-panel-wrap"
            onClick={(event) => event.stopPropagation()}
          >
            <SettingsPanel
              showMoveHints={gameState.showMoveHints}
              onToggleMoveHints={handleToggleHints}
              onClose={() => setIsSettingsOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {isQuitModalOpen ? (
        <QuitMatchModal
          onCancel={() => setIsQuitModalOpen(false)}
          onConfirm={handleQuitMatch}
        />
      ) : null}

      <section className="endline-layout">
        <div className="endline-board-stack">
          <Board
            pieces={gameState.pieces}
            selectedPieceId={isAnimating ? null : gameState.selectedPieceId}
            legalMoves={isAnimating ? [] : legalMoves}
            showMoveHints={isAnimating ? false : gameState.showMoveHints}
            previewPath={isAnimating ? [] : previewPath}
            previewDestination={isAnimating ? null : previewDestination}
            previewCapturedPieceId={
              isAnimating ? null : previewMove?.capturedPieceId ?? null
            }
            isGameOver={gameState.status !== "playing"}
            hiddenPieceIds={hiddenPieceIds}
            animationPiece={animationPiece}
            onSquareClick={handleSquareClick}
          />

          <aside className="endline-controls-card">
            {gameState.turnMessage ? (
              <div className="endline-turn-message">{gameState.turnMessage}</div>
            ) : null}

            <div className="endline-dice-section">
              <span className="dice-label">Roll</span>
              <DiceDisplay
                value={gameState.currentRoll}
                rollKey={gameState.rollKey}
              />
            </div>

            <div className="endline-panel-actions">
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
          </aside>
        </div>
      </section>
    </main>
  );
}

export default EndlineGame;