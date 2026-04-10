import type { PlayerId } from "./game";

export type MatchSessionStatus = "playing" | "red_won" | "blue_won";

export type MatchSession = {
  id: string;
  roomId: string;
  status: MatchSessionStatus;
  startedAt: string;
  endedAt: string | null;
  winner: PlayerId | null;
  redPlayerId: string | null;
  bluePlayerId: string | null;
};