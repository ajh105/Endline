type PieceProps = {
  owner: "red" | "blue";
  locked: boolean;
};

function Piece({ owner, locked }: PieceProps) {
  return (
    <div className={`endline-piece ${owner} ${locked ? "locked" : ""}`}>
      {locked ? "✓" : ""}
    </div>
  );
}

export default Piece;