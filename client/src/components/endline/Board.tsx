import type { LegalMove, Piece as GamePiece, Position } from "@shared";
import { BOARD_SIZE } from "@shared";
import { LayoutGroup, motion } from "motion/react";
import BoardSquare from "./BoardSquare";
import Piece from "./Piece";

type BoardProps = {
  pieces: GamePiece[];
  selectedPieceId: string | null;
  legalMoves: LegalMove[];
  showMoveHints: boolean;
  previewPath: Position[];
  previewDestination: Position | null;
  previewCapturedPieceId: string | null;
  isGameOver: boolean;
  hiddenPieceIds: string[];
  animationPiece: {
    pieceId: string;
    owner: "red" | "blue";
    locked: boolean;
    row: number;
    col: number;
  } | null;
  onSquareClick: (row: number, col: number) => void;
};

function Board({
  pieces,
  selectedPieceId,
  legalMoves,
  showMoveHints,
  previewPath,
  previewDestination,
  previewCapturedPieceId,
  isGameOver,
  hiddenPieceIds,
  animationPiece,
  onSquareClick,
}: BoardProps) {
  const getPieceAtPosition = (row: number, col: number) => {
    return pieces.find(
      (piece) =>
        piece.alive &&
        !hiddenPieceIds.includes(piece.id) &&
        piece.position.row === row &&
        piece.position.col === col
    );
  };

  const getPreviewStepNumber = (row: number, col: number): number | null => {
    const index = previewPath.findIndex(
      (position, pathIndex) =>
        pathIndex > 0 && position.row === row && position.col === col
    );

    return index >= 0 ? index : null;
  };

  const isLegalDestination = (row: number, col: number) => {
    if (!showMoveHints) {
      return false;
    }

    return legalMoves.some(
      (move) => move.destination.row === row && move.destination.col === col
    );
  };

  const isPreviewDestination = (row: number, col: number) => {
    return (
      previewDestination?.row === row &&
      previewDestination?.col === col
    );
  };

  const isPreviewCapturedPiece = (row: number, col: number) => {
    if (!previewCapturedPieceId) {
      return false;
    }

    return pieces.some(
      (piece) =>
        piece.alive &&
        piece.id === previewCapturedPieceId &&
        piece.position.row === row &&
        piece.position.col === col
    );
  };

  return (
    <LayoutGroup>
      <div className={`endline-board ${isGameOver ? "game-over" : ""}`}>
        {Array.from({ length: BOARD_SIZE }, (_, row) =>
          Array.from({ length: BOARD_SIZE }, (_, col) => {
            const piece = getPieceAtPosition(row, col);
            const previewStepNumber = getPreviewStepNumber(row, col);

            return (
              <BoardSquare
                key={`${row}-${col}`}
                row={row}
                col={col}
                piece={piece}
                isSelected={piece?.id === selectedPieceId}
                isLegalDestination={isLegalDestination(row, col)}
                previewStepNumber={previewStepNumber}
                isPreviewDestination={isPreviewDestination(row, col)}
                isPreviewCapturedPiece={isPreviewCapturedPiece(row, col)}
                onClick={() => onSquareClick(row, col)}
              />
            );
          })
        )}

        {animationPiece ? (
          <motion.div
            className="endline-animation-piece-layer"
            initial={false}
            animate={{
              x: animationPiece.col * 72 + 12,
              y: animationPiece.row * 72 + 12,
            }}
            transition={{
              duration: 0.18,
              ease: "easeInOut",
            }}
          >
            <Piece
              pieceId={animationPiece.pieceId}
              owner={animationPiece.owner}
              locked={animationPiece.locked}
              isSelected={false}
            />
          </motion.div>
        ) : null}
      </div>
    </LayoutGroup>
  );
}

export default Board;