/**
 * Depth charts, derived from Sleeper's /players/nfl payload.
 *
 * Sleeper ships `depth_chart_position` and `depth_chart_order` on every
 * player, and we already download the full player map — so depth charts
 * cost us nothing extra. nflverse also publishes depth_charts_{season}.csv
 * but it's a ~50MB append-only snapshot log, far too heavy per request.
 *
 * The valuable part isn't a player's own depth number, it's the room around
 * them: who is ahead, who is behind, and how crowded the backfield is.
 */

import { SleeperPlayer } from "./types";

export interface DepthRoomMate {
  player_id: string;
  name: string;
  order: number | null;
}

export interface DepthInfo {
  /** Depth chart slot, e.g. "RB", "WR2", "QB". */
  position: string | null;
  /** 1 = starter at that slot. */
  order: number | null;
  /** Teammates at the same slot ranked ahead (nearest first). */
  ahead: DepthRoomMate[];
  /** Teammates at the same slot ranked behind (nearest first). */
  behind: DepthRoomMate[];
  /** Total players listed in that slot on the team. */
  room_size: number;
}

const NAME = (p: SleeperPlayer) =>
  p.full_name ?? [p.first_name, p.last_name].filter(Boolean).join(" ");

/**
 * Group active offensive skill players by team + depth-chart slot, ordered.
 * Returns a lookup keyed `TEAM|SLOT`.
 */
export function buildDepthRooms(
  players: Record<string, SleeperPlayer>
): Map<string, DepthRoomMate[]> {
  const rooms = new Map<string, DepthRoomMate[]>();

  for (const [pid, p] of Object.entries(players)) {
    const team = p.team;
    const slot = p.depth_chart_position;
    if (!team || !slot) continue;
    // Only players actually on a roster; Sleeper keeps retired/FA entries.
    if (p.status && !/active|injured reserve|physically|non football|questionable|doubtful|out|practice/i.test(p.status)) {
      continue;
    }
    const key = `${team}|${slot}`;
    const list = rooms.get(key) ?? [];
    list.push({
      player_id: pid,
      name: NAME(p),
      order: p.depth_chart_order ?? null
    });
    rooms.set(key, list);
  }

  // Sort each room by depth order; unranked players sink to the bottom.
  for (const list of rooms.values()) {
    list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }
  return rooms;
}

/** Resolve one player's standing within their depth-chart room. */
export function getDepthInfo(
  playerId: string,
  players: Record<string, SleeperPlayer>,
  rooms: Map<string, DepthRoomMate[]>
): DepthInfo | null {
  const p = players[playerId];
  if (!p?.team || !p.depth_chart_position) return null;

  const room = rooms.get(`${p.team}|${p.depth_chart_position}`) ?? [];
  const i = room.findIndex((m) => m.player_id === playerId);

  return {
    position: p.depth_chart_position,
    order: p.depth_chart_order ?? null,
    ahead: i > 0 ? room.slice(0, i).reverse() : [],
    behind: i >= 0 ? room.slice(i + 1) : [],
    room_size: room.length
  };
}

/** Compact human summary, e.g. "RB2 behind Bijan Robinson (3 deep)". */
export function describeDepth(d: DepthInfo | null): string | null {
  if (!d || !d.position) return null;
  const slot = d.order != null ? `${d.position}${d.order}` : d.position;
  if (d.ahead.length === 0) {
    return d.room_size > 1 ? `${slot}, leads room of ${d.room_size}` : slot;
  }
  const names = d.ahead
    .slice(0, 2)
    .map((m) => m.name)
    .join(", ");
  return `${slot} behind ${names}${d.room_size > 1 ? ` (${d.room_size} deep)` : ""}`;
}
