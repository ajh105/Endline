import { Link } from "react-router-dom";

function HomePage() {
  return (
    <main className="app-page">
      <section className="app-shell">
        <h1 className="app-title">Endline</h1>
        <p className="app-subtitle">
          A tactical path-based board game of movement, capture, and timing.
        </p>

        <div className="menu-grid">
          <Link className="menu-button primary" to="/game/local">
            Local Game
          </Link>

          <Link className="menu-button" to="/rooms/create">
            Create Room
          </Link>

          <Link className="menu-button" to="/rooms/join">
            Join Room
          </Link>

          <Link className="menu-button" to="/rules">
            Rules
          </Link>

          <Link className="menu-button" to="/settings">
            Settings
          </Link>
        </div>
      </section>
    </main>
  );
}

export default HomePage;