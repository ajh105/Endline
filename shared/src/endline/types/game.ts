export type PlayerId = "red" | "blue";

export type SquareColor = "light" | "dark";

export type Position = {
  row: number;
  col: number;
};

export type Piece = {
  id: string;
  owner: PlayerId;
  position: Position;
  locked: boolean;
  hasLeftBaseline: boolean;
  alive: boolean;
  squareColor: SquareColor;
};

export type GameStatus = "playing" | "red_won" | "blue_won";

export type LegalMove = {
  pieceId: string;
  path: Position[];
  destination: Position;
  capturedPieceId: string | null;
};

export type GameState = {
  pieces: Piece[];
  currentPlayer: PlayerId;
  currentRoll: 1 | 2 | 3 | 4;
  status: GameStatus;
  winner: PlayerId | null;
  winTarget: number;
  showMoveHints: boolean;
  selectedPieceId: string | null;
  previewMove: LegalMove | null;
  turnMessage: string | null;
};