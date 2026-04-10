import { createInitialGameState } from "@shared";
import type { LobbySettings, Room, RoomPlayer } from "@shared";
import { supabase } from "../../lib/supabase";

type StartMatchArgs = {
  room: Room;
  players: RoomPlayer[];
  settings: LobbySettings;
};

export async function startMatchForRoom({
  room,
  players,
  settings,
}: StartMatchArgs) {
  const orderedPlayers = [...players].sort((a, b) => a.seatOrder - b.seatOrder);

  const redPlayer = orderedPlayers[0] ?? null;
  const bluePlayer = orderedPlayers[1] ?? null;

  const { data: matchSession, error: matchSessionError } = await supabase
    .from("match_sessions")
    .insert({
      room_id: room.id,
      status: "playing",
      winner: null,
      red_player_id: redPlayer?.id ?? null,
      blue_player_id: bluePlayer?.id ?? null,
    })
    .select("id")
    .single();

  if (matchSessionError) {
    throw matchSessionError;
  }

  const initialGameState = createInitialGameState();

  const syncedGameState = {
    ...initialGameState,
    winTarget: settings.winTarget,
    showMoveHints: settings.moveHintsEnabled,
    soundEffectsEnabled: settings.soundEffectsEnabled,
  };

  const { error: matchStateError } = await supabase.from("match_states").insert({
    match_id: matchSession.id,
    state: syncedGameState,
  });

  if (matchStateError) {
    throw matchStateError;
  }

  const { error: roomUpdateError } = await supabase
    .from("rooms")
    .update({
      status: "in_match",
      active_match_id: matchSession.id,
    })
    .eq("id", room.id);

  if (roomUpdateError) {
    throw roomUpdateError;
  }

  return matchSession.id;
}