import { Link } from "react-router-dom";

function SettingsPage() {
  return (
    <main className="app-page">
      <section className="app-shell">
        <div className="page-topbar">
          <h1>Settings</h1>
          <Link className="text-link" to="/">
            Back Home
          </Link>
        </div>

        <div className="content-card">
          <p>This page will later hold app-wide settings.</p>
          <p>Examples: sounds, theme, animation preferences, and accessibility options.</p>
        </div>
      </section>
    </main>
  );
}

export default SettingsPage;