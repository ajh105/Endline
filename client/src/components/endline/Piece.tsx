import { motion } from "motion/react";

type PieceProps = {
  pieceId: string;
  owner: "red" | "blue";
  locked: boolean;
  isSelected: boolean;
};

function Piece({ pieceId, owner, locked, isSelected }: PieceProps) {
  return (
    <motion.div
      layoutId={`piece-${pieceId}`}
      layout
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 35,
      }}
      className={`endline-piece ${owner} ${locked ? "locked" : ""} ${
        isSelected ? "selected" : ""
      }`}
    >
      {locked ? "✓" : ""}
    </motion.div>
  );
}

export default Piece;