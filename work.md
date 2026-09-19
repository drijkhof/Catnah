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

## Nothing can kill you before you move

Every level starts somewhere nothing can reach. Measured by standing perfectly
still for forty-five seconds on each one: the forest, the city and the volcano
put the cat out of everything's way already, and the swamp and the canopy did
not — a hedgehog simply walked into it. Both now start the cat on **a small
boulder**, which a hedgehog turns at and cannot climb.

A player who has not touched the controls yet should not be able to lose.

## Starting, and starting over

The game opens on a **title screen**: the forest of level 1 with nobody playing
it, a cat pacing the floor, a crow crossing overhead, a hedgehog trundling the
other way and a piranha coming out of a puddle now and then. **Catnah**, and
under it *A Hannah Milatovic Rijkhof Game*. Any key starts it; on a phone, a tap.

Losing your last heart does not bring you straight back here and does not drop
you back into the forest. The screen goes **black, with one line of red on it**:

> YOU UNALIVED

It holds for a moment before it will take an input — a death is usually a
keypress, and without the pause the press that killed you also dismisses the
message. Any key after that, or six seconds, and you are back at the title.

**Starting the game goes fullscreen**, and asks for landscape while it is
there. It has to happen on the keypress or the tap itself — a browser only
grants fullscreen from a real gesture — which is why it is the *first* thing
`begin()` does, before the fade. On Android Chrome it is the difference between
a game and a game with the address bar over it. If any of it is refused, the
game starts anyway.

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

**A tree cannot be climbed.** Lianas, ropes, drainpipes and chains can; a tree
trunk is a tree. The trunks are still drawn, still walked straight through and
their crowns are still something to stand on — the way *up* a tree is its
branches, which is why every branch in the forest grows out of one. The great
tree is a zigzag of branches four tiles apart, and the nest at the top is a jump
from the last of them.

Everything else here is **not solid** — walk straight through a liana at ground
level and nothing happens. Climbing also passes through the branches growing out
of a column, in both directions. Standing inside one, press up and the cat takes
hold instead of jumping, the way standing at the foot of a ladder does. Fall onto
one in mid-air and it catches you: that is the automatic grip, with no button to
hold.

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

There are exactly **three spare hearts in the whole game**, and they are always
in the same three places: the crow's nest at the top of the forest's great tree,
the rooftop nest in the city, and the back of the cave's longest dead end. The
swamp, the canopy and the volcano have none. Nothing about them is random, and none of them is needed to finish a
level.

Each is **guarded**, which is the point of them: a spare heart is something you
go and take off a bird, or walk a tunnel of spiders for, not something you pass
on the way.

The cat sits **in** a nest, not on top of one: the floor of a nest is partway
down it, and the near rim is drawn over the cat's legs, so only its head and
shoulders show above the straw.

- Below three hearts, it fills a spent one back in.
- At three or more, it simply adds another — the row grows, and you can carry
  four, five, as many as you find.

## The six levels

**Forest, city, swamp, canopy, cave, volcano.** Each one starts at one end and
ends at a **glowing door**, which takes you to the next; the volcano leads back
to the forest. Berries are optional everywhere.

The cave comes second to last rather than second. It is the descent, and what it
descends into is the volcano, so it has to be the thing you do immediately
before arriving there.

While developing, **Ctrl-clicking the level name** goes to the next level and
**Cmd-clicking** goes back one, both wrapping round. Neither is in the built
game.

**Every door always opens.** Nothing in a level has to be collected to leave it.






### 1 — Forest

Sunlit, with the sun up and shafts of light through the trees. Four ordinary
trees plus **the great tree**, which runs the full height of the level and has a
nest at the top with a crow living in it. Two pools, one shaft of boulders, one
sneaking bough, three hedgehogs, one piranha.
### 2 — City

Night, and built at the scale of the thing walking through it. The cat is 22x18
game pixels; a block of flats here is **sixteen storeys of brick**, an awning is
four tiles of steel and a **parked car is two tiles tall and five long**.
Standing in the street you can see the top of nothing. 176 tiles from end to
end, nine buildings.

**Roofs are sloped** — stepped, one way or the other — so the skyline is a
skyline rather than a row of boxes.

A building stands on the pavement and blocks it, so each one is either **gone
through** — an arcade at street level — or **gone over**. The four that are gone
over have **one drainpipe**, on the side you arrive at; coming down the far side
needs nothing, because falling is free. Four pipes in the whole city, and every
one of them bolted to a wall. The only columns standing on their own are the
**lampposts**, and they are short and have a lamp on top instead of a gutter
hopper.

Between the buildings are **awnings** to jump between, **parked cars** to
clamber on, rats on the pavement, and a **canal** eleven tiles wide. Nothing
swims in this city — the canal is water and no more than water. Two awnings span
it with five tiles of nothing between them: swim it the slow way, or make that
jump.

Berries are on the roofs. So is the **spare heart**, in a crow's nest on the
tallest building in the city.

### 3 — Swamp

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

**Nothing walks the banks.** The banks are where you stand still and work out
the next crossing; a hedgehog wandering into that is an interruption rather than
a danger. Everything dangerous in this level is in the water.

The lianas here are five tiles long, hang low over the water and **hang from
nothing**. That is on purpose: all you can do with one is cross, there is no
climbing up out of the level on them, and the swamp has sky overhead rather than
a roof.
### 4 — Canopy

Built around one move: **jumping off a liana onto a platform out of its reach**.
The lianas hang from the roof rather than standing on the floor, and every
platform is far too high to be reached from the ground — the best jump from
down there falls 138px short — so there is no way through that does not involve
letting go in mid-air.

In the middle, **five lianas hang side by side** — that stretch is crossed
sideways as much as climbed.

Getting off a liana and across a gap is up plus the direction you want to go.
### 5 — Cave

**Long, and all the way down.** 240 tiles end to end like everywhere else, but
the way out is forty rows lower than the way in, so the level reads as a descent
rather than a walk without ever being a shaft. It steps down to the right,
chamber by chamber — sixteen of them — and every step down is a drop you cannot
climb back up.

Carved rather than built: the grid starts as one block of rock and the passages
are cut out of it, so no floor is level and every passage has a roof.
Stalactites above, stalagmites below.

Each chamber is one idea, and never the same one twice running — pillars to
jump, shelves to climb, a low roof that forces a flat jump, a **squeeze** one
tile high that has to be crawled.

**There is no water down here.** A cave is dry rock; everything in it is
something to climb over, squeeze through or drop off.

**It branches, and most branches go nowhere.** They climb *away* from the main
run, because the main run only goes down: a dead end you have to drop into would
be a trap, one you climb into is a decision. Three of them are worth berries.

The fourth runs back over the top of the level for thirty tiles and ends in a
chamber with the **spare heart** in it — and hanging over the doorway, a spider
**ten times the size** of the others, a third of the screen across. It walks the
ceiling like the rest of them and drops like the rest of them, slowly, and there
is no getting past it except by timing it.

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

Nothing walks the lava fields — no hedgehogs down here. The only living thing
in this level is what waits at the end of it.

Inside waits the **evil lord beetle**, a ladybird with the sweetness taken out,
three times the cat in every direction. It **stalks**: it sweeps above the floor
leaning towards wherever you are, slides until it is **directly overhead** —
aimed at where you are *going*, not where you stand — and drops straight down.

- Its sweep covers **the whole arena**. There is no corner it cannot reach.
- It **aims ahead of you**, so running away in a straight line is what gets you
  hit. You have to turn, stop or break the other way.
- It **gets angrier**. Every dive shortens the next wait, from 1.5 seconds down
  to 0.6, so working out the pattern is possible for a while and then stops
  being possible. Leaving the arena and coming back cools it off.

Measured: standing still in the arena kills you in **2.7 seconds**. It cannot be
beaten, only got past, and the way out is at the far end of the arena.

## The creatures

- **Hedgehogs** pace the floor, turning at anything solid, at the edge of a
  drop, and at the edge of the level, so they never fall off. They keep to plain
  ground: never on platforms, never on boulders, never in water. They are slow,
  and cannot be defeated — touching one is fatal from any direction.
- **Rats** are the city's version: the same behaviour, nearly twice as quick.
- **Spiders** own the cave's ceilings the way a hedgehog owns a floor. One
  walks the underside of the rock, upside down, turning wherever the rock stops,
  and drops the length of its thread on any cat that passes under it — then
  hangs a moment and hauls itself back up. Fatal to touch, like everything else.
  It is the cave's own creature and the only one down there.
- **Crocodiles** lie still at the surface of the swamp's water and are the only
  thing in the game you are *meant* to stand on. Land on the back and it sinks
  under you shortly afterwards, then comes back up. They are harmless from
  above and **fatal from the water**. Lying there it keeps its **mouth shut**, a
  long flat snout with the teeth showing along the jaw. The moment there is a
  cat **in its own water**, every crocodile in that pool **opens wide** — dark
  throat, red tongue, every tooth — **turns round and swims at you**. Only the
  one that gets there bites: three set off and one arrives. They never leave
  their own pool, and when you are out of the water they swim back to their
  places and become platforms again. Only the back is something to stand on;
  the jaws are not.
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
