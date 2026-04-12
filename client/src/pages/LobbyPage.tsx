import { useEffect, useMemo, useState } from "react";
import type { BoardTheme, LobbySettings, Room, RoomPlayer } from "@shared";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ensureAnonymousSession } from "../services/auth/ensureAnonymousSession";
import { findRoomByCode } from "../services/rooms/findRoomByCode";
import { startMatchForRoom } from "../services/matches/startMatchForRoom";
import { leaveRoomByCode } from "../services/rooms/leaveRoomByCode";

function LobbyPage() {
  const { roomCode = "ABCD" } = useParams();
  const navigate = useNavigate();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [settings, setSettings] = useState<LobbySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isStartingMatch, setIsStartingMatch] = useState(false);

  const currentUser =
    players.find((player) => player.auth_user_id === currentUserId) ?? null;

  const isHost = currentUser
    ? currentUser.auth_user_id === room?.hostPlayerId
    : false;

  const readyCount = useMemo(
    () => players.filter((player) => player.isReady).length,
    [players]
  );

  const allPlayersReady =
    players.length >= 2 && players.every((player) => player.isReady);

  const canStartMatch = isHost && allPlayersReady;

  const fetchRoom = async (code: string) => {
    const foundRoom = await findRoomByCode(code);

    if (!foundRoom) {
      throw new Error("Room not found.");
    }

    const mappedRoom: Room = {
      id: foundRoom.id,
      code: foundRoom.code,
      status: foundRoom.status,
      createdAt: foundRoom.created_at,
      hostPlayerId: foundRoom.host_player_id,
      activeMatchId: foundRoom.active_match_id,
    };

    setRoom(mappedRoom);
    return mappedRoom;
  };

  const fetchPlayers = async (roomId: string) => {
    const { data, error } = await supabase
      .from("room_players")
      .select("*")
      .eq("room_id", roomId)
      .order("seat_order", { ascending: true });

    if (error) {
      throw error;
    }

    const mappedPlayers: RoomPlayer[] = (data ?? []).map((player) => ({
      id: player.id,
      roomId: player.room_id,
      auth_user_id: player.auth_user_id,
      name: player.display_name,
      seatOrder: player.seat_order,
      isHost: player.is_host,
      isReady: player.is_ready,
      joinedAt: player.joined_at,
      isConnected: player.is_connected,
    }));

    setPlayers(mappedPlayers);
  };

  const fetchSettings = async (roomId: string) => {
    const { data, error } = await supabase
      .from("lobby_settings")
      .select("*")
      .eq("room_id", roomId)
      .single();

    if (error) {
      throw error;
    }

    const mappedSettings: LobbySettings = {
      roomId: data.room_id,
      winTarget: data.win_target,
      boardTheme: data.board_theme as BoardTheme,
      moveHintsEnabled: data.move_hints_enabled,
      soundEffectsEnabled: data.sound_effects_enabled,
    };

    setSettings(mappedSettings);
  };

  useEffect(() => {
    const loadLobby = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const session = await ensureAnonymousSession();
        const authUserId = session?.user.id;

        if (!authUserId) {
          throw new Error("Could not create an anonymous session.");
        }

        setCurrentUserId(authUserId);

        const loadedRoom = await fetchRoom(roomCode);
        await fetchPlayers(loadedRoom.id);
        await fetchSettings(loadedRoom.id);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load lobby.";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadLobby();
  }, [roomCode]);

  useEffect(() => {
    if (!room) {
      return;
    }

    const channel = supabase
      .channel(`lobby-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_players",
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          void fetchPlayers(room.id);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lobby_settings",
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          void fetchSettings(room.id);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${room.id}`,
        },
        () => {
          void fetchRoom(room.code);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [room]);

  useEffect(() => {
    if (room?.status === "in_match" && room.activeMatchId) {
      navigate(`/game/${room.code}`);
    }
  }, [room, navigate]);

  useEffect(() => {
    if (room?.status === "closed") {
      navigate("/");
    }
  }, [room, navigate]);

  const handleLeaveLobby = async () => {
    try {
      await leaveRoomByCode(roomCode);
      navigate("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to leave lobby.";
      setErrorMessage(message);
    }
  };

  const toggleOwnReady = async () => {
    if (!currentUser) {
      return;
    }

    const nextReadyValue = !currentUser.isReady;

    const { error } = await supabase
      .from("room_players")
      .update({ is_ready: nextReadyValue })
      .eq("id", currentUser.id);

    if (error) {
      setErrorMessage(error.message);
    }
  };

  const updateWinTarget = async (nextWinTarget: number) => {
    if (!room || !settings || !isHost) {
      return;
    }

    const { error } = await supabase
      .from("lobby_settings")
      .update({ win_target: nextWinTarget })
      .eq("room_id", room.id);

    if (error) {
      setErrorMessage(error.message);
    }
  };

  const updateBoardTheme = async (nextTheme: BoardTheme) => {
    if (!room || !settings || !isHost) {
      return;
    }

    const { error } = await supabase
      .from("lobby_settings")
      .update({ board_theme: nextTheme })
      .eq("room_id", room.id);

    if (error) {
      setErrorMessage(error.message);
    }
  };

    const handleStartMatch = async () => {
    if (!canStartMatch || !room || !settings) {
      return;
    }

    setIsStartingMatch(true);
    setErrorMessage("");

    try {
      await startMatchForRoom({
        room,
        players,
        settings,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start match.";
      setErrorMessage(message);
    } finally {
      setIsStartingMatch(false);
    }
  };

  if (isLoading) {
    return (
      <main className="app-page">
        <section className="app-shell lobby-shell">
          <div className="page-topbar">
            <h1>Lobby</h1>
          </div>

          <div className="content-card">
            <p>Loading lobby...</p>
          </div>
        </section>
      </main>
    );
  }

  if (errorMessage && !room) {
    return (
      <main className="app-page">
        <section className="app-shell lobby-shell">
          <div className="page-topbar">
            <h1>Lobby</h1>
          </div>

          <div className="content-card">
            <p>{errorMessage}</p>
          </div>
        </section>
      </main>
    );
  }

  if (!room || !settings) {
    return null;
  }

  return (
    <main className="app-page">
      <section className="app-shell lobby-shell">
        <div className="page-topbar">
          <h1>Lobby</h1>
        </div>

        {errorMessage ? (
          <div className="content-card" style={{ marginBottom: "18px" }}>
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <div className="lobby-layout">
          <section className="lobby-card lobby-room-card">
            <div className="lobby-room-header">
              <div>
                <p className="lobby-eyebrow">Room Code</p>
                <h2 className="lobby-room-code">{room.code}</h2>
              </div>

              <div className="lobby-status-pill">
                {readyCount}/{players.length} Ready
              </div>
            </div>

            <p className="lobby-room-note">
              {isHost
                ? "You are the host. Configure the match and start when everyone is ready."
                : "Wait for the host to start the match once everyone is ready."}
            </p>
          </section>

          <section className="lobby-card">
            <div className="lobby-section-header">
              <h3>Players</h3>
              <span className="lobby-subtle-text">
                {isHost ? "Host controls enabled" : "Guest view"}
              </span>
            </div>

            <div className="lobby-player-list">
              {players.map((player) => {
                const isCurrentUser = player.auth_user_id === currentUserId;

                return (
                  <div className="lobby-player-row" key={player.id}>
                    <div className="lobby-player-meta">
                      <div className="lobby-player-name-row">
                        <span className="lobby-player-name">
                          {player.name}
                          {isCurrentUser ? " (You)" : ""}
                        </span>

                        {player.isHost ? (
                          <span className="lobby-host-badge">Host</span>
                        ) : null}
                      </div>

                      <span
                        className={`lobby-ready-badge ${
                          player.isReady ? "ready" : "not-ready"
                        }`}
                      >
                        {player.isReady ? "Ready" : "Not Ready"}
                      </span>
                    </div>

                    {isCurrentUser ? (
                      <button
                        type="button"
                        className="lobby-toggle-button"
                        onClick={toggleOwnReady}
                      >
                        {player.isReady ? "Unready" : "Ready Up"}
                      </button>
                    ) : (
                      <span className="lobby-player-placeholder">
                        {player.isHost ? "Host controls room" : "Waiting"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="lobby-card">
            <div className="lobby-section-header">
              <h3>Match Settings</h3>
              <span className="lobby-subtle-text">
                {isHost ? "Editable by host" : "Host only"}
              </span>
            </div>

            <div className="lobby-settings-grid">
              <label className="lobby-setting-row">
                <span>Pieces to Win</span>
                <select
                  value={settings.winTarget}
                  disabled={!isHost}
                  onChange={(event) =>
                    updateWinTarget(Number(event.target.value))
                  }
                >
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                  <option value={6}>6</option>
                  <option value={7}>7</option>
                  <option value={8}>8</option>
                </select>
              </label>

              <label className="lobby-setting-row">
                <span>Board Theme</span>
                <select
                  value={settings.boardTheme}
                  disabled={!isHost}
                  onChange={(event) =>
                    updateBoardTheme(event.target.value as BoardTheme)
                  }
                >
                  <option value="classic">Classic</option>
                  <option value="midnight">Midnight</option>
                  <option value="ember">Ember</option>
                </select>
              </label>
            </div>
          </section>

          <section className="lobby-card lobby-actions-card">
            <div className="lobby-actions">
              <button
                type="button"
                className="lobby-action-button primary"
                onClick={handleStartMatch}
                disabled={!canStartMatch || isStartingMatch}
              >
                {isStartingMatch ? "Starting..." : "Start Match"}
              </button>

              <button
                type="button"
                className="lobby-action-button"
                onClick={handleLeaveLobby}
              >
                Leave Lobby
              </button>
            </div>

            {!isHost ? (
              <p className="lobby-helper-text">
                Only the host can start the match.
              </p>
            ) : !allPlayersReady ? (
              <p className="lobby-helper-text">
                All current players must be ready before starting.
              </p>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}

export default LobbyPage;