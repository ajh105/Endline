import { Link } from "react-router-dom";
import endlineLogo from "../assets/endline-logo.png";

function HomePage() {
  return (
    <main className="home-page">
      <div className="home-background-glow" />

      <section className="home-shell">
        <div className="home-hero">
          <img
            src={endlineLogo}
            alt="Endline logo"
            className="home-logo"
          />

          <div className="home-primary-actions">
            <Link className="hero-button primary" to="/game/local">
              Local Game
            </Link>

            <Link className="hero-button primary alt" to="/rooms/create">
              Create Room
            </Link>
          </div>

          <div className="home-secondary-actions">
            <Link className="hero-button secondary" to="/rooms/join">
              Join Room
            </Link>

            <Link className="hero-button secondary" to="/rules">
              Rules
            </Link>

            <Link className="hero-button secondary" to="/settings">
              Settings
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default HomePage;