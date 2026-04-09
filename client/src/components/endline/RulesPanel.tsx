type RulesPanelProps = {
  onClose: () => void;
};

function RulesPanel({ onClose }: RulesPanelProps) {
  return (
    <div className="endline-floating-panel">
      <div className="endline-floating-panel-header">
        <h3>Quick Rules</h3>
        <button type="button" className="panel-close-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="endline-floating-panel-body">
        <ul className="rules-list">
          <li>Roll the d4 and move one piece exactly that many spaces.</li>
          <li>Move diagonally and stay on the same square color.</li>
          <li>You may move forward or backward.</li>
          <li>You cannot revisit squares in the same move path.</li>
          <li>You cannot return to your own baseline after leaving it.</li>
          <li>A capture can only happen as the first movement step.</li>
          <li>After a capture, continue using the remaining movement.</li>
          <li>First to the win target on the opponent baseline wins.</li>
        </ul>
      </div>
    </div>
  );
}

export default RulesPanel;