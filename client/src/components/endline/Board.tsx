import type { LegalMove, Piece as GamePiece } from "@shared";
import { BOARD_SIZE } from "@shared";
import BoardSquare from "./BoardSquare";

type BoardProps = {
  pieces: GamePiece[];
  selectedPieceId: string | null;
  legalMoves: LegalMove[];
  showMoveHints: boolean;
  onSquareClick: (row: number, col: number) => void;
};

function Board({
  pieces,
  selectedPieceId,
  legalMoves,
  showMoveHints,
  onSquareClick,
}: BoardProps) {
  const getPieceAtPosition = (row: number, col: number) => {
    return pieces.find(
      (piece) =>
        piece.alive &&
        piece.position.row === row &&
        piece.position.col === col
    );
  };

  const isLegalDestination = (row: number, col: number) => {
    if (!showMoveHints) {
      return false;
    }

    return legalMoves.some(
      (move) => move.destination.row === row && move.destination.col === col
    );
  };

  return (
    <div className="endline-board">
      {Array.from({ length: BOARD_SIZE }, (_, row) =>
        Array.from({ length: BOARD_SIZE }, (_, col) => {
          const piece = getPieceAtPosition(row, col);

          return (
            <BoardSquare
              key={`${row}-${col}`}
              row={row}
              col={col}
              piece={piece}
              isSelected={piece?.id === selectedPieceId}
              isLegalDestination={isLegalDestination(row, col)}
              onClick={() => onSquareClick(row, col)}
            />
          );
        })
      )}
    </div>
  );
}

export default Board;