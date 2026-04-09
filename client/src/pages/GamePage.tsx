import { Link } from "react-router-dom";
import EndlineGame from "../components/endline/EndlineGame";

function GamePage() {
  return (
    <main className="app-page">
      <section className="app-shell game-shell">
        <div className="page-topbar">
          <h1>Endline Match</h1>
          <Link className="text-link" to="/">
            Back Home
          </Link>
        </div>

        <EndlineGame />
      </section>
    </main>
  );
}

export default GamePage;