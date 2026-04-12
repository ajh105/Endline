import { supabase } from "../../lib/supabase";
import { ensureAnonymousSession } from "../auth/ensureAnonymousSession";
import { findRoomByCode } from "./findRoomByCode";

export async function leaveRoomByCode(roomCode: string) {
  const session = await ensureAnonymousSession();
  const authUserId = session?.user.id;

  if (!authUserId) {
    throw new Error("Could not determine the current user.");
  }

  const room = await findRoomByCode(roomCode);

  if (!room) {
    throw new Error("Room not found.");
  }

  const { data: currentPlayerRow, error: currentPlayerError } = await supabase
    .from("room_players")
    .select("*")
    .eq("room_id", room.id)
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (currentPlayerError) {
    throw currentPlayerError;
  }

  if (!currentPlayerRow) {
    return;
  }

  const leavingPlayerWasHost = room.host_player_id === authUserId;

  const { error: deleteError } = await supabase
    .from("room_players")
    .delete()
    .eq("id", currentPlayerRow.id);

  if (deleteError) {
    throw deleteError;
  }

  const { data: remainingPlayers, error: remainingPlayersError } = await supabase
    .from("room_players")
    .select("*")
    .eq("room_id", room.id)
    .order("seat_order", { ascending: true });

  if (remainingPlayersError) {
    throw remainingPlayersError;
  }

  const playersLeft = remainingPlayers ?? [];
  const nextHost = playersLeft[0] ?? null;

  if (room.status === "in_match") {
    const { error: roomResetError } = await supabase
      .from("rooms")
      .update({
        status: playersLeft.length > 0 ? "lobby" : "closed",
        active_match_id: null,
        host_player_id: nextHost ? nextHost.auth_user_id : room.host_player_id,
      })
      .eq("id", room.id);

    if (roomResetError) {
      throw roomResetError;
    }

    if (playersLeft.length > 0) {
      const { error: clearReadyError } = await supabase
        .from("room_players")
        .update({
          is_ready: false,
          is_host: false,
        })
        .eq("room_id", room.id);

      if (clearReadyError) {
        throw clearReadyError;
      }

      const { error: promoteHostError } = await supabase
        .from("room_players")
        .update({ is_host: true })
        .eq("id", nextHost!.id);

      if (promoteHostError) {
        throw promoteHostError;
      }
    }

    return;
  }

  if (playersLeft.length === 0) {
    const { error: closeRoomError } = await supabase
      .from("rooms")
      .update({
        status: "closed",
        active_match_id: null,
      })
      .eq("id", room.id);

    if (closeRoomError) {
      throw closeRoomError;
    }

    return;
  }

  if (leavingPlayerWasHost && nextHost) {
    const { error: clearHostError } = await supabase
      .from("room_players")
      .update({ is_host: false })
      .eq("room_id", room.id);

    if (clearHostError) {
      throw clearHostError;
    }

    const { error: promoteHostError } = await supabase
      .from("room_players")
      .update({ is_host: true })
      .eq("id", nextHost.id);

    if (promoteHostError) {
      throw promoteHostError;
    }

    const { error: roomHostUpdateError } = await supabase
      .from("rooms")
      .update({
        host_player_id: nextHost.auth_user_id,
      })
      .eq("id", room.id);

    if (roomHostUpdateError) {
      throw roomHostUpdateError;
    }
  }
}