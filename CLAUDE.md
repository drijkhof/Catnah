# Hannah1

A 2D platformer that runs in the browser, on **both phone and laptop**. Those
are equal targets, not a primary and a fallback: every feature needs to work
with touch and with a keyboard, and needs to be readable on a small screen.

Packaging as a native app may come later (Capacitor wraps this build as-is), so
avoid anything that assumes a desktop-only browser.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload on **http://localhost:5180** |
| `npm run build` | Typecheck, then production build into `dist/` |
| `npm run preview` | Serve the built `dist/` on port 5180 |
| `npm run typecheck` | `tsc --noEmit`, no build |

### Port 5180 is this project's port

Always 5180, for dev and preview alike, set in `vite.config.ts` with
`strictPort: true`.

This is not Vite's default 5173 on purpose: another project on this machine
already listens there. Because that one binds `[::1]` and Vite here binds the
wildcard address, **both servers can start "successfully" at once** while
`localhost` silently serves the other project's app. `strictPort` makes a clash
fail loudly instead of drifting to a random port.

### Previewing on a phone

`npm run dev` prints a `Network:` URL (e.g. `http://192.168.1.169:5180`).
Open that on a phone on the same Wi-Fi; hot reload works there too.

## Stack

- **Phaser 4** (`phaser`) — 2D engine: arcade physics, scenes, input, scaling.
  Note it is Phaser **4**, not 3. Most Phaser tutorials online are Phaser 3;
  the scene and physics APIs are close, but verify against
  `node_modules/phaser/types/phaser.d.ts` before trusting a snippet.
- **Vite 8** — dev server and bundler.
- **TypeScript 7**, `strict` mode. No `any`; prefer `declare body:` style
  narrowing like `Player` does over casts.

There is no test runner, no linter and no CSS framework yet. Add them when
something actually needs them, not pre-emptively.

## Layout

```
src/
  main.ts       Phaser.Game config and boot. The only file that touches globals.
  config.ts     Every tunable number (sizes, physics, palette).
  style.css     Page-level CSS: letterboxing, and the mobile touch fixes.
  scenes/       Phaser scenes. See scenes/CLAUDE.md
  objects/      Game entities. See objects/CLAUDE.md
  input/        Keyboard + touch, unified. See input/CLAUDE.md
  level/        Level data and parsing. See level/CLAUDE.md
public/assets/  Static art and audio. See assets/CLAUDE.md
```

## Conventions that matter here

**Fixed logical resolution.** The game always renders at 640x360 game pixels
(`GAME_WIDTH`/`GAME_HEIGHT`) and Phaser's `Scale.FIT` letterboxes that to the
real viewport. So gameplay code works in game pixels and never reads
`window.innerWidth`, and one build serves every screen size. Keep it that way.

**Tunables live in `config.ts`.** Jump heights, speeds and colours do not belong
inline in a scene. If you find yourself typing a number twice, it goes there.

**Never branch on device type in gameplay code.** Ask `Controls` what the
player wants; it merges keyboard and touch. See `input/CLAUDE.md`.

**HUD and touch controls use `setScrollFactor(0)`** so they pin to the viewport
instead of scrolling with the world, plus a high `setDepth` to stay on top.

**`window.game` exists in dev only** (guarded by `import.meta.env.DEV` in
`main.ts`), so the running game can be inspected from the browser console:
`game.scene.getScene('Game')`.

## Debugging

- Physics bodies and velocity vectors: set `physics.arcade.debug` to `true` in
  `src/main.ts`.
- If `localhost:5180` shows someone else's app, see the port section above.
