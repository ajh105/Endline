import { Link, useNavigate, useParams } from "react-router-dom";

function LobbyPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const handleStartLocalMock = () => {
    navigate("/game/local");
  };

  return (
    <main className="app-page">
      <section className="app-shell">
        <div className="page-topbar">
          <h1>Lobby</h1>
          <Link className="text-link" to="/">
            Back Home
          </Link>
        </div>

        <div className="content-card">
          <p>
            <strong>Room Code:</strong> {roomCode}
          </p>
          <p>This page will later support player list, host settings, and ready/start flow.</p>
          <button className="menu-button primary" onClick={handleStartLocalMock}>
            Start Mock Match
          </button>
        </div>
      </section>
    </main>
  );
}

export default LobbyPage;