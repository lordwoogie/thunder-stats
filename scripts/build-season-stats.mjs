#!/usr/bin/env node
/**
 * Build per-player advanced season stats from nflverse play-by-play.
 *
 * nflverse publishes play_by_play_{season}.csv well before it publishes the
 * aggregated stats_player_reg_{season}.csv. This script does that aggregation
 * ourselves so the app isn't stuck a year behind, and additionally computes
 * red-zone opportunity, which nflverse's aggregate doesn't carry at all.
 *
 * The PBP file is ~94MB — far too large to fetch inside a serverless request.
 * Output is a ~200KB JSON committed to the repo and read directly at runtime.
 *
 *   node scripts/build-season-stats.mjs 2025
 *
 * Writes: data/season-stats-{season}.json  (keyed by gsis_id)
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SEASON = process.argv[2] ?? "2025";
const PBP_URL = `https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_${SEASON}.csv`;
const CACHE = path.join(ROOT, ".cache", `pbp_${SEASON}.csv`);
const OUT = path.join(ROOT, "data", `season-stats-${SEASON}.json`);

/* ------------------------------- csv ------------------------------- */

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const num = (v) => {
  if (v == null) return 0;
  const t = v.trim();
  if (t === "" || t === "NA") return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
};
const has = (v) => v != null && v.trim() !== "" && v.trim() !== "NA";

/* ------------------------------ fetch ------------------------------ */

async function ensurePbp() {
  if (fs.existsSync(CACHE) && fs.statSync(CACHE).size > 1_000_000) {
    console.log(`Using cached ${CACHE}`);
    return CACHE;
  }
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  console.log(`Downloading ${PBP_URL} ...`);
  const res = await fetch(PBP_URL, { redirect: "follow" });
  if (!res.ok) throw new Error(`PBP fetch failed: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(CACHE, buf);
  console.log(`Saved ${(buf.length / 1048576).toFixed(1)} MB`);
  return CACHE;
}

/* --------------------------- aggregation --------------------------- */

function blankPlayer() {
  return {
    team: null,
    // receiving
    targets: 0, receptions: 0, receiving_yards: 0, receiving_tds: 0,
    air_yards: 0, receiving_epa: 0,
    rz_targets: 0, i10_targets: 0, rz_receptions: 0,
    // rushing
    carries: 0, rushing_yards: 0, rushing_tds: 0, rushing_epa: 0,
    rz_carries: 0, i10_carries: 0,
    // passing
    pass_attempts: 0, completions: 0, passing_yards: 0, passing_tds: 0,
    interceptions: 0, passing_epa: 0, cpoe_sum: 0, cpoe_n: 0,
    rz_pass_attempts: 0,
    // meta
    games: new Set()
  };
}

async function main() {
  const file = await ensurePbp();

  const rl = readline.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity
  });

  let header = null;
  let idx = {};
  const players = new Map();
  const teams = new Map(); // posteam -> { targets, air_yards, carries }
  let rows = 0;
  let regRows = 0;

  const P = (id) => {
    if (!players.has(id)) players.set(id, blankPlayer());
    return players.get(id);
  };
  const T = (t) => {
    if (!teams.has(t)) teams.set(t, { targets: 0, air_yards: 0, carries: 0 });
    return teams.get(t);
  };

  for await (const line of rl) {
    if (!line) continue;
    if (header === null) {
      header = parseCsvLine(line);
      header.forEach((h, i) => (idx[h] = i));
      continue;
    }
    rows++;
    const r = parseCsvLine(line);

    // Regular season only — playoffs distort per-game and share rates.
    if (r[idx.season_type] !== "REG") continue;
    regRows++;

    // Two-point conversions are excluded from official target / attempt /
    // carry counts, so skip them to match published stat lines exactly.
    if (num(r[idx.two_point_attempt]) === 1) continue;

    const posteam = r[idx.posteam];
    const gameId = r[idx.game_id];
    const y100 = num(r[idx.yardline_100]);
    const inRz = y100 > 0 && y100 <= 20;
    const inI10 = y100 > 0 && y100 <= 10;

    // ---- receiving (a target is any pass play with a named receiver) ----
    const rec = r[idx.receiver_player_id];
    if (has(rec) && num(r[idx.pass_attempt]) === 1) {
      const p = P(rec);
      p.team = posteam || p.team;
      if (gameId) p.games.add(gameId);
      p.targets++;
      p.air_yards += num(r[idx.air_yards]);
      p.receiving_epa += num(r[idx.epa]);
      if (num(r[idx.complete_pass]) === 1) {
        p.receptions++;
        p.receiving_yards += num(r[idx.receiving_yards]);
        if (inRz) p.rz_receptions++;
      }
      if (num(r[idx.pass_touchdown]) === 1) p.receiving_tds++;
      if (inRz) p.rz_targets++;
      if (inI10) p.i10_targets++;

      if (posteam) {
        const t = T(posteam);
        t.targets++;
        t.air_yards += num(r[idx.air_yards]);
      }
    }

    // ---- rushing ----
    const rush = r[idx.rusher_player_id];
    if (has(rush) && num(r[idx.rush_attempt]) === 1) {
      const p = P(rush);
      p.team = posteam || p.team;
      if (gameId) p.games.add(gameId);
      p.carries++;
      p.rushing_yards += num(r[idx.rushing_yards]);
      p.rushing_epa += num(r[idx.epa]);
      if (num(r[idx.rush_touchdown]) === 1) p.rushing_tds++;
      if (inRz) p.rz_carries++;
      if (inI10) p.i10_carries++;

      if (posteam) T(posteam).carries++;
    }

    // ---- passing ----
    const pass = r[idx.passer_player_id];
    if (has(pass) && num(r[idx.pass_attempt]) === 1) {
      const p = P(pass);
      p.team = posteam || p.team;
      if (gameId) p.games.add(gameId);
      p.pass_attempts++;
      p.passing_epa += num(r[idx.epa]);
      if (has(r[idx.cpoe])) {
        p.cpoe_sum += num(r[idx.cpoe]);
        p.cpoe_n++;
      }
      if (num(r[idx.complete_pass]) === 1) {
        p.completions++;
        p.passing_yards += num(r[idx.passing_yards]);
      }
      if (num(r[idx.pass_touchdown]) === 1) p.passing_tds++;
      if (num(r[idx.interception]) === 1) p.interceptions++;
      if (inRz) p.rz_pass_attempts++;
    }
  }

  console.log(`Parsed ${rows} plays (${regRows} regular season)`);

  /* ---- derive shares and round ---- */
  const round = (n, dp = 3) => {
    if (!Number.isFinite(n)) return null;
    const f = 10 ** dp;
    return Math.round(n * f) / f;
  };
  const ratio = (a, b, dp = 3) => (b > 0 ? round(a / b, dp) : null);

  const out = {};
  for (const [id, p] of players) {
    const t = p.team ? teams.get(p.team) : null;
    const targetShare = t ? ratio(p.targets, t.targets) : null;
    // Air-yards share can be distorted by negative air yards; clamp at 0.
    const ayShare = t && t.air_yards > 0 ? ratio(p.air_yards, t.air_yards) : null;

    // Skip players with no meaningful involvement to keep the file small.
    if (p.targets === 0 && p.carries === 0 && p.pass_attempts === 0) continue;

    out[id] = {
      team: p.team,
      games: p.games.size,

      targets: p.targets || null,
      receptions: p.receptions || null,
      receiving_yards: round(p.receiving_yards, 0),
      receiving_tds: p.receiving_tds || null,
      air_yards: round(p.air_yards, 0),
      receiving_epa: round(p.receiving_epa, 1),
      target_share: targetShare,
      air_yards_share: ayShare,
      wopr:
        targetShare != null && ayShare != null
          ? round(1.5 * targetShare + 0.7 * ayShare)
          : null,
      racr: p.air_yards > 0 ? ratio(p.receiving_yards, p.air_yards) : null,
      rz_targets: p.rz_targets || null,
      i10_targets: p.i10_targets || null,

      carries: p.carries || null,
      rushing_yards: round(p.rushing_yards, 0),
      rushing_tds: p.rushing_tds || null,
      rushing_epa: round(p.rushing_epa, 1),
      carry_share: t ? ratio(p.carries, t.carries) : null,
      rz_carries: p.rz_carries || null,
      i10_carries: p.i10_carries || null,

      pass_attempts: p.pass_attempts || null,
      completions: p.completions || null,
      passing_yards: round(p.passing_yards, 0),
      passing_tds: p.passing_tds || null,
      interceptions: p.interceptions || null,
      passing_epa: round(p.passing_epa, 1),
      passing_cpoe: p.cpoe_n > 0 ? round(p.cpoe_sum / p.cpoe_n, 1) : null,

      // Total red-zone opportunities — the TD-equity signal.
      rz_opportunities: (p.rz_targets + p.rz_carries) || null,
      i10_opportunities: (p.i10_targets + p.i10_carries) || null
    };
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({ season: SEASON, generated_from: "nflverse pbp", players: out })
  );
  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`Wrote ${OUT} — ${Object.keys(out).length} players, ${kb} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
