import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmed = roomCode.trim().toUpperCase();

    if (!trimmed) {
      return;
    }

    navigate(`/lobby/${trimmed}`);
  };

  return (
    <main className="app-page">
      <section className="app-shell">
        <div className="page-topbar">
          <h1>Join Room</h1>
          <Link className="text-link" to="/">
            Back Home
          </Link>
        </div>

        <div className="content-card">
          <form className="stack-form" onSubmit={handleSubmit}>
            <label htmlFor="roomCode">Room Code</label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value)}
              placeholder="Enter room code"
            />
            <button className="menu-button primary" type="submit">
              Join Room
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default JoinRoomPage;