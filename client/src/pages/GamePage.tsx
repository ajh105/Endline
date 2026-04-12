import { Link, useParams } from "react-router-dom";
import EndlineGame from "../components/endline/EndlineGame";

function GamePage() {
  const { roomCode } = useParams();

  return (
    <main className="app-page">
      <section className="app-shell game-shell">
        <div className="page-topbar">
          <h1>Endline Match</h1>
          {!roomCode ? (
            <Link className="page-nav-button" to="/">
              Back Home
            </Link>
          ) : null}
        </div>

        <EndlineGame roomCode={roomCode ?? null} />
      </section>
    </main>
  );
}

export default GamePage;