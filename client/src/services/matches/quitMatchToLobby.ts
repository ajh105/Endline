import { supabase } from "../../lib/supabase";
import { findRoomByCode } from "../rooms/findRoomByCode";

export async function quitMatchToLobby(roomCode: string) {
  const room = await findRoomByCode(roomCode);

  if (!room) {
    throw new Error("Room not found.");
  }

  const { error: roomUpdateError } = await supabase
    .from("rooms")
    .update({
      status: "lobby",
      active_match_id: null,
    })
    .eq("id", room.id);

  if (roomUpdateError) {
    throw roomUpdateError;
  }

  const { error: playersUpdateError } = await supabase
    .from("room_players")
    .update({
      is_ready: false,
    })
    .eq("room_id", room.id);

  if (playersUpdateError) {
    throw playersUpdateError;
  }
}