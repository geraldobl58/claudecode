import { supabase } from "@/lib/supabase";
import type { ScoreRow } from "@/data/games";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

export async function getTopScores(
  gameId: string,
  limit = 10
): Promise<ScoreRow[]> {
  const { data, error } = await supabase
    .from("scores")
    .select("player_name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getTopScores failed", error);
    return [];
  }

  return data.map((row, i) => ({
    rank: i + 1,
    name: row.player_name,
    score: row.score,
    date: formatDate(row.created_at)
  }));
}

export async function submitScore(
  gameId: string,
  playerName: string,
  score: number
): Promise<void> {
  const { error } = await supabase.from("scores").insert({
    game_id: gameId,
    player_name: playerName,
    score
  });

  if (error) throw error;
}
