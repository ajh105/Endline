import type { GameState } from "@shared";
import { supabase } from "../../lib/supabase";

export async function updateMatchState(matchId: string, nextState: GameState) {
  const { error } = await supabase
    .from("match_states")
    .update({
      state: nextState,
      updated_at: new Date().toISOString(),
    })
    .eq("match_id", matchId);

  if (error) {
    throw error;
  }
}