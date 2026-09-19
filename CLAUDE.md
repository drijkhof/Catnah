# Hannah1

A 2D platformer that runs in the browser, on **both phone and laptop**.

You play a cat. Level 1 is a sunlit forest: the sun is up, and the platforms are
the branches of the trees. The cat can move forward and back, jump, and crouch,
steers in the air, and is always subject to gravity. Those
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

**Art is referred to by texture key, never by colour or shape.** Every texture
is drawn in code in `src/art` and swapped for real art by loading a file under
the same key. See `art/CLAUDE.md`.

**Scenery scatter must be seeded** (`createRandom`, never `Math.random`), or the
forest rearranges itself on every hot reload and on every player's device.

**HUD and touch controls use `setScrollFactor(0)`** so they pin to the viewport
instead of scrolling with the world, plus a high `setDepth` to stay on top.

**`window.game` exists in dev only** (guarded by `import.meta.env.DEV` in
`main.ts`), so the running game can be inspected from the browser console:
`game.scene.getScene('Game')`.

## Debugging

- Physics bodies and velocity vectors: set `physics.arcade.debug` to `true` in
  `src/main.ts`.
- If `localhost:5180` shows someone else's app, see the port section above.

### Driving the game from the console

`window.game` exists in dev, so the running game can be poked and even tested
from the browser console.

**A background tab does not run the game.** Chrome pauses `requestAnimationFrame`
when a tab is hidden, so the game loop stops while any script you run from the
console keeps going. Anything measured that way is measuring a frozen game --
check `game.loop.frame` actually advances before trusting a result.

To step the game deterministically instead, drive it by hand at a fixed
timestep. All three calls are needed: `postUpdate` is what copies physics bodies
back onto their sprites, and without it positions never appear to change.

```js
const scene = game.scene.getScene('Game');
for (let i = 0; i < 60; i++) {
  const t = i * 16.667;
  scene.update(t, 16.667);
  scene.physics.world.update(t, 16.667);
  scene.physics.world.postUpdate();
}
```

Assigning a stub over `scene.controls` (same getters, plain booleans) lets that
loop play the game without synthetic keyboard events.
