[![make.fun](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/jihoonbaee/best-game/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/jihoonbaee/best-game/reward.svg)](https://make.fun/bounty/best-game-01)

# Thornwatch — a garden tower defense

An entry for [make.fun's best-game-01](https://make.fun/bounty/best-game-01).

The blight marches on the Heartseed. Grow an army of plants along its road and hold the garden through 15 waves — ending in a fight against the Blightlord.

## The game

- **4 plant towers**, each with a job: Thornspitter (fast and cheap), Frostbloom (chills the march), Rootspike (long-range heavy hits), Emberpod (splash damage).
- **Upgrades**: every tower has 3 levels, plus selling at a 70% refund.
- **15 waves** of escalating blight: fast Swiftmoths, tanky Barkbeetles, Sporebats, a Blight Warden mini-boss on wave 8, and the Blightlord on wave 15.
- **Sunburst**: a cooldown ability that blasts every enemy on screen.
- **Full loop**: title screen, build phases, wave banners, pause, speed toggle, victory and defeat screens with stats and restart.
- **Feel**: particles, floating gold text, screen shake on leaks, hit flashes, range previews, and synthesized WebAudio sound (no audio files).
- **No network, no build step**: static files under `game/`, all art drawn procedurally on canvas.

## Controls

| Input | Action |
|---|---|
| Click plant card (or keys 1–4), then a grass tile | Plant a tower |
| Click a tower | Select it — upgrade (U) or sell (S) |
| Space | Start the next wave |
| Q | Sunburst |
| F | Speed 1× / 2× |
| P / Esc | Pause |
| M | Sound on/off |

## Play it locally

```sh
node serve.ts   # serves game/ on http://localhost:8080 (dev only, not part of the entry)
```

Or serve `game/` with any static file server and open `index.html`.

Screenshot staging (real game states, for the entry's screenshots): `?shot=start`, `?shot=play`, `?shot=boss`, `?shot=victory`, `?shot=defeat`.

## Entry layout

- `game/` — the game (index.html + ES modules under `src/`)
- `screenshots/` — the entry's screenshots, stored as base64 (`.jpg.b64`) because the push path accepts text only; `main.ts` decodes them to real JPEGs in `/output` (byte-exact, sha256-verified)
- `main.ts` — the entry program: copies `game/` + screenshots to `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `LICENSE` — MIT

## License

MIT — see [LICENSE](LICENSE).
