import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ensureAnonymousSession } from "../services/auth/ensureAnonymousSession";
import { generateRoomCode } from "../utils/rooms/generateRoomCode";

function CreateRoomPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCreateRoom = async () => {
    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter a display name.");
      return;
    }

    setIsCreating(true);
    setErrorMessage("");

    try {
      const session = await ensureAnonymousSession();
      const authUserId = session?.user.id;

      if (!authUserId) {
        throw new Error("Could not create an anonymous session.");
      }

      let roomCode = "";
      let roomInserted = false;
      let roomId = "";

      for (let attempt = 0; attempt < 10; attempt += 1) {
        roomCode = generateRoomCode();

        const { data: roomData, error: roomError } = await supabase
          .from("rooms")
          .insert({
            code: roomCode,
            status: "lobby",
            host_player_id: authUserId,
            active_match_id: null,
          })
          .select("id, code")
          .single();

        if (!roomError && roomData) {
          roomInserted = true;
          roomId = roomData.id;
          roomCode = roomData.code;
          break;
        }
      }

      if (!roomInserted || !roomId) {
        throw new Error("Failed to create a unique room code.");
      }

      const { error: playerError } = await supabase.from("room_players").insert({
        room_id: roomId,
        auth_user_id: authUserId,
        display_name: trimmedName,
        seat_order: 1,
        is_host: true,
        is_ready: true,
        is_connected: true,
      });

      if (playerError) {
        throw playerError;
      }

      const { error: settingsError } = await supabase.from("lobby_settings").insert({
        room_id: roomId,
        win_target: 4,
        board_theme: "classic",
        move_hints_enabled: true,
        sound_effects_enabled: true,
      });

      if (settingsError) {
        throw settingsError;
      }

      navigate(`/lobby/${roomCode}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create room.";
      setErrorMessage(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="app-page">
      <section className="app-shell">
        <div className="page-topbar">
          <h1>Create Room</h1>
          <Link className="page-nav-button" to="/">
            Back Home
          </Link>
        </div>

        <div className="content-card">
          <div className="stack-form">
            <label htmlFor="displayName">Your Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Enter your display name"
              maxLength={24}
            />

            {errorMessage ? <p>{errorMessage}</p> : null}

            <button
              className="menu-button primary"
              type="button"
              onClick={handleCreateRoom}
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create Room"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CreateRoomPage;