import { BaseSideService } from "@zeppos/zml/base-side";
import { settingsLib } from "@zeppos/zml/base-side";

const BASE = "https://api.balldontlie.io/nba/v1";
const THUNDER_ID = 21;

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayLabel(iso) {
  const d = new Date(iso);
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
}

function tipoffLabel(iso) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function pickGame(games) {
  return games.find((g) => g.home_team.id === THUNDER_ID || g.visitor_team.id === THUNDER_ID);
}

function shape(game) {
  if (!game) return null;
  const home = game.home_team.id === THUNDER_ID;
  const opp = home ? game.visitor_team : game.home_team;
  const thunderPts = home ? game.home_team_score : game.visitor_team_score;
  const oppPts = home ? game.visitor_team_score : game.home_team_score;
  const status = (game.status || "").toString();
  const isFinal = /final/i.test(status);
  const isLive = !isFinal && (game.period > 0 || /qtr|quarter|half|ot|live|progress/i.test(status));

  if (isLive) {
    let clock = "";
    if (game.period) {
      const q = game.period <= 4 ? `Q${game.period}` : `OT${game.period - 4}`;
      clock = game.time ? `${q} ${game.time}` : q;
    } else {
      clock = status;
    }
    return {
      kind: "live",
      thunder: thunderPts ?? 0,
      opp: oppPts ?? 0,
      oppAbbr: opp.abbreviation,
      home,
      clock,
    };
  }
  if (isFinal) {
    return {
      kind: "final",
      thunder: thunderPts ?? 0,
      opp: oppPts ?? 0,
      oppAbbr: opp.abbreviation,
      home,
      clock: "FINAL",
    };
  }
  return {
    kind: "upcoming",
    oppAbbr: opp.abbreviation,
    home,
    tipoff: game.status && /^\d/.test(game.status) ? game.status : tipoffLabel(game.date),
    dateLabel: dayLabel(game.date),
  };
}

async function apiGet(path, key) {
  const r = await fetch({
    url: `${BASE}${path}`,
    method: "GET",
    headers: { Authorization: key },
  });
  if (r.status === 401) throw new Error("Bad API key");
  if (r.status === 429) throw new Error("Rate limited");
  if (r.status >= 400) throw new Error(`HTTP ${r.status}`);
  return r.body;
}

async function fetchTodayOrNext(key) {
  const today = ymd(new Date());
  const todayRes = await apiGet(
    `/games?team_ids[]=${THUNDER_ID}&dates[]=${today}`,
    key
  );
  const todayGame = pickGame((todayRes && todayRes.data) || []);
  if (todayGame) return shape(todayGame);

  const start = new Date();
  start.setDate(start.getDate() + 1);
  const end = new Date();
  end.setDate(end.getDate() + 14);
  const upRes = await apiGet(
    `/games?team_ids[]=${THUNDER_ID}&start_date=${ymd(start)}&end_date=${ymd(end)}&per_page=5`,
    key
  );
  const games = ((upRes && upRes.data) || []).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const next = games[0];
  return next ? shape(next) : { kind: "off" };
}

AppSideService(
  BaseSideService({
    onInit() {},
    onRun() {},
    onDestroy() {},

    async onRequest(req, ctx) {
      try {
        if (req.method !== "GET_THUNDER") {
          ctx.response({ data: { error: "Unknown" } });
          return;
        }
        const settings = settingsLib.getAll();
        const key = (settings && settings.apiKey) || "";
        if (!key) {
          ctx.response({ data: { error: "Set API key in Zepp app" } });
          return;
        }
        const data = await fetchTodayOrNext(key);
        ctx.response({ data });
      } catch (e) {
        ctx.response({ data: { error: e.message || "Error" } });
      }
    },
  })
);
