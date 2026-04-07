import { BOARD_SIZE } from "@shared";
import type { Piece as GamePiece } from "@shared";
import BoardSquare from "./BoardSquare";

type BoardProps = {
  pieces: GamePiece[];
};

function Board({ pieces }: BoardProps) {
  const getPieceAtPosition = (row: number, col: number) => {
    return pieces.find(
      (piece) =>
        piece.alive &&
        piece.position.row === row &&
        piece.position.col === col
    );
  };

  return (
    <div className="endline-board">
      {Array.from({ length: BOARD_SIZE }, (_, row) =>
        Array.from({ length: BOARD_SIZE }, (_, col) => (
          <BoardSquare
            key={`${row}-${col}`}
            row={row}
            col={col}
            piece={getPieceAtPosition(row, col)}
          />
        ))
      )}
    </div>
  );
}

export default Board;