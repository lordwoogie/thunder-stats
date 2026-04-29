# Thunder Stats — Amazfit / Zepp OS app

A Zepp OS mini-program that shows live OKC Thunder scores on the watch face.
Companion to the desktop dashboard in `index.html`.

## What it does

- Polls the [balldontlie](https://app.balldontlie.io) NBA API via the phone
  (using Zepp's app-side service — watches can't make HTTP calls directly).
- Shows the current Thunder game: **LIVE** with score + quarter/clock,
  **FINAL** with score, or **NEXT** with the upcoming opponent and tip-off.
- Auto-refreshes every 30 s while live, every 5 min otherwise.

## Layout

```
zepp-app/
├── app.json          Manifest + supported devices
├── app.js            App entrypoint (BaseApp)
├── page/index/       Watch UI
├── app-side/         Phone-side fetcher (balldontlie API)
├── setting/          API-key entry shown in the Zepp phone app
└── assets/icon.png   App icon (drop in your own 192x192)
```

## Build

You need [Zeus CLI](https://docs.zepp.com/docs/guides/tools/cli/) (Zepp's
official build tool) and Node 18+.

```bash
cd zepp-app
npm install -g @zeppos/zeus-cli
npm install
zeus dev          # live-reload to a paired watch via the Zepp app
zeus build        # produces dist/ with the .zab bundle
```

You'll also need to:

1. Drop a real `icon.png` (192×192) into `zepp-app/assets/`.
2. Get a free API key from <https://app.balldontlie.io>.
3. Run `zeus dev` and follow the QR-code flow — open the Zepp app, scan,
   the app installs and opens on your Amazfit.
4. Open the app's settings inside the Zepp phone app, paste the API key.

## Supported watches

`app.json` declares targets for GTR 4/Mini, GTS 4, T-Rex 2/Ultra, Active,
Balance, Cheetah/Pro, and Falcon — i.e. every current Zepp OS 2/3 device.
Add more by appending to the `platforms` array.

## Distribution

Zepp OS apps are normally distributed through the Zepp App Store after
review. For personal use, `zeus dev` and the `zab` files in `dist/` work
without publishing.
