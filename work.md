# Hannah1 — the game

What the game *is*. Future wishes live in [`backlog.md`](backlog.md); how the
code is built lives in [`CLAUDE.md`](CLAUDE.md).

Status: **level 1 playable** — you can run, jump, sneak, wall jump, climb
trunks and collect berries. There is no win state, no enemies and no way to die except falling.

---

## The idea

A 2D platformer. You play a **cat**, moving left to right through three places,
collecting berries and finding the way out of each.

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
| egel | `hedgehog` | enemy — paces a platform, deadly to touch |
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
- **Jump height is variable**: a flick of the space bar gives about 39px and
  holding it gives 86px, with everything in between. Letting go does not stop
  the climb dead — the cat gets heavier and coasts on a little, still rising
  about 30px after a very short tap.
- The jump still fires just after you run off a ledge (coyote time).
- **There is no jump buffer.** A press either jumps or is forgotten; nothing is
  stored for later.
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

### Swimming

Water is **not dangerous**. Some pools have nothing in them at all, so falling
in is a change of pace rather than a punishment.

In water the cat sinks gently at 70 px/s instead of dropping at 600, moves at
about half speed, and climbs by **stroking**: every press of jump is one stroke,
with no ground needed and no limit on how many. Swim up to the surface and out
over the bank, or sink to the bottom and walk along it. Sneaking is not possible
while swimming.

### Wall jumping

A wall jump is **an ordinary jump that you are allowed to take off a wall**. It
has no push of its own: the height is a normal jump's, variable in the usual
way, and it does not touch your horizontal direction or speed at all. Where you
go next is entirely your steering.

- **Being against the wall is enough.** No need to hold yourself into it, and no
  horizontal movement required — resting against one and pressing jump does it.
- **Rising or falling makes no difference.** You can take one on the way down.
- **You have to alternate sides.** The same wall cannot be used twice in a row:
  left, then right, then left. Landing resets it.

Pressing into a wall while falling still makes the cat **slide** at 95 px/s
instead of 600, which is a way to buy time rather than a requirement.

Level 1 has a **shaft** between two rock towers for this: walk in under the
overhanging left tower and alternate your way up 224px to the berries on top.
One wall alone will not do it — a jump off the floor plus a single wall jump
reaches 172px, and there it stops.


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
- **Two pools** cut into the forest floor, three tiles deep. Neither has
  anything living in it — that comes later.
- **A shaft** made of two rock towers facing each other across three tiles. The
  left one overhangs, so you walk in underneath it at ground level; getting back
  out means alternating wall jumps between the two faces, quickly enough that
  you never stop rising.
- Berries to collect, counted top left, per level.
- **Scenery**: trees in two depth ranks, bushes and grass along the floor.

**Rules today**

- Collecting a berry increases the counter. Nothing happens at 26 yet.
- Falling into the gap respawns you at the start, with a screen flash.
- Nothing else can hurt you.

## Dying

Anything dangerous kills the cat on contact, and so does falling out of the
world. There is a short pause — a flash and a shake — and then the cat is back
at the start of the level. Retries are unlimited, and **berries you have already
collected stay collected**.

## The three levels

Each one starts on the left and ends at a **glowing door** on the right, which
takes you to the next. The city leads back to the forest. Berries are optional
everywhere.

### 1 — Forest

Sunlit, with the sun up and shafts of light through the trees. Four ordinary
trees plus **the great tree**, which runs the full height of the level and has a
nest at the top with a crow living in it. Two pools, one shaft of boulders, one
sneaking bough, three hedgehogs, one piranha.

### 2 — Cave

Underground: a rock roof with stalactites, glowing crystals along the floor,
hanging vines to climb instead of trunks, stone shelves instead of branches, and
a cold pool with something in it.

### 3 — City

Night. Brick buildings to climb, steel girders lit along their edges as
platforms, drainpipes to climb, a canal, and a crow nesting on a rooftop. The
buildings behind are lit window by window.

## The creatures

- **Hedgehogs** pace whatever they are standing on, turning at anything solid
  and at the edge of the floor, so they never fall off. They are slow. They
  cannot be defeated — touching one is fatal from any direction.
- **Piranhas** lurk below the surface of a pool and leap out every 2.2 seconds,
  always to the same rhythm so it can be learnt. Only one pool per level has one.
- **The crow** circles its nest until the cat comes near it, then breaks off and
  flies at it in curves, giving up once the cat is well away again.

## What does not exist yet

No win state, no score, no sound, no menu, no saved progress. The open design
questions are in [`questions.md`](questions.md).
