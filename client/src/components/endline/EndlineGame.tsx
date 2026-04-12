import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyLegalMove,
  createInitialGameState,
  getLegalMoves,
  passTurnWithMessage,
  positionKey,
} from "@shared";
import type { GameState, LegalMove } from "@shared";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { findRoomByCode } from "../../services/rooms/findRoomByCode";
import { updateMatchState } from "../../services/matches/updateMatchState";
import { ensureAnonymousSession } from "../../services/auth/ensureAnonymousSession";
import { quitMatchToLobby } from "../../services/matches/quitMatchToLobby";
import Board from "./Board";
import DiceDisplay from "./DiceDisplay";
import GameTopBar from "./GameTopBar";
import QuitMatchModal from "./QuitMatchModal";
import RulesPanel from "./RulesPanel";
import SettingsPanel from "./SettingsPanel";
import movePieceSound from "../../assets/sounds/move-piece.mp3";

type AnimationState = {
  move: LegalMove;
  stepIndex: number;
};

type EndlineGameProps = {
  roomCode: string | null;
};

function EndlineGame({ roomCode }: EndlineGameProps) {
  const navigate = useNavigate();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoadingMatch, setIsLoadingMatch] = useState(true);
  const [matchLoadError, setMatchLoadError] = useState("");

  const [animationState, setAnimationState] = useState<AnimationState | null>(
    null
  );

  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);

  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  const [currentPlayerColor, setCurrentPlayerColor] = useState<"red" | "blue" | null>(null);

  const [playerLabels, setPlayerLabels] = useState<{
    red: string;
    blue: string;
  }>({
    red: "Red",
    blue: "Blue",
  });

  const moveSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadMatch = async () => {
      setIsLoadingMatch(true);
      setMatchLoadError("");

      try {
        const session = await ensureAnonymousSession();
        const authUserId = session?.user.id;

        if (!authUserId) {
          throw new Error("Could not create an anonymous session.");
        }

        if (!roomCode) {
          setActiveMatchId(null);
          setCurrentPlayerColor(null);
          setGameState(createInitialGameState());
          return;
        }

        const room = await findRoomByCode(roomCode);

        if (!room) {
          throw new Error("Match room not found.");
        }

        if (!room.active_match_id) {
          throw new Error("No active match was found for this room.");
        }

        setActiveMatchId(room.active_match_id);

        const { data: playerRows, error: playersError } = await supabase
          .from("room_players")
          .select("id, auth_user_id, display_name")
          .eq("room_id", room.id);

        if (playersError) {
          throw playersError;
        }

        const currentRoomPlayer = (playerRows ?? []).find(
          (player) => player.auth_user_id === authUserId
        );

        const { data: matchSessionRow, error: matchSessionError } = await supabase
          .from("match_sessions")
          .select("red_player_id, blue_player_id")
          .eq("id", room.active_match_id)
          .single();

        if (matchSessionError) {
          throw matchSessionError;
        }

        if (currentRoomPlayer) {
          if (currentRoomPlayer.id === matchSessionRow.red_player_id) {
            setCurrentPlayerColor("red");
          } else if (currentRoomPlayer.id === matchSessionRow.blue_player_id) {
            setCurrentPlayerColor("blue");
          } else {
            setCurrentPlayerColor(null);
          }
        } else {
          setCurrentPlayerColor(null);
        }

        const redPlayer = (playerRows ?? []).find(
          (player) => player.id === matchSessionRow.red_player_id
        );

        const bluePlayer = (playerRows ?? []).find(
          (player) => player.id === matchSessionRow.blue_player_id
        );

        setPlayerLabels({
          red: redPlayer?.display_name ?? "Red",
          blue: bluePlayer?.display_name ?? "Blue",
        });

        const { data: matchStateRow, error } = await supabase
          .from("match_states")
          .select("state")
          .eq("match_id", room.active_match_id)
          .single();

        if (error) {
          throw error;
        }

        setGameState(matchStateRow.state as GameState);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load match.";
        setMatchLoadError(message);
      } finally {
        setIsLoadingMatch(false);
      }
    };

    void loadMatch();
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode) {
      return;
    }

    let isCancelled = false;
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      try {
        const room = await findRoomByCode(roomCode);

        if (!room?.active_match_id || isCancelled) {
          return;
        }

        const matchId = room.active_match_id;
        setActiveMatchId(matchId);

        activeChannel = supabase
          .channel(`match-${matchId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "match_states",
              filter: `match_id=eq.${matchId}`,
            },
            async () => {
              const { data, error } = await supabase
                .from("match_states")
                .select("state")
                .eq("match_id", matchId)
                .single();

              if (!error && data?.state && !isCancelled) {
                setGameState(data.state as GameState);
              }
            }
          )
          .subscribe();
      } catch {
        // Keep current state if subscription setup fails.
      }
    };

    void setupSubscription();

    return () => {
      isCancelled = true;

      if (activeChannel) {
        void supabase.removeChannel(activeChannel);
      }
    };
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode) {
      return;
    }

    let isCancelled = false;
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRoomSubscription = async () => {
      try {
        const room = await findRoomByCode(roomCode);

        if (!room || isCancelled) {
          return;
        }

        activeChannel = supabase
          .channel(`room-status-${room.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "rooms",
              filter: `id=eq.${room.id}`,
            },
            async () => {
              const updatedRoom = await findRoomByCode(roomCode);

              if (!updatedRoom || isCancelled) {
                return;
              }

              if (updatedRoom.status !== "in_match") {
                navigate(`/lobby/${roomCode}`);
              }
            }
          )
          .subscribe();
      } catch {
        // Leave current state if room subscription fails.
      }
    };

    void setupRoomSubscription();

    return () => {
      isCancelled = true;

      if (activeChannel) {
        void supabase.removeChannel(activeChannel);
      }
    };
  }, [roomCode, navigate]);

  const selectedPiece = useMemo(() => {
    if (!gameState) {
      return null;
    }

    return (
      gameState.pieces.find((piece) => piece.id === gameState.selectedPieceId) ??
      null
    );
  }, [gameState]);

  const legalMoves = useMemo(() => {
    if (!gameState || !selectedPiece || gameState.status !== "playing") {
      return [];
    }

    return getLegalMoves(
      selectedPiece,
      gameState.pieces,
      gameState.currentRoll
    );
  }, [selectedPiece, gameState]);

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

  const previewMove = gameState?.previewMove ?? null;
  const previewPath = previewMove?.path ?? [];
  const previewDestination = previewMove?.destination ?? null;

  const isAnimating = animationState !== null;
  const animatingMove = animationState?.move ?? null;

  const isUsersTurn =
    !roomCode || (currentPlayerColor !== null && currentPlayerColor === gameState?.currentPlayer);

  const currentTurnLabel =
    gameState?.currentPlayer === "red"
      ? playerLabels.red
      : playerLabels.blue;

  const animationPiece = useMemo(() => {
    if (!animationState || !gameState) {
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
  }, [animationState, gameState]);

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

  const getMovesForDestination = (row: number, col: number): LegalMove[] => {
    return groupedMoves.get(`${row},${col}`) ?? [];
  };

  const handleSquareClick = (row: number, col: number) => {
    if (
      !gameState ||
      gameState.status !== "playing" ||
      isAnimating ||
      !isUsersTurn
    ) {
      return;
    }

    const destinationMoves = getMovesForDestination(row, col);

    if (destinationMoves.length > 0) {
      setGameState((current) => {
        if (!current) {
          return current;
        }

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
      setGameState((current) =>
        current
          ? {
              ...current,
              selectedPieceId: null,
              previewMove: null,
              turnMessage: null,
            }
          : current
      );
      return;
    }

    if (clickedPiece.owner !== gameState.currentPlayer || clickedPiece.locked) {
      return;
    }

    setGameState((current) =>
      current
        ? {
            ...current,
            selectedPieceId:
              current.selectedPieceId === clickedPiece.id
                ? null
                : clickedPiece.id,
            previewMove: null,
            turnMessage: null,
          }
        : current
    );
  };

  const handleResetGame = () => {
    if (roomCode) {
      return;
    }

    setAnimationState(null);
    setGameState(createInitialGameState());
  };

  const handleQuitMatch = async () => {
    setIsQuitModalOpen(false);

    if (roomCode) {
      try {
        await quitMatchToLobby(roomCode);
      } catch (error) {
        console.error("Failed to quit match:", error);
      }

      return;
    }

    navigate("/");
  };

  const handleToggleHints = () => {
    setGameState((current) =>
      current
        ? {
            ...current,
            showMoveHints: !current.showMoveHints,
          }
        : current
    );
  };

  const handleToggleSoundEffects = () => {
    setGameState((current) =>
      current
        ? {
            ...current,
            soundEffectsEnabled: !current.soundEffectsEnabled,
          }
        : current
    );
  };

  const handleConfirmMove = () => {
    if (!gameState?.previewMove || isAnimating || !isUsersTurn) {
      return;
    }

    const moveToAnimate = gameState.previewMove;

    setGameState((current) =>
      current
        ? {
            ...current,
            selectedPieceId: null,
            previewMove: null,
            turnMessage: null,
          }
        : current
    );

    setAnimationState({
      move: moveToAnimate,
      stepIndex: 0,
    });
  };

  useEffect(() => {
    if (!gameState || gameState.status !== "playing") {
      return;
    }

    const hasAnyLegalMove = gameState.pieces.some((piece) => {
      if (
        !piece.alive ||
        piece.locked ||
        piece.owner !== gameState.currentPlayer
      ) {
        return false;
      }

      return (
        getLegalMoves(piece, gameState.pieces, gameState.currentRoll).length > 0
      );
    });

    if (hasAnyLegalMove) {
      return;
    }

    const playerLabel =
      gameState.currentPlayer === "red" ? playerLabels.red : playerLabels.blue;

    const message = `${playerLabel} has no legal moves for roll ${gameState.currentRoll}. Turn passes.`;

    const timeoutId = window.setTimeout(() => {
      setGameState((current) => {
        if (
          !current ||
          current.status !== "playing" ||
          current.currentPlayer !== gameState.currentPlayer ||
          current.currentRoll !== gameState.currentRoll
        ) {
          return current;
        }

        const nextState = passTurnWithMessage(current, message);

        if (roomCode && activeMatchId) {
          void updateMatchState(activeMatchId, nextState).catch((error) => {
            console.error("Failed to sync auto-pass:", error);
          });
          return current;
        }

        return nextState;
      });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [gameState]);

  useEffect(() => {
    if (!animationState || !gameState) {
      return;
    }

    const { move, stepIndex } = animationState;
    const finalStepIndex = move.path.length - 1;

    if (
      stepIndex > 0 &&
      gameState.soundEffectsEnabled &&
      moveSoundRef.current
    ) {
      moveSoundRef.current.currentTime = 0;
      void moveSoundRef.current.play().catch(() => {});
    }

    if (stepIndex >= finalStepIndex) {
      const finishTimeout = window.setTimeout(() => {
        setGameState((current) => {
          if (!current) {
            return current;
          }

          const nextState = applyLegalMove(current, move);

          if (roomCode && activeMatchId) {
            void updateMatchState(activeMatchId, nextState).catch((error) => {
              console.error("Failed to sync move:", error);
            });
            return current;
          }

          return nextState;
        });

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
  }, [animationState, gameState]);

  if (isLoadingMatch) {
    return (
      <main className="endline-page">
        <div className="content-card">
          <p>Loading match...</p>
        </div>
      </main>
    );
  }

  if (matchLoadError || !gameState) {
    return (
      <main className="endline-page">
        <div className="content-card">
          <p>{matchLoadError || "Failed to load match."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="endline-page">
      <GameTopBar
        currentPlayer={gameState.currentPlayer}
        currentTurnLabel={currentTurnLabel}
        winTarget={gameState.winTarget}
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
          <h2>{gameState.winner === "red" ? "Red Wins!" : "Blue Wins!"}</h2>
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
              soundEffectsEnabled={gameState.soundEffectsEnabled}
              onToggleMoveHints={handleToggleHints}
              onToggleSoundEffects={handleToggleSoundEffects}
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
                disabled={!gameState.previewMove || !isUsersTurn}
              >
                Move
              </button>

              <button
                type="button"
                onClick={handleResetGame}
                disabled={Boolean(roomCode)}
              >
                Reset Game
              </button>
            </div>
          </aside>
        </div>
      </section>

      <audio ref={moveSoundRef} preload="auto" src={movePieceSound} />
    </main>
  );
}

export default EndlineGame;