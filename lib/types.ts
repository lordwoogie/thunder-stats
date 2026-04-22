export type SleeperPlayerId = string;

export interface SleeperUser {
  user_id: string;
  display_name: string;
  avatar: string | null;
  metadata?: {
    team_name?: string;
    avatar?: string;
  };
}

export interface SleeperRosterSettings {
  wins: number;
  losses: number;
  ties: number;
  fpts: number;
  fpts_decimal?: number;
  fpts_against?: number;
  fpts_against_decimal?: number;
  waiver_budget_used?: number;
  total_moves?: number;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  league_id: string;
  players: SleeperPlayerId[] | null;
  starters: SleeperPlayerId[] | null;
  taxi: SleeperPlayerId[] | null;
  reserve: SleeperPlayerId[] | null;
  keepers?: SleeperPlayerId[] | null;
  settings: SleeperRosterSettings;
  metadata?: Record<string, string | null> | null;
}

export interface SleeperLeague {
  league_id: string;
  previous_league_id: string | null;
  name: string;
  season: string;
  status: string;
  sport: string;
  total_rosters: number;
  roster_positions: string[];
  scoring_settings: Record<string, number>;
  settings: Record<string, number>;
}

export interface SleeperPlayer {
  player_id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string | null;
  fantasy_positions?: string[] | null;
  team?: string | null;
  age?: number | null;
  years_exp?: number | null;
  status?: string | null;
  injury_status?: string | null;
  depth_chart_position?: string | null;
  depth_chart_order?: number | null;
  college?: string | null;
  weight?: string | null;
  height?: string | null;
  birth_date?: string | null;
  search_rank?: number | null;
  news_updated?: number | null;
}

export type SleeperPlayers = Record<string, SleeperPlayer>;

export interface SleeperSeasonStats {
  [playerId: string]: Record<string, number>;
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number;
  points: number;
  players: string[];
  starters: string[];
  starters_points?: number[];
  players_points?: Record<string, number>;
}

export interface SleeperTransaction {
  type: string;
  status: string;
  transaction_id: string;
  status_updated?: number;
  created?: number;
  roster_ids?: number[];
  adds?: Record<string, number> | null;
  drops?: Record<string, number> | null;
  draft_picks?: Array<{
    season: string;
    round: number;
    roster_id: number;
    previous_owner_id: number;
    owner_id: number;
  }>;
  waiver_budget?: Array<{
    sender: number;
    receiver: number;
    amount: number;
  }>;
}

export interface EnrichedPlayer {
  player_id: string;
  name: string;
  position: string;
  team: string;
  age: number | null;
  injury_status: string | null;
  status: string | null;
  years_exp: number | null;
  search_rank: number | null;
  fpts_2025: number | null;
  ppg_2025: number | null;
  games_2025: number | null;
  note: string | null;
}

export interface TeamOverview {
  roster_id: number;
  owner_id: string;
  display_name: string;
  team_name: string;
  starters: EnrichedPlayer[];
  bench: EnrichedPlayer[];
  taxi: EnrichedPlayer[];
  reserve: EnrichedPlayer[];
  total_fpts_2025: number;
  avg_age: number;
  record: { wins: number; losses: number; ties: number };
}
