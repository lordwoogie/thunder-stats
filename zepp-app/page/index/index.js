import { createWidget, widget, align, prop, text_style } from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { BasePage } from "@zeppos/zml/base-page";

const { width: W, height: H } = getDeviceInfo();

const COLOR = {
  blue: 0x007AC1,
  dark: 0x002D62,
  orange: 0xEF6100,
  yellow: 0xFDBB30,
  text: 0xF0F4FF,
  dim: 0x8B9DC3,
  bg: 0x0A0E1A,
  card: 0x111827,
  green: 0x22C55E,
  red: 0xEF4444,
};

const REFRESH_LIVE_MS = 30 * 1000;
const REFRESH_IDLE_MS = 5 * 60 * 1000;

Page(
  BasePage({
    state: {
      timer: null,
      isLive: false,
      lastFetch: 0,
    },

    onInit() {},

    build() {
      createWidget(widget.FILL_RECT, {
        x: 0, y: 0, w: W, h: H, color: COLOR.bg,
      });

      this.brand = createWidget(widget.TEXT, {
        x: 0, y: px(56), w: W, h: px(36),
        color: COLOR.blue,
        text_size: px(26),
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        text_style: text_style.NONE,
        text: "THUNDER",
      });

      this.statusBadge = createWidget(widget.TEXT, {
        x: 0, y: px(96), w: W, h: px(26),
        color: COLOR.dim,
        text_size: px(18),
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        text: "Connecting…",
      });

      this.score = createWidget(widget.TEXT, {
        x: 0, y: px(140), w: W, h: px(96),
        color: COLOR.text,
        text_size: px(72),
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        text: "— : —",
      });

      this.matchup = createWidget(widget.TEXT, {
        x: 0, y: px(244), w: W, h: px(28),
        color: COLOR.dim,
        text_size: px(20),
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        text: "—",
      });

      this.clock = createWidget(widget.TEXT, {
        x: 0, y: px(280), w: W, h: px(28),
        color: COLOR.orange,
        text_size: px(20),
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        text: "",
      });

      this.refresh = createWidget(widget.BUTTON, {
        x: (W - px(160)) / 2,
        y: px(330),
        w: px(160),
        h: px(56),
        text: "REFRESH",
        color: 0xFFFFFF,
        text_size: px(20),
        radius: px(28),
        normal_color: COLOR.blue,
        press_color: COLOR.dark,
        click_func: () => this.fetchData(true),
      });

      this.fetchData(true);
      this.scheduleRefresh();
    },

    scheduleRefresh() {
      if (this.state.timer) clearInterval(this.state.timer);
      const ms = this.state.isLive ? REFRESH_LIVE_MS : REFRESH_IDLE_MS;
      this.state.timer = setInterval(() => this.fetchData(false), ms);
    },

    onDestroy() {
      if (this.state.timer) clearInterval(this.state.timer);
    },

    fetchData(showLoading) {
      if (showLoading) {
        this.statusBadge.setProperty(prop.TEXT, "Loading…");
        this.statusBadge.setProperty(prop.COLOR, COLOR.dim);
      }

      this.request({ method: "GET_THUNDER" })
        .then((res) => this.render(res))
        .catch(() => {
          this.statusBadge.setProperty(prop.TEXT, "No phone link");
          this.statusBadge.setProperty(prop.COLOR, COLOR.red);
        });
    },

    render(data) {
      if (!data || data.error) {
        const msg = data && data.error ? data.error : "Error";
        this.statusBadge.setProperty(prop.TEXT, msg);
        this.statusBadge.setProperty(prop.COLOR, COLOR.red);
        this.score.setProperty(prop.TEXT, "— : —");
        this.matchup.setProperty(prop.TEXT, "—");
        this.clock.setProperty(prop.TEXT, "");
        return;
      }

      if (data.kind === "live" || data.kind === "final") {
        const label = data.kind === "live" ? "LIVE" : "FINAL";
        const color = data.kind === "live" ? COLOR.orange : COLOR.green;
        this.statusBadge.setProperty(prop.TEXT, label);
        this.statusBadge.setProperty(prop.COLOR, color);
        this.score.setProperty(prop.TEXT, `${data.thunder} : ${data.opp}`);
        this.matchup.setProperty(prop.TEXT, `${data.home ? "vs" : "@"} ${data.oppAbbr}`);
        this.clock.setProperty(prop.TEXT, data.clock || "");
        const wasLive = this.state.isLive;
        this.state.isLive = data.kind === "live";
        if (wasLive !== this.state.isLive) this.scheduleRefresh();
      } else if (data.kind === "upcoming") {
        this.statusBadge.setProperty(prop.TEXT, "NEXT");
        this.statusBadge.setProperty(prop.COLOR, COLOR.yellow);
        this.score.setProperty(prop.TEXT, data.tipoff || "—");
        this.matchup.setProperty(prop.TEXT, `${data.home ? "vs" : "@"} ${data.oppAbbr}`);
        this.clock.setProperty(prop.TEXT, data.dateLabel || "");
        this.state.isLive = false;
      } else {
        this.statusBadge.setProperty(prop.TEXT, "OFF DAY");
        this.statusBadge.setProperty(prop.COLOR, COLOR.dim);
        this.score.setProperty(prop.TEXT, "— : —");
        this.matchup.setProperty(prop.TEXT, "No game scheduled");
        this.clock.setProperty(prop.TEXT, "");
        this.state.isLive = false;
      }
    },
  })
);
