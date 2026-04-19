export const TEAM_COLORS: Record<string, { primary: string; secondary: string }> = {
  OKC: { primary: "#007AC1", secondary: "#EF6100" },
  PHX: { primary: "#E56020", secondary: "#1D1160" },
  SAS: { primary: "#000000", secondary: "#C4CED4" },
  POR: { primary: "#E03A3E", secondary: "#000000" },
  DEN: { primary: "#0E2240", secondary: "#FEC524" },
  MIN: { primary: "#0C2340", secondary: "#236192" },
  LAL: { primary: "#552583", secondary: "#FDB927" },
  HOU: { primary: "#CE1141", secondary: "#000000" },
  DET: { primary: "#1D42BA", secondary: "#C8102E" },
  ORL: { primary: "#0077C0", secondary: "#000000" },
  BOS: { primary: "#007A33", secondary: "#BA9653" },
  PHI: { primary: "#006BB6", secondary: "#ED174C" },
  NYK: { primary: "#006BB6", secondary: "#F58426" },
  ATL: { primary: "#E03A3E", secondary: "#C1D32F" },
  CLE: { primary: "#860038", secondary: "#FDBB30" },
  TOR: { primary: "#CE1141", secondary: "#000000" },
};

export function logoUrl(abbr: string | null | undefined): string {
  if (!abbr) return "";
  return `https://a.espncdn.com/i/teamlogos/nba/500/${abbr.toLowerCase()}.png`;
}
