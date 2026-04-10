import { Navigate, Route, Routes } from "react-router-dom";
import CreateRoomPage from "./pages/CreateRoomPage";
import GamePage from "./pages/GamePage";
import HomePage from "./pages/HomePage";
import JoinRoomPage from "./pages/JoinRoomPage";
import LobbyPage from "./pages/LobbyPage";
import RulesPage from "./pages/RulesPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/game/local" element={<GamePage />} />
      <Route path="/game/:roomCode" element={<GamePage />} />
      <Route path="/rules" element={<RulesPage />} />
      <Route path="/rooms/create" element={<CreateRoomPage />} />
      <Route path="/rooms/join" element={<JoinRoomPage />} />
      <Route path="/lobby/:roomCode" element={<LobbyPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;