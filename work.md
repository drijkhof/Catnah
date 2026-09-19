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

## Starting, and starting over

The game opens on a **title screen**: the forest of level 1 with nobody playing
it, a cat pacing the floor, a crow crossing overhead, a hedgehog trundling the
other way and a piranha coming out of a puddle now and then. **Catnah**, and
under it *A Hannah Milatovic Rijkhof Game*. Any key starts it; on a phone, a tap.

Losing your last heart brings you back here rather than straight into the
forest, so a run visibly ends before the next one begins.

## The screen

The game is drawn at a fixed size and scaled to fill whatever it lands on, so it
plays identically everywhere. There are two of those sizes: a laptop gets
640x360 game pixels, a **phone gets 448x252** — fewer pixels, each drawn bigger,
so the cat and the level are about 1.4x the size and you see less of the level
at once. At the laptop size a phone screen makes a tile about the size of a
grain of rice.

Add `?phone` to the URL to see the phone view on a laptop.

## Moving

| Action | Keyboard | Touch |
| --- | --- | --- |
| Forward / back | `→` `←` or `D` `A` | two buttons, bottom left |
| **Jump / climb up / swim up** | `Space`, `↑` or `W` | button, bottom right |
| Sneak / climb down / swim down | `↓` or `S` | button, left of jump |

**Up and jump are one button.** `Space`, `↑` and `W` do exactly the same thing,
and there are three buttons on a phone, not four. What it does depends on where
the cat is: on the ground it jumps, on a rope it climbs, in water it swims up.

They were two buttons once, because you cannot jump off the thing you are
climbing with only one. Two buttons for one intention turned out to be worse,
especially under a thumb, so the answer moved into the game instead: **leaping
off a rope is up *and* a direction**, together. Up alone climbs it, a direction
alone slides along it, and the two at once throw the cat off towards where you
are pointing.

Wall jumping has no button of its own: in mid-air against a wall, jump does it.

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

### Standing on things

The **crown of any climbable column** is a ledge — climb a tree and you end up
standing on top of it. So is a **nest**, which is drawn as a bowl of woven straw
because it is somewhere to be rather than something to look at. In the city,
**parked cars** are solid and can be clambered onto.

Both ledges are one-way, so climbing up the inside of a trunk still passes
through and leaves you standing on the crown.

### Climbing trunks

Trunks are **not solid** — walk straight through one at ground level and nothing
happens. Climbing also passes through the branches growing out of the trunk, in
both directions. Standing inside one, press up and the cat takes hold instead of
jumping, the way standing at the foot of a ladder does. Fall onto one in mid-air
and it catches you: that is the automatic grip, with no button to hold.

Once attached, the cat stays put with nothing pressed. Up climbs, down descends,
and it stops at the top rather than climbing off into the air. Reaching out
left or right lets go — and **up together with a direction leaps off**, in
whichever order you press them.

A climbing cat is drawn clinging to the rope from behind, **head up**, and stays
that way climbing down: a cat comes down a rope backwards, and head-first would
read as falling.

Each trunk ends two tiles above its highest branch, so letting go at the top
drops the cat onto it.

### Swimming

Water is **not dangerous**. Some pools have nothing in them at all, so falling
in is a change of pace rather than a punishment.

A cat in water is **in** it. Touch a pool and it sinks until its back is under
the surface, then holds that depth — it does not skate along the top.

From there it is **neutrally buoyant**: it stays at whatever depth it has with
nothing pressed, and **up and sneak take it up and down**. Horizontally it moves
at about half speed. A press of up is a stroke, strong enough to break the
surface and land the cat on a bank. Water is somewhere to move about in rather
than something to struggle out of, which is why it is not dangerous.

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
at the start of the level.

You get **three lives**, shown as red hearts in the top right. Each death dims
one, and **berries you have already collected stay collected** between them.

Lose the last heart and the whole game starts again from the forest, with three
fresh hearts.

**Lives travel with you** from level to level, which is what makes finding a
spare one worth the detour.

### Spare hearts

There are exactly **two spare hearts in the whole game**, and they are always in
the same two places: the crow's nest at the top of the forest's great tree, and
the rooftop nest in the city. The cave, the swamp, the canopy and the volcano
have none. Nothing about them is random, and none of them is needed to finish a
level.

Both are **guarded by a crow**, which is the point of them: a spare heart is
something you go and take off a bird, not something you walk past.

The cat sits **in** a nest, not on top of one: the floor of a nest is partway
down it, and the near rim is drawn over the cat's legs, so only its head and
shoulders show above the straw.

- Below three hearts, it fills a spent one back in.
- At three or more, it simply adds another — the row grows, and you can carry
  four, five, as many as you find.

## The three levels

Each one starts on the left and ends at a **glowing door** on the right, which
takes you to the next. The city leads back to the forest. Berries are optional
everywhere.

While developing, **Ctrl-clicking the level name** goes to the next level and
**Cmd-clicking** goes back one, both wrapping round. Neither is in the built
game.

**Every door always opens.** Nothing in a level has to be collected to leave it.






### 1 — Forest

Sunlit, with the sun up and shafts of light through the trees. Four ordinary
trees plus **the great tree**, which runs the full height of the level and has a
nest at the top with a crow living in it. Two pools, one shaft of boulders, one
sneaking bough, three hedgehogs, one piranha.
### 2 — Cave

Caving, not a corridor. The level is **solid rock with tunnels cut out of it**,
so the floor is never level and every passage has a roof. It branches, and
**not every branch goes anywhere**: several are dead ends with berries at the
back, so the point is to explore rather than to run right.

**Ropes bolted to the roof** hang down the shafts, bedded rock shelves make the
ledges, stalactites hang above and stalagmites rise below. One passage is a
single tile high, so only a sneaking cat fits through it — and what is behind it
is berries, not the way on.

A flooded chamber low down has something living in it.
### 3 — City

Night, and properly urban. Brick flats to climb, **steel I-beam girders** lit
along their edges, **drainpipes and lampposts** to climb, **parked cars** to
clamber over, a canal, and a crow nesting on a rooftop. The buildings behind are
lit window by window.

**Rats here, not hedgehogs** — same idea, but faster and low to the ground.
### 4 — Swamp

By far the longest level — 248 tiles, three times any other — and all of it is
one question: how do you get over the water? Overcast sky going brown at the
horizon, dead trees hung with moss, reeds along the waterline, mist drifting
across in two bands.

**Eight crossings, alternating**, with a strip of bank between each pair. The
two kinds never mix; a stretch of water has one danger, not two.

- **Crocodile water.** Crocodiles lie in it and nothing else does. Their backs
  are a floor, so the way over is to hop from one to the next — but they are 5
  to 7 tiles apart, which is most of a jump, and none of them stays up. Land on
  one and it takes half a second to notice, then it goes under and stays under
  for a second and a half before surfacing again. **A crocodile eats a cat that
  is in the water beside it**, floating or sunk, so falling short is not free.
- **Piranha water.** No crocodiles, and far too many fish to swim past —
  four to six in every stretch. **Lianas hang over it**, and they are the whole
  route: jump off the bank, catch one in mid-air, leap to the next, and land on
  the far side. Nothing at water level gets you across.

The lianas here are five tiles long, hang low over the water and **hang from
nothing**. That is on purpose: all you can do with one is cross, there is no
climbing up out of the level on them, and the swamp has sky overhead rather than
a roof.
### 5 — Canopy

Built around one move: **jumping off a liana onto a platform out of its reach**.
The lianas hang from the roof rather than standing on the floor, and every
platform is far too high to be reached from the ground — the best jump from
down there falls 138px short — so there is no way through that does not involve
letting go in mid-air.

In the middle, **five lianas hang side by side** — that stretch is crossed
sideways as much as climbed.

Getting off a liana and across a gap is up plus the direction you want to go.
### 6 — Volcano

The floor is a **lava lake** and only the islands are safe, so the level reads
as somewhere not to land rather than somewhere to walk. Chains hang over the
gaps where there is nothing living left to climb, bolted to rings in the roof of
nothing.

Lava is shaped exactly like water and behaves nothing like it: not solid, and
**fatal to touch**. Cones on the skyline have lava running down them, and embers
drift up through the whole level.

The level ends at the **volcano itself**: a cone of rock with a crater notch at
the top and a mouth at ground level. Walk in through the mouth and you are in an
enclosed **arena** — walls all round, the cone's slope for a ceiling.

Inside waits the **evil lord beetle**, a ladybird with the sweetness taken out,
three times the cat in every direction. It sweeps above the floor, slides until
it is **directly overhead**, then drops straight down. Standing still is fatal;
reading the line-up and moving is not.

It leaves you alone until you are properly inside, and then waits a few seconds
more before its first attack — long enough to watch one sweep before you are
asked to read one. It cannot be beaten, only got past, and the way out is at the
far end of the arena.

## The creatures

- **Hedgehogs** pace the floor, turning at anything solid, at the edge of a
  drop, and at the edge of the level, so they never fall off. They keep to plain
  ground: never on platforms, never on boulders, never in water. They are slow,
  and cannot be defeated — touching one is fatal from any direction.
- **Rats** are the city's version: the same behaviour, nearly twice as quick.
- **Crocodiles** lie still at the surface of the swamp's water and are the only
  thing in the game you are *meant* to stand on. Land on the back and it sinks
  under you shortly afterwards, then comes back up. They are harmless from
  above and fatal from the water, sunk or floating.
- **Piranhas** patrol the pool they live in, lurking below the surface and
  leaping straight out every 2.2 seconds, always to the same rhythm so it can be
  learnt. One will chase a cat that swims **into its own pool**, and never
  leaves that pool for any reason. Not every pool has one.
- **The crow** circles its nest until the cat comes near it, then breaks off and
  flies at it in curves, giving up once the cat is well away again. It notices
  the cat from a long way off (150px) and is genuinely hard to get past, which
  is fair because everything it guards is optional.

## What does not exist yet

No win state, no score, no sound, no menu, no saved progress. The open design
questions are in [`questions.md`](questions.md).
