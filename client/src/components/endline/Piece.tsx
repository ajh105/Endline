type PieceProps = {
  pieceId: string;
  owner: "red" | "blue";
  locked: boolean;
  isSelected: boolean;
};

function Piece({ pieceId, owner, locked, isSelected }: PieceProps) {
  return (
    <div
      data-piece-id={pieceId}
      className={`endline-piece ${owner} ${locked ? "locked" : ""} ${
        isSelected ? "selected" : ""
      }`}
    >
      {locked ? "✓" : ""}
    </div>
  );
}

export default Piece;