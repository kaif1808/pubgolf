import type { TeamRow } from "@/lib/queries";
import type { PlayerSlot } from "@/lib/scoring";

export function slotFromPlayerToken(
  team: TeamRow,
  token: string,
): PlayerSlot | null {
  if (team.player_token_1 === token) return "p1";
  if (team.player_token_2 === token) return "p2";
  if (team.player_token_3 === token) return "p3";
  return null;
}
