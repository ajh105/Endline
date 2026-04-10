type SettingsPanelProps = {
  showMoveHints: boolean;
  soundEffectsEnabled: boolean;
  onToggleMoveHints: () => void;
  onToggleSoundEffects: () => void;
  onClose: () => void;
};

function SettingsPanel({
  showMoveHints,
  soundEffectsEnabled,
  onToggleMoveHints,
  onToggleSoundEffects,
  onClose,
}: SettingsPanelProps) {
  return (
    <div className="endline-floating-panel">
      <div className="endline-floating-panel-header">
        <h3>Settings</h3>
        <button type="button" className="panel-close-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="endline-floating-panel-body">
        <label className="settings-row">
          <span>Show Move Hints</span>
          <input
            type="checkbox"
            checked={showMoveHints}
            onChange={onToggleMoveHints}
          />
        </label>

        <label className="settings-row">
          <span>Sound Effects</span>
          <input
            type="checkbox"
            checked={soundEffectsEnabled}
            onChange={onToggleSoundEffects}
          />
        </label>
      </div>
    </div>
  );
}

export default SettingsPanel;