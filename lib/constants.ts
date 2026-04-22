export const LEAGUE_ID =
  process.env.NEXT_PUBLIC_SLEEPER_LEAGUE_ID ?? "1328541263934259200";
export const PREVIOUS_LEAGUE_ID = "1227135644640235520";
export const MY_USER_ID =
  process.env.NEXT_PUBLIC_MY_USER_ID ?? "464276120406061056";
export const MY_ROSTER_ID = Number(
  process.env.NEXT_PUBLIC_MY_ROSTER_ID ?? "1"
);
export const SEASON = "2025";

export const SLEEPER_BASE = "https://api.sleeper.app/v1";

export const ROSTER_POSITION_ORDER = [
  "QB",
  "RB",
  "RB",
  "WR",
  "WR",
  "WR",
  "TE",
  "FLEX",
  "SUPER_FLEX",
  "K",
  "DEF"
] as const;

export const POSITION_COLORS: Record<string, string> = {
  QB: "text-red-400 bg-red-500/10 border-red-500/30",
  RB: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  WR: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  TE: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  K: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  DEF: "text-slate-300 bg-slate-500/10 border-slate-500/30",
  FLEX: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30",
  SUPER_FLEX: "text-orange-400 bg-orange-500/10 border-orange-500/30"
};

export const LEAGUE_FORMAT = {
  name: "The Octogon",
  size: 8,
  format: "Superflex Dynasty",
  scoring: "Full PPR",
  taxi_slots: 7,
  ir_slots: 3,
  max_keepers: 15,
  trade_deadline_week: 11,
  playoff_teams: 4,
  playoff_start_week: 15
} as const;

export const LEAGUE_MEMBERS: Array<{
  roster_id: number;
  user_id: string;
  display_name: string;
  team_name: string;
}> = [
  {
    roster_id: 1,
    user_id: "464276120406061056",
    display_name: "LordWoogie",
    team_name: "Lord Woogie"
  },
  {
    roster_id: 2,
    user_id: "817133913427292160",
    display_name: "conbutops",
    team_name: "From Rashee With Love"
  },
  {
    roster_id: 3,
    user_id: "732049940959870976",
    display_name: "Miguelboys",
    team_name: "No Punt Intended"
  },
  {
    roster_id: 4,
    user_id: "992502526920003584",
    display_name: "cupac",
    team_name: "Team Mid Asf"
  },
  {
    roster_id: 5,
    user_id: "873385797800345600",
    display_name: "drupac15",
    team_name: "OnlyFins"
  },
  {
    roster_id: 6,
    user_id: "1000082160058388480",
    display_name: "ilikedrumss",
    team_name: "We Dem Soy Bois"
  },
  {
    roster_id: 7,
    user_id: "1000223142608015360",
    display_name: "OKCWiseau405",
    team_name: "OKC Wiseaus'"
  },
  {
    roster_id: 8,
    user_id: "1000513097783750656",
    display_name: "p33fish",
    team_name: "Boris_NixonQB1"
  }
];
