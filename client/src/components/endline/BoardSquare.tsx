import type { Piece as GamePiece } from "@shared";
import Piece from "./Piece";

type BoardSquareProps = {
  row: number;
  col: number;
  piece?: GamePiece;
  isSelected: boolean;
  isLegalDestination: boolean;
  previewStepNumber: number | null;
  isPreviewDestination: boolean;
  isPreviewCapturedPiece: boolean;
  onClick: () => void;
};

function BoardSquare({
  row,
  col,
  piece,
  isSelected,
  isLegalDestination,
  previewStepNumber,
  isPreviewDestination,
  isPreviewCapturedPiece,
  onClick,
}: BoardSquareProps) {
  const squareColor = (row + col) % 2 === 0 ? "light" : "dark";

  return (
    <button
      type="button"
      className={`endline-square ${squareColor} ${
        isLegalDestination ? "legal-destination" : ""
      } ${previewStepNumber !== null ? "preview-path" : ""} ${
        isPreviewDestination ? "preview-destination" : ""
      } ${isPreviewCapturedPiece ? "preview-capture-target" : ""}`}
      onClick={onClick}
    >
      {previewStepNumber !== null && !piece ? (
        <div className="endline-step-marker">{previewStepNumber}</div>
      ) : null}

      {piece ? (
        <>
          <Piece
            pieceId={piece.id}
            owner={piece.owner}
            locked={piece.locked}
            isSelected={isSelected}
          />
          {isPreviewCapturedPiece ? (
            <div className="endline-capture-overlay">×</div>
          ) : null}
        </>
      ) : null}
    </button>
  );
}

export default BoardSquare;