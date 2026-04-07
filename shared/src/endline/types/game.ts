export type PlayerId = "red" | "blue";

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
  squareColor: "light" | "dark";
};

export type GameStatus = "playing" | "red_won" | "blue_won";

export type GameState = {
  pieces: Piece[];
  currentPlayer: PlayerId;
  currentRoll: 1 | 2 | 3 | 4;
  status: GameStatus;
  winner: PlayerId | null;
  winTarget: number;
  showMoveHints: boolean;
};