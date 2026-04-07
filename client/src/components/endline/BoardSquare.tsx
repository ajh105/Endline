import type { Piece as GamePiece } from "@shared";
import Piece from "./Piece";

type BoardSquareProps = {
  row: number;
  col: number;
  piece?: GamePiece;
  isSelected: boolean;
  isLegalDestination: boolean;
  onClick: () => void;
};

function BoardSquare({
  row,
  col,
  piece,
  isSelected,
  isLegalDestination,
  onClick,
}: BoardSquareProps) {
  const squareColor = (row + col) % 2 === 0 ? "light" : "dark";

  return (
    <button
      type="button"
      className={`endline-square ${squareColor} ${
        isLegalDestination ? "legal-destination" : ""
      }`}
      onClick={onClick}
    >
      {piece ? (
        <Piece owner={piece.owner} locked={piece.locked} isSelected={isSelected} />
      ) : null}
    </button>
  );
}

export default BoardSquare;