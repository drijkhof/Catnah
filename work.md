# Hannah1 — the game

What the game *is*. Future wishes live in [`backlog.md`](backlog.md); how the
code is built lives in [`CLAUDE.md`](CLAUDE.md).

Status: **level 1 playable** — you can run, jump, sneak, wall jump, climb
trunks and collect berries. There is no win state, no enemies and no way to die except falling.

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
| boomstam | `bough` / `trunk` | fallen log; climbable standing trunk |
| bes | `berry` | the collectible |
| struik | `bush` | scenery |
| egel | `hedgehog` | enemy — see backlog |
| rots | `boulder` / `rock` | solid, climbable stone |

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

There is no separate button for wall jumping or climbing. The jump button means
"up" and the sneak button means "down"; what they do depends on where the cat
is.

- **Gravity is always on.** Falling speed is capped at 600 px/s so long drops
  stay readable.
- **You steer in the air**, but with less grip than on the ground.
- **Jump height is variable**: tap for ~41px, hold for ~86px.
- The jump is forgiving in two ways — it still fires just after you run off a
  ledge (coyote time), and a press just before you land is remembered and fires
  on contact (jump buffer).
- **Sneaking is blocked from standing up** when there is no headroom, so you
  cannot pop up through a log you are sneaking under, nor jump out from under it.

### Climbing trunks

Trunks are **not solid** — walk straight through one at ground level and nothing
happens. Standing inside one, press up and the cat takes hold instead of
jumping, the way standing at the foot of a ladder does. Fall onto one in mid-air
and it catches you: that is the automatic grip, with no button to hold.

Once attached, the cat stays put with nothing pressed. Up climbs, down descends,
and it stops at the top rather than climbing off into the air. Reaching out
left or right lets go.

Each trunk in level 1 ends two tiles above the branch beside it, so letting go
at the top drops the cat onto that branch.

### Wall jumping

Press into a rock face in mid-air and the cat **slides** down it at 95 px/s
instead of falling at 600 — slow enough to see what is coming. Press jump there
and it launches up and away from the wall.

Each wall jump needs its own press, so holding the button does not climb. For a
moment after the shove the steering is ignored, otherwise still holding
"towards the wall" — which is what you were holding to cling to it — would
cancel the push and drop you straight back down.

Climbing a face is a rhythm: jump, let the shove carry you out, steer back in,
jump again. The tower in level 1 takes three of them and about half a second.

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
- **Two trunks** to climb. A short one early on, beside the first branch, and a
  tall one near the end running from the floor all the way to the high branch —
  a route that skips the whole climb.
- **Boulders**, grey stone against all the green. A small one early on, two
  tiles tall, as a step. And a tower seven tiles tall — higher than any single
  jump — whose face has to be wall jumped. Two berries sit on top, and from
  there it is a short hop to a branch that otherwise takes the long way round.
- **28 berries** to collect, shown top left.
- **Scenery**: trees in two depth ranks, bushes and grass along the floor.

**Rules today**

- Collecting a berry increases the counter. Nothing happens at 26 yet.
- Falling into the gap respawns you at the start, with a screen flash.
- Nothing else can hurt you.

## What does not exist yet

No enemies, no water, no hazards, no death other than falling, no second level,
no sound, no menu, no saved progress. All of that is [`backlog.md`](backlog.md).
