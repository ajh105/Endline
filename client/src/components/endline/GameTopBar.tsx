import type { PlayerId } from "@shared";

type GameTopBarProps = {
  currentPlayer: PlayerId;
  winTarget: number;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onOpenQuit: () => void;
};

function GameTopBar({
  currentPlayer,
  winTarget,
  onOpenRules,
  onOpenSettings,
  onOpenQuit,
}: GameTopBarProps) {
  const playerLabel =
    currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1);

  return (
    <header className="endline-topbar">
      <div className="endline-turn-banner">
        <span className="turn-label">Current Turn</span>
        <span className={`player-badge ${currentPlayer}`}>{playerLabel}</span>
        <span className="target-badge">Pieces to Win: {winTarget}</span>
      </div>

      <div className="endline-topbar-actions">
        <button type="button" className="topbar-button" onClick={onOpenRules}>
          Rules
        </button>
        <button type="button" className="topbar-button" onClick={onOpenSettings}>
          Settings
        </button>
        <button
          type="button"
          className="topbar-button danger"
          onClick={onOpenQuit}
          aria-label="Quit match"
        >
          ×
        </button>
      </div>
    </header>
  );
}

export default GameTopBar;