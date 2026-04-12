import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ensureAnonymousSession } from "../services/auth/ensureAnonymousSession";
import { findRoomByCode } from "../services/rooms/findRoomByCode";

function JoinRoomPage() {
  const [displayName, setDisplayName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedName = displayName.trim();
    const trimmedCode = roomCode.trim().toUpperCase();

    if (!trimmedName) {
      setErrorMessage("Please enter a display name.");
      return;
    }

    if (!trimmedCode) {
      setErrorMessage("Please enter a room code.");
      return;
    }

    setIsJoining(true);
    setErrorMessage("");

    try {
      const session = await ensureAnonymousSession();
      const authUserId = session?.user.id;

      if (!authUserId) {
        throw new Error("Could not create an anonymous session.");
      }

      const room = await findRoomByCode(trimmedCode);

      if (!room) {
        throw new Error("Room not found.");
      }

      if (room.status !== "lobby") {
        throw new Error("This room is not accepting players right now.");
      }

      const { count, error: countError } = await supabase
        .from("room_players")
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id);

      if (countError) {
        throw countError;
      }

      const nextSeatOrder = (count ?? 0) + 1;

      const { error: insertPlayerError } = await supabase
        .from("room_players")
        .insert({
          room_id: room.id,
          auth_user_id: authUserId,
          display_name: trimmedName,
          seat_order: nextSeatOrder,
          is_host: false,
          is_ready: false,
          is_connected: true,
        });

      if (insertPlayerError) {
        throw insertPlayerError;
      }

      navigate(`/lobby/${room.code}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to join room.";
      setErrorMessage(message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main className="app-page">
      <section className="app-shell">
        <div className="page-topbar">
          <h1>Join Room</h1>
          <Link className="page-nav-button" to="/">
            Back Home
          </Link>
        </div>

        <div className="content-card">
          <form className="stack-form" onSubmit={handleSubmit}>
            <label htmlFor="displayName">Your Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Enter your display name"
              maxLength={24}
            />

            <label htmlFor="roomCode">Room Code</label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value)}
              placeholder="Enter room code"
              maxLength={8}
            />

            {errorMessage ? <p>{errorMessage}</p> : null}

            <button
              className="menu-button primary"
              type="submit"
              disabled={isJoining}
            >
              {isJoining ? "Joining..." : "Join Room"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default JoinRoomPage;