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

## Every finished change is committed and pushed

Not batched up. When a change stands on its own — a mechanic, a level, a fix —
it is committed with its `work.md`, `questions.md` and folder-`CLAUDE.md`
updates in the same commit, and pushed. `main` is what GitHub Pages deploys, so
pushing is also how it goes live.

## Project docs

Two documents outside this file carry the game itself rather than the codebase,
and are **kept up to date as part of the work, not afterwards**:

- **`work.md`** — what the game is: characters, movement, rules, what level 1
  contains, and the Dutch/English glossary. Update it in the same change that
  alters the game.
- **`questions.md`** — decisions taken without the user, and the ones still
  open. Add to it whenever a judgement call is made that they might want back.
- **`backlog.md`** — future wishes as numbered tickets. New ideas go here rather
  than being built straight away. When a ticket is built, write up what changed
  in `work.md` and **delete the ticket**, so the backlog is only ever what is
  still wanted. Numbers are not reused.

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
  audio/        Every sound, synthesised. See audio/CLAUDE.md
  scenes/       Phaser scenes. See scenes/CLAUDE.md
  objects/      Game entities. See objects/CLAUDE.md
  input/        Keyboard + touch, unified. See input/CLAUDE.md
  level/        Level data, themes and the three levels. See level/CLAUDE.md
public/assets/  Static art and audio. See assets/CLAUDE.md
```

## Conventions that matter here

**The canvas matches the screen's shape.** The *height* is fixed — 252 game
pixels on a phone, 360 on a laptop — and the width is whatever that screen's
aspect ratio asks for, rounded to whole 16px tiles. `config.ts` works it out
once at load, from the longer side over the shorter one so the answer survives
the phone being held either way, and clamped to between 16:9 and 21:9.

That is what gets rid of the bars: `Scale.FIT` letterboxes whatever it is given,
so a canvas fixed at 16:9 on a 20:9 phone leaves a stripe down each side.
Matching the two leaves nothing to letterbox, and a wider phone simply sees a
little more of the level. Measured: an iPhone 15 gets 544x252 against a screen
of 2.17, a Galaxy S23 gets 560x252 against 2.22.

Gameplay code still works in game pixels and never reads `window.innerWidth`;
`config.ts` is the only place allowed to ask about the screen. A phone gets
*fewer* game pixels than a laptop on purpose — `FIT` scales whatever it is given
up to the screen, so fewer of them means each is drawn bigger. Add `?phone` to
the URL to see that view on a laptop.

**It installs.** There is a web manifest and a service worker, in the built game
only — a worker in front of the dev server intercepts the module graph and
breaks hot reloading in ways that look like the game being broken. The worker is
**network-first for the page**, so a deploy is live the next time the game is
opened with a connection; built assets are cache-first, which is safe because
Vite puts a content hash in every filename, so a changed file is a different
file and a hit can never be stale. `skipWaiting` plus a reload on `updatefound`
stops an installed copy sitting on an old build until every tab is closed.

The icons are SVG, not PNG, to keep the no-binary-assets rule.

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
reliably pick up anyway.

**Tweens do not advance under manual stepping.** `game.step` drives update,
physics and render, but the tween manager barely moves: 16 seconds of stepping
advanced a 7-second tween by 58ms. So anything animated by a tween -- the title
screen, the water swell, the pulsing exit door -- cannot be measured this way,
and a frozen one is the harness, not a bug. Bring the tab to the front and look
at it instead. Physics and input are unaffected, which is what this loop is for.

**Make the stub let go of buttons.** It is tempting to hold `jumpHeld` true and
just pulse `jumpJustPressed`, but no player can do that -- a second press needs a
release first, and the release has consequences of its own. A whole class of bug
lives in that gap, and a stub that never releases will report the game as fine:

```js
const stub = { left:false, right:false, sneak:false,
               jumpJustPressed:false, jumpHeld:false, update(){} };
scene.controls = stub;
stub.right = true;
for (let i = 0; i < 120; i++) frame();
console.log(scene.player.x, scene.player.sneaking);
```
