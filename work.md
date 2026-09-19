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
happens. Climbing also passes through the branches growing out of the trunk, in
both directions. Standing inside one, press up and the cat takes hold instead of
jumping, the way standing at the foot of a ladder does. Fall onto one in mid-air
and it catches you: that is the automatic grip, with no button to hold.

Once attached, the cat stays put with nothing pressed. Up climbs, down descends,
and it stops at the top rather than climbing off into the air. Reaching out
left or right lets go.

Each trunk ends two tiles above its highest branch, so letting go at the top
drops the cat onto it.

### Wall jumping

Press into a rock face in mid-air and the cat **slides** down it at 95 px/s
instead of falling at 600. Sliding is a cushion, not a launchpad: by the time
you are sliding you are falling, and a falling cat cannot wall jump. It buys you
a soft way down when a chain breaks.

**You have to alternate sides.** The same wall cannot be used twice in a row:
left, then right, then left. So a single wall is never a climb — it gives you
one jump and no more. Two walls facing each other are. Landing resets it.

**And you have to still be going up.** A wall jump carries momentum on rather
than making it, so a chain has to be strung together on the way up and is over
the moment you start to fall. Miss it and you slide down and start again.

**A wall jump is never cut short**, however briefly you tap. Only jumps off the
ground have variable height. Chaining wall jumps means letting go of the button
to press it again, and cutting the rise for that release would sabotage the very
move the release was for.

**Press away from the wall and jump.** The wall stays available for a moment
after you stop touching it, so you steer where you want to go and jump, rather
than having to hold *into* the wall and hope. Holding into it still works.

Each wall jump needs its own press, so holding the button does not climb. For a
moment after the shove the steering is ignored, otherwise still holding
"towards the wall" would cancel the push and drop you straight back down.

Level 1 has a **shaft** between two rock towers for exactly this: walk in under
the overhanging left tower, then alternate your way up the 160px to the berries
on top. Two wall jumps do it, if you are prompt.

## Level 1 — the forest

Sunlit forest, 80 tiles wide. The sun is up in the top right, with shafts of
light falling through the trees.

**What is in it**

- **Four trees.** Every branch grows from a trunk, and every trunk runs down to
  the floor, so anything you can jump to you can also climb to. The game refuses
  to load a level with a branch attached to nothing.
- **Branches** — the platforms, and **one-way**: you jump up through one from
  underneath and land on it coming down. That is what lets a branch grow
  straight out of a trunk without walling off the climb. They are only as tall
  as their wood, so the cat lands on the surface you can see; the leaves
  hanging underneath are decoration and do not collide.
- **Forest floor** — earth with grass on top, with one gap to jump.
- **A fallen bough** lying a tile above the floor. Sneak under it, or jump on
  top and cross over. It is a choice, not a wall.
- **Trunks** to climb, one per tree. The tall one near the end runs from the
  floor to the highest branch, a route that skips the whole climb.
- **Boulders**, grey stone against all the green. Three broad ones, six tiles
  wide, are platforms in their own right — you land on them and cross them, with
  berries on top.
- **A shaft** made of two rock towers facing each other across three tiles. The
  left one overhangs, so you walk in underneath it at ground level; getting back
  out means alternating wall jumps between the two faces, quickly enough that
  you never stop rising.
- **37 berries** to collect, shown top left.
- **Scenery**: trees in two depth ranks, bushes and grass along the floor.

**Rules today**

- Collecting a berry increases the counter. Nothing happens at 26 yet.
- Falling into the gap respawns you at the start, with a screen flash.
- Nothing else can hurt you.

## What does not exist yet

No enemies, no water, no hazards, no death other than falling, no second level,
no sound, no menu, no saved progress. All of that is [`backlog.md`](backlog.md).
