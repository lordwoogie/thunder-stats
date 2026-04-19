import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const LEAGUE_MEMBERS: { username: string; teamName: string; isAdmin?: boolean }[] = [
  { username: "blake", teamName: "BLAKE" },
  { username: "matasmouse", teamName: "Matas Mouse" },
  { username: "go15hawks", teamName: "go15hawks" },
  { username: "blayzehembree", teamName: "blayzehembree" },
  { username: "evantraylor", teamName: "evantraylor" },
  { username: "cultureclub", teamName: "Culture Club" },
  { username: "lordwoogie", teamName: "Lordwoogie", isAdmin: true },
  { username: "colangelo", teamName: "Colangelo's Sentient Collars" },
  { username: "topicstrong", teamName: "#TOPIĆSTRONG" },
  { username: "kl2aspire", teamName: "KL2 Aspire LLC" },
];

// Default lock time: roughly Game 2 tip-off. Admin can adjust.
// Round 1 starts Apr 18 2026; use 2 days after series start as placeholder.
const R1_LOCK = new Date("2026-04-20T23:00:00Z");

type R1Seed = {
  slot: string;
  conference: "East" | "West";
  seriesLabel: string;
  higherSeed: string;
  higherSeedAbbr: string;
  higherSeedNum: number;
  lowerSeed: string;
  lowerSeedAbbr: string;
  lowerSeedNum: number;
};

const ROUND_1: R1Seed[] = [
  {
    slot: "R1-E-1v8",
    conference: "East",
    seriesLabel: "East 1 vs 8",
    higherSeed: "Detroit Pistons",
    higherSeedAbbr: "DET",
    higherSeedNum: 1,
    lowerSeed: "Orlando Magic",
    lowerSeedAbbr: "ORL",
    lowerSeedNum: 8,
  },
  {
    slot: "R1-E-4v5",
    conference: "East",
    seriesLabel: "East 4 vs 5",
    higherSeed: "Cleveland Cavaliers",
    higherSeedAbbr: "CLE",
    higherSeedNum: 4,
    lowerSeed: "Toronto Raptors",
    lowerSeedAbbr: "TOR",
    lowerSeedNum: 5,
  },
  {
    slot: "R1-E-2v7",
    conference: "East",
    seriesLabel: "East 2 vs 7",
    higherSeed: "Boston Celtics",
    higherSeedAbbr: "BOS",
    higherSeedNum: 2,
    lowerSeed: "Philadelphia 76ers",
    lowerSeedAbbr: "PHI",
    lowerSeedNum: 7,
  },
  {
    slot: "R1-E-3v6",
    conference: "East",
    seriesLabel: "East 3 vs 6",
    higherSeed: "New York Knicks",
    higherSeedAbbr: "NYK",
    higherSeedNum: 3,
    lowerSeed: "Atlanta Hawks",
    lowerSeedAbbr: "ATL",
    lowerSeedNum: 6,
  },
  {
    slot: "R1-W-1v8",
    conference: "West",
    seriesLabel: "West 1 vs 8",
    higherSeed: "Oklahoma City Thunder",
    higherSeedAbbr: "OKC",
    higherSeedNum: 1,
    lowerSeed: "Phoenix Suns",
    lowerSeedAbbr: "PHX",
    lowerSeedNum: 8,
  },
  {
    slot: "R1-W-4v5",
    conference: "West",
    seriesLabel: "West 4 vs 5",
    higherSeed: "Los Angeles Lakers",
    higherSeedAbbr: "LAL",
    higherSeedNum: 4,
    lowerSeed: "Houston Rockets",
    lowerSeedAbbr: "HOU",
    lowerSeedNum: 5,
  },
  {
    slot: "R1-W-2v7",
    conference: "West",
    seriesLabel: "West 2 vs 7",
    higherSeed: "San Antonio Spurs",
    higherSeedAbbr: "SAS",
    higherSeedNum: 2,
    lowerSeed: "Portland Trail Blazers",
    lowerSeedAbbr: "POR",
    lowerSeedNum: 7,
  },
  {
    slot: "R1-W-3v6",
    conference: "West",
    seriesLabel: "West 3 vs 6",
    higherSeed: "Denver Nuggets",
    higherSeedAbbr: "DEN",
    higherSeedNum: 3,
    lowerSeed: "Minnesota Timberwolves",
    lowerSeedAbbr: "MIN",
    lowerSeedNum: 6,
  },
];

// Bracket progression:
//   E-SF-A: winner(R1-E-1v8) vs winner(R1-E-4v5) -> parent E-CF
//   E-SF-B: winner(R1-E-2v7) vs winner(R1-E-3v6) -> parent E-CF
//   W-SF-A: winner(R1-W-1v8) vs winner(R1-W-4v5) -> parent W-CF
//   W-SF-B: winner(R1-W-2v7) vs winner(R1-W-3v6) -> parent W-CF
//   E-CF -> FINALS (higher slot)
//   W-CF -> FINALS (lower slot)

const LATER_ROUNDS = [
  // Round 2 — Conference Semifinals
  { slot: "SF-E-A", round: 2, conference: "East", seriesLabel: "East Semifinal A" },
  { slot: "SF-E-B", round: 2, conference: "East", seriesLabel: "East Semifinal B" },
  { slot: "SF-W-A", round: 2, conference: "West", seriesLabel: "West Semifinal A" },
  { slot: "SF-W-B", round: 2, conference: "West", seriesLabel: "West Semifinal B" },
  // Round 3 — Conference Finals
  { slot: "CF-E", round: 3, conference: "East", seriesLabel: "Eastern Conference Finals" },
  { slot: "CF-W", round: 3, conference: "West", seriesLabel: "Western Conference Finals" },
  // Round 4 — NBA Finals
  { slot: "FINALS", round: 4, conference: null as string | null, seriesLabel: "NBA Finals" },
] as const;

// Parent mapping: childSlot -> { parentSlot, slotInParent }
const PROGRESSION: Record<string, { parent: string; slotInParent: "higher" | "lower" }> = {
  "R1-E-1v8": { parent: "SF-E-A", slotInParent: "higher" },
  "R1-E-4v5": { parent: "SF-E-A", slotInParent: "lower" },
  "R1-E-2v7": { parent: "SF-E-B", slotInParent: "higher" },
  "R1-E-3v6": { parent: "SF-E-B", slotInParent: "lower" },
  "R1-W-1v8": { parent: "SF-W-A", slotInParent: "higher" },
  "R1-W-4v5": { parent: "SF-W-A", slotInParent: "lower" },
  "R1-W-2v7": { parent: "SF-W-B", slotInParent: "higher" },
  "R1-W-3v6": { parent: "SF-W-B", slotInParent: "lower" },
  "SF-E-A": { parent: "CF-E", slotInParent: "higher" },
  "SF-E-B": { parent: "CF-E", slotInParent: "lower" },
  "SF-W-A": { parent: "CF-W", slotInParent: "higher" },
  "SF-W-B": { parent: "CF-W", slotInParent: "lower" },
  "CF-E": { parent: "FINALS", slotInParent: "higher" },
  "CF-W": { parent: "FINALS", slotInParent: "lower" },
};

async function seedUsers() {
  const adminPw = process.env.ADMIN_SEED_PASSWORD || "change-me-admin";
  const defaultPw = process.env.DEFAULT_USER_PASSWORD || "playoffs2026";

  for (const m of LEAGUE_MEMBERS) {
    const pw = m.isAdmin ? adminPw : defaultPw;
    const hash = await bcrypt.hash(pw, 10);
    await prisma.user.upsert({
      where: { username: m.username },
      update: {
        teamName: m.teamName,
        isAdmin: !!m.isAdmin,
      },
      create: {
        username: m.username,
        teamName: m.teamName,
        passwordHash: hash,
        isAdmin: !!m.isAdmin,
        mustChangePassword: true,
      },
    });
  }
  console.log(`Seeded ${LEAGUE_MEMBERS.length} users.`);
}

async function seedSeries() {
  // Create later-round placeholders first (no parents yet), then R1, then wire parents.
  for (const lr of LATER_ROUNDS) {
    await prisma.series.upsert({
      where: { slot: lr.slot },
      update: {},
      create: {
        slot: lr.slot,
        round: lr.round,
        conference: lr.conference ?? null,
        seriesLabel: lr.seriesLabel,
      },
    });
  }

  for (const s of ROUND_1) {
    await prisma.series.upsert({
      where: { slot: s.slot },
      update: {
        higherSeed: s.higherSeed,
        higherSeedAbbr: s.higherSeedAbbr,
        higherSeedNum: s.higherSeedNum,
        lowerSeed: s.lowerSeed,
        lowerSeedAbbr: s.lowerSeedAbbr,
        lowerSeedNum: s.lowerSeedNum,
        lockAt: R1_LOCK,
      },
      create: {
        slot: s.slot,
        round: 1,
        conference: s.conference,
        seriesLabel: s.seriesLabel,
        higherSeed: s.higherSeed,
        higherSeedAbbr: s.higherSeedAbbr,
        higherSeedNum: s.higherSeedNum,
        lowerSeed: s.lowerSeed,
        lowerSeedAbbr: s.lowerSeedAbbr,
        lowerSeedNum: s.lowerSeedNum,
        lockAt: R1_LOCK,
      },
    });
  }

  // Wire parent relationships
  for (const [childSlot, { parent, slotInParent }] of Object.entries(PROGRESSION)) {
    const parentSeries = await prisma.series.findUnique({ where: { slot: parent } });
    if (!parentSeries) continue;
    await prisma.series.update({
      where: { slot: childSlot },
      data: {
        parentSeriesId: parentSeries.id,
        parentSlot: slotInParent,
      },
    });
  }

  console.log(`Seeded ${ROUND_1.length} R1 series and ${LATER_ROUNDS.length} placeholder series.`);
}

async function main() {
  await seedUsers();
  await seedSeries();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
