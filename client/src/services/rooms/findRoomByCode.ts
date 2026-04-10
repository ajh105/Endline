import { supabase } from "../../lib/supabase";

export async function findRoomByCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from("rooms")
    .select("id, code, status, host_player_id, active_match_id, created_at")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}