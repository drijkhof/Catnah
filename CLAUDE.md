# Hannah1

A 2D platformer that runs in the browser, on **both phone and laptop**.

You play a cat. Level 1 is a sunlit forest: the sun is up, and the platforms are
the branches of the trees. The cat can move forward and back, jump, and sneak,
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

### Editing while the game runs

A code change swaps the game in place and **keeps the player where they are**,
along with what they have collected — no page reload, no walk back from the
spawn point. Change a jump height or a level tile and it shows up around the cat
standing there.

It has a few sharp edges that are easy to reintroduce; `src/dev/CLAUDE.md` has
them.

### Previewing on a phone

`npm run dev` prints a `Network:` URL (e.g. `http://192.168.1.169:5180`).
Open that on a phone on the same Wi-Fi; hot reload works there too.

## Project docs

Two documents outside this file carry the game itself rather than the codebase,
and are **kept up to date as part of the work, not afterwards**:

- **`work.md`** — what the game is: characters, movement, rules, what level 1
  contains, and the Dutch/English glossary. Update it in the same change that
  alters the game.
- **`backlog.md`** — future wishes as numbered tickets. New ideas go here rather
  than being built straight away. When a ticket is built, mark it `done` and
  move what it added into `work.md`.

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
when a tab is hidden, so the game loop stops while any script run from the
console keeps going. Anything measured that way is measuring a frozen game, and
a tab that was hidden from the start has not even booted -- `BootScene` never
ran, so no textures exist. Check `game.loop.frame` before trusting a result.

`game.step(time, delta)` runs a whole frame by hand -- update, physics and
render -- so the game can be booted and driven with no visible tab at all, at a
fixed timestep that does not vary with machine speed:

```js
let clock = 0;
const frame = () => { clock += 16.667; game.step(clock, 16.667); };

for (let i = 0; i < 10; i++) frame();          // boot through to the Game scene
const scene = game.scene.getScene('Game');
```

Assigning a stub over `scene.controls` (same getters, plain booleans) then lets
that loop play the game without synthetic keyboard events, which Phaser does not
reliably pick up anyway:

```js
const stub = { left:false, right:false, sneak:false,
               jumpJustPressed:false, jumpHeld:false, update(){} };
scene.controls = stub;
stub.right = true;
for (let i = 0; i < 120; i++) frame();
console.log(scene.player.x, scene.player.sneaking);
```
