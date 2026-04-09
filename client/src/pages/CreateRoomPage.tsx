import { Link, useNavigate } from "react-router-dom";

function CreateRoomPage() {
  const navigate = useNavigate();

  const handleCreateMockRoom = () => {
    navigate("/lobby/ABCD");
  };

  return (
    <main className="app-page">
      <section className="app-shell">
        <div className="page-topbar">
          <h1>Create Room</h1>
          <Link className="text-link" to="/">
            Back Home
          </Link>
        </div>

        <div className="content-card">
          <p>This page will create a multiplayer room later.</p>
          <button className="menu-button primary" onClick={handleCreateMockRoom}>
            Create Mock Room
          </button>
        </div>
      </section>
    </main>
  );
}

export default CreateRoomPage;