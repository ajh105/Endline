import type { Piece as GamePiece } from "@shared";
import Piece from "./Piece";

type BoardSquareProps = {
  row: number;
  col: number;
  piece?: GamePiece;
};

function BoardSquare({ row, col, piece }: BoardSquareProps) {
  const squareColor = (row + col) % 2 === 0 ? "light" : "dark";

  return (
    <div className={`endline-square ${squareColor}`}>
      {piece ? <Piece owner={piece.owner} locked={piece.locked} /> : null}
    </div>
  );
}

export default BoardSquare;