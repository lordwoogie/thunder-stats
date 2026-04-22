/**
 * Hand-curated 2025 season reference stats for Lord Woogie's roster and
 * top-tier dynasty assets. Used as a fallback when the Sleeper stats endpoint
 * is unavailable or rate-limited, and as canonical context for AI prompts.
 */

export interface ReferenceStatLine {
  player_id: string;
  name: string;
  position: "QB" | "RB" | "WR" | "TE";
  team: string;
  age: number;
  fpts_2025: number | null;
  ppg_2025: number | null;
  games_2025: number | null;
  note?: string;
}

export const REFERENCE_STATS_2025: ReferenceStatLine[] = [
  // QBs
  { player_id: "4892", name: "Baker Mayfield", position: "QB", team: "TB", age: 30, fpts_2025: 282.9, ppg_2025: 16.6, games_2025: 17 },
  { player_id: "12545", name: "Tyler Shough", position: "QB", team: "NO", age: 26, fpts_2025: 45, ppg_2025: 9.0, games_2025: 5, note: "limited sample, rookie backup" },
  { player_id: "4227", name: "Harrison Butker", position: "QB", team: "KC", age: 30, fpts_2025: null, ppg_2025: null, games_2025: null },
  { player_id: "9758", name: "C.J. Stroud", position: "QB", team: "HOU", age: 24, fpts_2025: 216.7, ppg_2025: 15.5, games_2025: 14 },
  { player_id: "96", name: "Aaron Rodgers", position: "QB", team: "FA", age: 42, fpts_2025: 234.2, ppg_2025: 14.6, games_2025: 16, note: "free agent, likely done" },

  // RBs on my roster
  { player_id: "12474", name: "Woody Marks", position: "RB", team: "HOU", age: 25, fpts_2025: 151.1, ppg_2025: 9.4, games_2025: 16 },
  { player_id: "11584", name: "Bucky Irving", position: "RB", team: "TB", age: 23, fpts_2025: 195, ppg_2025: 12.2, games_2025: 16 },
  { player_id: "6813", name: "Jonathan Taylor", position: "RB", team: "IND", age: 27, fpts_2025: 362.3, ppg_2025: 21.3, games_2025: 17 },
  { player_id: "7594", name: "Chuba Hubbard", position: "RB", team: "CAR", age: 26, fpts_2025: 165, ppg_2025: 10.3, games_2025: 16 },
  { player_id: "8228", name: "Jaylen Warren", position: "RB", team: "PIT", age: 27, fpts_2025: 217.1, ppg_2025: 13.6, games_2025: 16 },
  { player_id: "7021", name: "Rico Dowdle", position: "RB", team: "PIT", age: 27, fpts_2025: 216.3, ppg_2025: 12.7, games_2025: 17 },
  { player_id: "11651", name: "Isaac Guerendo", position: "RB", team: "SF", age: 25, fpts_2025: 5, ppg_2025: 1.0, games_2025: 5, note: "minimal role behind CMC" },
  { player_id: "9511", name: "Keaton Mitchell", position: "RB", team: "LAC", age: 24, fpts_2025: 10, ppg_2025: 2.0, games_2025: 5, note: "injury-depressed role" },
  { player_id: "8122", name: "Zonovan Knight", position: "RB", team: "ARI", age: 24, fpts_2025: 8, ppg_2025: 1.5, games_2025: 5, note: "RB4 on depth chart" },
  { player_id: "12489", name: "RJ Harvey", position: "RB", team: "DEN", age: 25, fpts_2025: 206.6, ppg_2025: 12.2, games_2025: 17 },
  { player_id: "4137", name: "James Conner", position: "RB", team: "ARI", age: 30, fpts_2025: 130, ppg_2025: 9.3, games_2025: 14, note: "on IR" },
  { player_id: "11589", name: "Trey Benson", position: "RB", team: "ARI", age: 23, fpts_2025: 20, ppg_2025: 3.0, games_2025: 6, note: "on IR, limited snaps" },

  // WRs
  { player_id: "4983", name: "DJ Moore", position: "WR", team: "BUF", age: 28, fpts_2025: 170, ppg_2025: 10.6, games_2025: 16 },
  { player_id: "8137", name: "George Pickens", position: "WR", team: "DAL", age: 25, fpts_2025: 291.9, ppg_2025: 17.2, games_2025: 17 },
  { player_id: "6794", name: "Justin Jefferson", position: "WR", team: "MIN", age: 26, fpts_2025: 201.5, ppg_2025: 11.9, games_2025: 17, note: "only 2 TDs — massive TD regression likely" },
  { player_id: "8112", name: "Drake London", position: "WR", team: "ATL", age: 24, fpts_2025: 201.9, ppg_2025: 16.8, games_2025: 12 },
  { player_id: "11632", name: "Malik Nabers", position: "WR", team: "NYG", age: 22, fpts_2025: 90, ppg_2025: 18.0, games_2025: 5, note: "torn ACL + meniscus wk5, Week 1 2026 availability uncertain" },
  { player_id: "9504", name: "Kayshon Boutte", position: "WR", team: "NE", age: 23, fpts_2025: 60, ppg_2025: 4.0, games_2025: 15 },
  { player_id: "12484", name: "Jayden Higgins", position: "WR", team: "HOU", age: 23, fpts_2025: null, ppg_2025: null, games_2025: null, note: "2025 rookie" },

  // TEs
  { player_id: "8130", name: "Trey McBride", position: "TE", team: "ARI", age: 26, fpts_2025: 220, ppg_2025: 13.8, games_2025: 16 },
  { player_id: "8131", name: "Isaiah Likely", position: "TE", team: "NYG", age: 25, fpts_2025: 120, ppg_2025: 8.0, games_2025: 15 },

  // Taxi
  { player_id: "11576", name: "Braelon Allen", position: "RB", team: "NYJ", age: 22, fpts_2025: null, ppg_2025: null, games_2025: null, note: "taxi — developmental" },
  { player_id: "12471", name: "DJ Giddens", position: "RB", team: "IND", age: 22, fpts_2025: null, ppg_2025: null, games_2025: null, note: "taxi — rookie behind JT" },
  { player_id: "12497", name: "Tory Horton", position: "WR", team: "SEA", age: 23, fpts_2025: null, ppg_2025: null, games_2025: null, note: "taxi" },
  { player_id: "12519", name: "Luther Burden", position: "WR", team: "CHI", age: 22, fpts_2025: null, ppg_2025: null, games_2025: null, note: "taxi — top rookie prospect" },
  { player_id: "12536", name: "Jaylin Noel", position: "WR", team: "HOU", age: 23, fpts_2025: null, ppg_2025: null, games_2025: null, note: "taxi" },

  // Elite dynasty context (not on my roster)
  { player_id: "4034", name: "Christian McCaffrey", position: "RB", team: "SF", age: 29, fpts_2025: 416.6, ppg_2025: 24.5, games_2025: 17, note: "CPOY 2025; age 30 in June 2026" },
  { player_id: "8155", name: "Bijan Robinson", position: "RB", team: "ATL", age: 24, fpts_2025: 370.8, ppg_2025: 21.8, games_2025: 17 },
  { player_id: "8146", name: "Jahmyr Gibbs", position: "RB", team: "DET", age: 24, fpts_2025: 366.9, ppg_2025: 21.6, games_2025: 17 },
  { player_id: "6797", name: "De'Von Achane", position: "RB", team: "MIA", age: 24, fpts_2025: 322.8, ppg_2025: 20.2, games_2025: 16 },
  { player_id: "7567", name: "James Cook", position: "RB", team: "BUF", age: 26, fpts_2025: 302.2, ppg_2025: 17.8, games_2025: 17 },
  { player_id: "6786", name: "Derrick Henry", position: "RB", team: "BAL", age: 32, fpts_2025: 279.5, ppg_2025: 16.4, games_2025: 17 },
  { player_id: "12527", name: "Ashton Jeanty", position: "RB", team: "LV", age: 22, fpts_2025: 245.1, ppg_2025: 14.4, games_2025: 17 },
  { player_id: "10229", name: "Puka Nacua", position: "WR", team: "LAR", age: 24, fpts_2025: 375.0, ppg_2025: 23.4, games_2025: 16 },
  { player_id: "9493", name: "Jaxon Smith-Njigba", position: "WR", team: "SEA", age: 24, fpts_2025: 359.9, ppg_2025: 21.2, games_2025: 17 },
  { player_id: "8112_asb", name: "Amon-Ra St. Brown", position: "WR", team: "DET", age: 26, fpts_2025: 324.0, ppg_2025: 19.1, games_2025: 17 },
  { player_id: "7564", name: "Ja'Marr Chase", position: "WR", team: "CIN", age: 26, fpts_2025: 313.6, ppg_2025: 19.6, games_2025: 16 },
  { player_id: "7525", name: "Josh Allen", position: "QB", team: "BUF", age: 30, fpts_2025: 374.5, ppg_2025: 22.0, games_2025: 17 },
  { player_id: "12526", name: "Drake Maye", position: "QB", team: "NE", age: 24, fpts_2025: 359.9, ppg_2025: 21.2, games_2025: 17 },
  { player_id: "11560", name: "Caleb Williams", position: "QB", team: "CHI", age: 24, fpts_2025: 325.3, ppg_2025: 19.1, games_2025: 17 },
  { player_id: "11533", name: "Bo Nix", position: "QB", team: "DEN", age: 25, fpts_2025: 315.8, ppg_2025: 18.6, games_2025: 17 },
  { player_id: "11565", name: "Jaxson Dart", position: "QB", team: "NYG", age: 23, fpts_2025: 246.5, ppg_2025: 17.6, games_2025: 14 },
  { player_id: "6904", name: "Jalen Hurts", position: "QB", team: "PHI", age: 27, fpts_2025: 305.0, ppg_2025: 19.1, games_2025: 16 },
  { player_id: "6744", name: "Lamar Jackson", position: "QB", team: "BAL", age: 29, fpts_2025: 221.8, ppg_2025: 17.1, games_2025: 13 }
];

export const REF_STATS_BY_ID: Record<string, ReferenceStatLine> = Object.fromEntries(
  REFERENCE_STATS_2025.filter((r) => !r.player_id.includes("_")).map((r) => [r.player_id, r])
);

export const PLAYER_NOTES: Record<string, string> = {
  "96": "Age 42, free agent, no team. Clear drop candidate.",
  "8122": "RB4 on ARI depth chart, search rank ~999. Drop candidate.",
  "7021": "Now RB3 on PIT behind Warren/Harris. 27yo, limited 2026 upside.",
  "11651": "RB2 on SF depth chart on paper but ran 0 offensive snaps while CMC healthy.",
  "9511": "LAC RB2; small frame, long-shot standalone value.",
  "9504": "NE WR4 in worst offense in football.",
  "4137": "Age 30, on IR. Droppable if roster spot needed.",
  "11589": "On IR, was RB2 behind Conner. Young but limited role.",
  "11632": "Torn ACL+meniscus Wk5 2025. Walking with cane as of Jan 2026. Week 1 availability uncertain.",
  "6794": "Only 2 TDs in 2025 despite 84/1048. Massive positive TD regression candidate.",
  "8137": "Breakout 2025 on DAL (1429/9/17.2 PPG). Age 25 ascending asset.",
  "8112": "16.8 PPG but only 12 games. Elite efficiency when healthy."
};
