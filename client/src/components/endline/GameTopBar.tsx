import type { PlayerId } from "@shared";

type GameTopBarProps = {
  currentPlayer: PlayerId;
  currentTurnLabel: string;
  winTarget: number;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onOpenQuit: () => void;
};

function GameTopBar({
  currentPlayer,
  currentTurnLabel,
  winTarget,
  onOpenRules,
  onOpenSettings,
  onOpenQuit,
}: GameTopBarProps) {
  return (
    <header className="endline-topbar">
      <div className="endline-turn-banner">
        <span className="turn-label">Current Turn</span>
        <span className={`player-badge ${currentPlayer}`}>
          {currentTurnLabel}
        </span>
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