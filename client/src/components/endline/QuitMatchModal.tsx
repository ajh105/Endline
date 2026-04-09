type QuitMatchModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

function QuitMatchModal({ onCancel, onConfirm }: QuitMatchModalProps) {
  return (
    <div className="endline-modal-backdrop">
      <div className="endline-modal">
        <h3>Quit Match?</h3>
        <p>Are you sure you want to quit the match and return home?</p>

        <div className="endline-modal-actions">
          <button type="button" className="topbar-button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="topbar-button danger"
            onClick={onConfirm}
          >
            Quit Match
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuitMatchModal;