export type BoardTheme = "classic" | "midnight" | "ember";

export type RoomStatus = "lobby" | "in_match" | "closed";

export type Room = {
  id: string;
  code: string;
  status: RoomStatus;
  createdAt: string;
  hostPlayerId: string;
  activeMatchId: string | null;
};

export type RoomPlayer = {
  id: string;
  roomId: string;
  auth_user_id: string;
  name: string;
  seatOrder: number;
  isHost: boolean;
  isReady: boolean;
  joinedAt: string;
  isConnected: boolean;
};

export type LobbySettings = {
  roomId: string;
  winTarget: number;
  boardTheme: BoardTheme;
  moveHintsEnabled: boolean;
  soundEffectsEnabled: boolean;
};