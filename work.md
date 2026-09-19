# Hannah1 — the game

What the game *is*. Future wishes live in [`backlog.md`](backlog.md); how the
code is built lives in [`CLAUDE.md`](CLAUDE.md).

Status: **level 1 playable** — you can run, jump, sneak and collect berries.
There is no win state, no enemies and no way to die except falling.

---

## The idea

A 2D platformer. You play a **cat** in a sunlit forest, moving left to right
along the branches of the trees, collecting berries.

It runs in a browser on **both a phone and a laptop**. Neither is the "real"
version — every feature has to work with touch and with a keyboard.

## Glossary

The game is discussed in Dutch and written in English. Same thing, two names:

| Dutch | Code / docs | What it is |
| --- | --- | --- |
| sluipen | `sneak` | moving low, flat and slow |
| tak | `branch` | the platforms |
| boomstam | `bough` / `trunk` | fallen log; standing tree trunk |
| bes | `berry` | the collectible |
| struik | `bush` | scenery |
| egel | `hedgehog` | enemy — see backlog |
| rots | `boulder` | see backlog |

## The cat

Ginger, so it stays readable against all that green. Two poses:

| Pose | Size | Speed |
| --- | --- | --- |
| Standing | 22 × 18 px | 190 px/s |
| Sneaking | 26 × 9 px | 80 px/s (42%) |

Standing is deliberately taller than one 16px tile, which is what makes a
one-tile gap something you can only get through by sneaking.

## Moving

| Action | Keyboard | Touch |
| --- | --- | --- |
| Forward / back | `→` `←` or `D` `A` | two buttons, bottom left |
| Jump | `↑`, `Space` or `W` | button, bottom right |
| Sneak | `↓` or `S` | button, left of jump |

- **Gravity is always on.** Falling speed is capped at 600 px/s so long drops
  stay readable.
- **You steer in the air**, but with less grip than on the ground.
- **Jump height is variable**: tap for ~41px, hold for ~86px.
- The jump is forgiving in two ways — it still fires just after you run off a
  ledge (coyote time), and a press just before you land is remembered and fires
  on contact (jump buffer).
- **Sneaking is blocked from standing up** when there is no headroom, so you
  cannot pop up through a log you are sneaking under, nor jump out from under it.

## Level 1 — the forest

Sunlit forest, 80 tiles wide. The sun is up in the top right, with shafts of
light falling through the trees.

**What is in it**

- **Branches** — the platforms. Only as tall as their wood, so the cat lands on
  the surface you can see; the leaves hanging underneath are decoration and do
  not collide.
- **Forest floor** — earth with grass on top, with one gap to jump.
- **A fallen bough** lying a tile above the floor. Sneak under it, or jump on
  top and cross over. It is a choice, not a wall.
- **26 berries** to collect, shown top left.
- **Scenery**: trees in two depth ranks, bushes and grass along the floor.

**Rules today**

- Collecting a berry increases the counter. Nothing happens at 26 yet.
- Falling into the gap respawns you at the start, with a screen flash.
- Nothing else can hurt you.

## What does not exist yet

No enemies, no water, no hazards, no death other than falling, no second level,
no sound, no menu, no saved progress. All of that is [`backlog.md`](backlog.md).
