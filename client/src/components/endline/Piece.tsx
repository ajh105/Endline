type PieceProps = {
  owner: "red" | "blue";
  locked: boolean;
  isSelected: boolean;
};

function Piece({ owner, locked, isSelected }: PieceProps) {
  return (
    <div
      className={`endline-piece ${owner} ${locked ? "locked" : ""} ${
        isSelected ? "selected" : ""
      }`}
    >
      {locked ? "✓" : ""}
    </div>
  );
}

export default Piece;