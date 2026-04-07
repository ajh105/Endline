import { useState } from "react";
import { createInitialGameState } from "@shared";
import Board from "./Board";

function EndlineGame() {
  const [gameState] = useState(() => createInitialGameState());

  return (
    <main className="endline-page">
      <section className="endline-header">
        <h1>Endline</h1>
        <p>Static board setup checkpoint</p>
      </section>

      <section className="endline-layout">
        <Board pieces={gameState.pieces} />

        <aside className="endline-panel">
          <h2>Game Info</h2>
          <p>
            <strong>Current Player:</strong> {gameState.currentPlayer}
          </p>
          <p>
            <strong>Current Roll:</strong> {gameState.currentRoll}
          </p>
          <p>
            <strong>Win Target:</strong> {gameState.winTarget}
          </p>
          <p>
            <strong>Show Move Hints:</strong>{" "}
            {gameState.showMoveHints ? "On" : "Off"}
          </p>
        </aside>
      </section>
    </main>
  );
}

export default EndlineGame;