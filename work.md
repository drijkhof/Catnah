# Hannah1 — the game

What the game *is*. Future wishes live in [`backlog.md`](backlog.md); how the
code is built lives in [`CLAUDE.md`](CLAUDE.md).

Status: **level 1 playable** — you can run, jump, sneak, wall jump, climb
trunks and collect little hearts. There is no win state, no enemies and no way to die except falling.

---

## The idea

A 2D platformer. You play a **cat**, moving left to right through three places,
collecting little hearts and finding the way out of each.

It runs in a browser on **both a phone and a laptop**. Neither is the "real"
version — every feature has to work with touch and with a keyboard.

## Glossary

The game is discussed in Dutch and written in English. Same thing, two names:

| Dutch | Code / docs | What it is |
| --- | --- | --- |
| sluipen | `sneak` | moving low, flat and slow |
| tak | `branch` | the platforms |
| boomstam | `bough` / `trunk` | fallen log; standing trunk, never climbable |
| liaan | `liana` | always climbable, everywhere, unlike a trunk |
| bes | `little heart` | the collectible |
| struik | `bush` | scenery |
| egel | `hedgehog` | enemy — paces a platform, deadly to touch |
| rots | `boulder` / `rock` | solid, climbable stone |
| kameel | `camel` | ambles slowly; you ride on its humps; harmless |
| krab | `crab` | the beach's walker: scuttles, and runs at you once it has seen you |
| kwal | `jelly` | a mine hanging in the air on the beach; touch kills |
| meeuw | `gull` | the beach's bird: glides along the shore and swoops at you |
| palmboom | `palm` | a climbable trunk on the beach with a crown of fronds you can stand on |
| worm | `worm` | hunts under the sand and lunges out of it at you; the part that is out kills |
| cactus | `cactus` | two tiles tall, deadly from any side |

## The cat

Ginger, so it stays readable against all that green. Two poses:

| Pose | Size | Speed |
| --- | --- | --- |
| Standing | 22 × 18 px | 190 px/s |
| Sneaking | 26 × 9 px | 80 px/s (42%) |

Standing is deliberately taller than one 16px tile, which is what makes a
one-tile gap something you can only get through by sneaking.

Both poses have a walk cycle. The stalk's paws slide past each other a
pixel at a time; because the movement is so small it runs faster than the
walk's (12 fps against 8), or it read as a stutter.

## Nothing can kill you before you move

Every level starts somewhere nothing can reach. Measured by standing perfectly
still for forty-five seconds on each one: the forest and the volcano
put the cat out of everything's way already, and the swamp and the canopy did
not — a hedgehog simply walked into it. Both now start the cat on **a small
boulder**, which a hedgehog turns at and cannot climb.

A player who has not touched the controls yet should not be able to lose.

## Starting, and starting over

The game opens on a **title screen**: a cut from the real forest of level 1,
played with nobody at the controls. The cat sits on the tip of the lowest branch
of the great tree, a hedgehog trundles along the ground below it, piranhas leap
from the puddles either side, and a crow flies by -- across the whole picture
and back, without ever attacking. Two blocks of ground show at the bottom.
**Catnah**, and under it *A Hannah Milatovic Rijkhof Game*. Any key starts it;
on a phone, a tap.

The cut is wider and taller than any one screen needs, so a wider phone or a
taller window just sees more forest instead of a gap. The crow's behaviour is a
property of the level: the title's crow *flies by*, every other level's crow
*attacks* as before.

Bottom right, small, sits the **version**: `v0.1.` followed by the build
number -- on the live game the number of the deploy that built it, going up by
one each time, so a bug report can say which build it was seen in. A build
made on a laptop shows the commit's short hash there instead, so it can never
be mistaken for the live one.

Losing your last heart stops the game **where it stands**. The level stays on
screen, frozen on the frame the cat died on, and all the colour drains out of
it — and then one word in red, which is the only colour left:

> Game Over

It holds for a moment before it will take an input — a death is usually a
keypress, and without the pause the press that killed you also dismisses it.
Any key after that and you are back at the title.

A black screen would say the game stopped. A frozen, colourless one says *where*
it stopped and what stopped it.

**Starting the game goes fullscreen**, and asks for landscape while it is
there. It has to happen on the keypress or the tap itself — a browser only
grants fullscreen from a real gesture — which is why it is the *first* thing
`begin()` does, before the fade. On Android Chrome it is the difference between
a game and a game with the address bar over it. If any of it is refused, the
game starts anyway.

## The screen

The game is drawn at a fixed size and scaled to fill whatever it lands on. The
**height** is the fixed part — a laptop gets 360 game pixels, a phone gets 252,
so on a phone everything is about 1.4x the size and you see less of the level at
once. The **width** is whatever that screen's shape asks for.

That is why there are no black bars: a canvas fixed at 16:9 on a phone that is
20:9 leaves a stripe down each side, and matching the canvas to the screen
leaves nothing to letterbox. A wider phone simply sees a little more of the
level. It works the shape out from the longer side over the shorter one, so it
gets the same answer whichever way the phone was being held when the page
loaded.

Add `?phone` to the URL to see the phone view on a laptop.

**It can be installed.** On a phone, Chrome's "add to home screen" gives you
Catnah as an app: fullscreen, landscape, its own icon, and playable with no
connection. It still updates — the page itself is always fetched fresh when
there is a connection, so opening the installed game after a new version is
pushed gets the new version.

## Moving

| Action | Keyboard | Touch |
| --- | --- | --- |
| Forward / back | `→` `←` or `D` `A` | stick, bottom left |
| Up: climb up / swim up | `↑` or `W` | stick up |
| Down: sneak / climb down / swim down | `↓` or `S` | stick down |
| **Jump** (also off a rope, and the swim stroke) | `↑` or `W` — the same key | button, bottom right |

The left thumb has a four-way **stick**
(left, right, up, down, diagonals too) and the right thumb a jump button. Any
touch in the left 40% of the screen steers, any touch in the right 40% jumps
(both below the top third, where the HUD is), so a drifting thumb is not lost.
Up and down need a bigger push than left and right (`TOUCH` in `config.ts`),
so running with a slightly wandering thumb does not climb.

**On a keyboard, up is the jump — one key.** There is no Space. The game
tells the two apart by where you are and by how you press: on the ground a
press jumps; beside a rope a press takes hold, *holding* climbs, and a
**second press** leaps off (straight up on its own, that way with a
direction); in water holding swims up and a fresh press is a stroke; against
a wall in mid-air a press is a wall jump. On a phone the two stay separate:
the stick pushed up climbs and swims and never jumps, the button jumps.

Add `?touch` to the address to see the touch controls on a laptop; the mouse
acts as a finger. It also shows the phone-sized view.

Wall jumping has no button of its own: in mid-air against a wall, jump does it.

- **Gravity is always on.** Falling speed is capped at 600 px/s so long drops
  stay readable.
- **You steer in the air**, but with less grip than on the ground.
- **Jump height is variable**: a flick of the key gives about 39px and
  holding it gives 86px, with everything in between. Letting go does not stop
  the climb dead — the cat gets heavier and coasts on a little, still rising
  about 30px after a very short tap.
- The jump still fires just after you run off a ledge (coyote time).
- **There is no jump buffer.** A press either jumps or is forgotten; nothing is
  stored for later.
- **Sneaking is blocked from standing up** when there is no headroom, so you
  cannot pop up through a log you are sneaking under, nor jump out from under it.
- **Taking a heart in the air gives you a jump.** Fall or leap through one
  and you can jump again from it, as if it were a step. Hearts placed in open
  air are placed with that in mind.
- **Sneaking takes you under thorns.** Crawl and the points pass over you;
  stand up among them and you die. It is the pose that counts. **Jumping out
  of them is allowed**: crawl in, jump, and on the way up you are safe — but
  coming down into thorns kills, whether you fell from above or are dropping
  back into the patch you jumped from. Lava and the creatures on the ground
  are not fooled by any of it.
- **Sneaking hides you from the crow.** A crow never starts an attack on a
  sneaking cat — something low and slow in the grass is not worth a dive —
  though one already diving does not let you off just for dropping flat. For
  that you need cover: sneak **behind a bush, a reed or into the leaves on a
  branch** and the crow loses you, breaks off and goes back to its circle.
  It is the middle of your body that has to be behind the cover, and you have
  to be sneaking: standing in a bush, your ears and tail are out.

### Standing on things

The **crown of any climbable column** is a ledge — climb a tree and you end up
standing on top of it. So is a **nest**, which is drawn as a bowl of woven straw
because it is somewhere to be rather than something to look at.

Both ledges are one-way, so climbing up the inside of a trunk still passes
through and leaves you standing on the crown.

### Climbing trunks

**A tree cannot be climbed.** Lianas, ropes and chains can; a tree
trunk is a tree. The trunks are still drawn, still walked straight through and
their crowns are still something to stand on — the way *up* a tree is its
branches, which is why every branch in the forest grows out of one. The great
tree is a zigzag of branches four tiles apart, and the nest at the top is a jump
from the last of them.

**A liana is not a tree**, and the two can stand side by side in the same
level: an actual tree, unclimbable, with a liana hanging from nothing right
next to it. A liana looks the same wherever it hangs — jungle, swamp, or
anywhere else — the same way a little heart does, rather than taking on
whatever a rope or chain would have looked like in that place. And
unlike a tree, a liana is **never something to stand on**, not even at the
very top of it — it hangs from nothing, so there is nothing up there to land
on either.

There is a third one: a **dead vine**, the same hanging stem with every leaf
stripped off it. It is scenery only, never something to hold, there purely so
a canopy of trees and lianas is not the only two things hanging in it.

Everything else here is **not solid** — walk straight through a liana at ground
level and nothing happens. Climbing also passes through the branches growing out
of a column, in both directions. Standing inside one, press up and the cat takes
hold instead of jumping, the way standing at the foot of a ladder does. Fall onto
one in mid-air and it catches you: that is the automatic grip, with no button to
hold.

Once attached, the cat stays put with nothing pressed. Up climbs, down descends,
and it stops at the top rather than climbing off into the air. Left and right slide along it, and **jump leaps off** — straight up, or towards
a direction held.

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

From there it is **almost neutrally buoyant**: with nothing pressed it drifts
slowly toward the bottom rather than hanging at a fixed depth forever, and
**up and sneak take it up and down**. Horizontally it moves at about half
speed. A press of up is a stroke, strong enough to break the surface and land
the cat on a bank. Water is somewhere to move about in rather than something
to struggle out of, which is why it is not dangerous.

It has its own picture for it, too — paddling, head tipped up clear of the
surface — where it used to just show the standing cat regardless of the pool
it was in. Walking and climbing got their own looping pictures at the same
time: legs alternating on the ground, paws shuffling up the rope, all three
frozen back to a single still frame the moment nothing is actually moving.

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
overhanging left tower and alternate your way up 224px to the little hearts on top.
One wall alone will not do it — a jump off the floor plus a single wall jump
reaches 172px, and there it stops.


## The look

Pixel art at the game's own scale, drawn in code, and lit by one rule: **a
surface is lit, a mass is dark.** Grass, the lip of earth under it, a cliff
face and the top course of a wall show their texture; a tile or so in,
everything fades to the same near-black, and nothing is drawn where nothing
can be seen. The fade is a distance field over the whole level rather than a
set of tiles, so it works the same in the forest, the cave and the volcano,
and the two numbers that shape it live in `config.ts`.

Turf stands up above the ground in a ragged fringe and droops over its
corners. Earth has stones bedded in its lip. Rock is cobblestone with a mossy
crown. A run of rock cells is drawn as **one boulder** -- rounded, bulging a
pixel past the cells it collides in, cracked -- and a long bank of them as a
pile of unequal ones. Whether a rock is *on* the ground or *in* it is read
off the level: a cluster that touches air is a boulder on the lawn, lit all
through, mossy on top, with the grass running on underneath; one with earth
on every side is a stone in the ground, bare, darkening with the earth
around it. The cells still collide one by one; only the picture is joined.
Where one boulder ends and the next begins is the level's to say: rock comes
in three letters, `R`, `G` and `Q`, identical in every way except that only
cells of one letter join into a rock -- so a change of letter is a seam, and
a bank can be one stone, two side by side, or one stacked on another.

The ground is rounded off wherever it meets air or water. A tile with air on
two adjacent sides has that corner cut round, grass or dark earth following
the curve; an inner corner -- a floor meeting a wall, the bed of a pool
meeting its bank -- is filled with a quarter-disc of earth with grass along
its curve. A pool's surface is drawn three pixels below its bank, so the
grass always stands above the water. Collision is still the square tile:
only the picture bends. Stone shelves in the cave are one rounded slab per
run of cells, lichen on top.

What the ground is made of depends on the place too. Outdoors it is earth
with stones in it. In the cave it is **rock**: one mass, broken into fragments. Seeds are
scattered through the ground, about one per cell, and every pixel of rock
belongs to its nearest seed, so the fragments have edges at whatever angle
the seeds dictate, never along the grid, with a one-pixel fissure where two
meet. Each fragment has its own tone and is bevelled toward the light. At
the air the mass has no edge of its own: fragment by fragment it bulges out
or falls short, and a dark rim runs round the whole silhouette. The course
the cat walks on is simply the top of the rock, with pebbles on it in many
greys, from a speck to a lump; where a floor meets a wall there is dust
heaped in the corner, a rounded speckled heap, and specks of it trailing
out along the floor; a boulder standing on the rock is drawn *behind* it, so the rock's edge
runs over the boulder's foot and it sits in the ground rather than on it,
with a heap of dust against each side and pebbles along its base -- the
way grass runs under a rock in the forest; where a
ceiling meets a wall there is, often, a cobweb -- a few threads from the
corner and strands sagging between them, one pale grey, drawn once and
never moving. Where
water touches the rock it is drawn back the few pixels the rock may bulge.
Drawn pixel by pixel into a few big pictures per level, baked with the rest.

What lies on a surface depends on the place. Where there is sun it is grass;
in the cave, where there is none, it is **dust and pebbles**: a pale worn
band along every ledge with pebbles lying in it, pebbles instead of moss
on the rocks and shelves, and nothing green anywhere. The cave's backdrop
is the inside of a cave: a wall of cobbled stone close behind the tunnels,
with the stalactites and crystals hanging on it, so a passage reads as
carved in front of rock rather than as a hole in nothing.

Trees are drawn the same way. A column of trunk cells is **one trunk**,
wider at the foot than the top, flaring into roots, bark all the way up with
a knot or two. A run of branch cells is **one branch** growing out of its
trunk: thick where it leaves the wood, thinning to a rounded tip, twigs
standing up off it, leaves hanging from its real underside; a run with no
trunk at either end is a fallen bough, even along its length. The top
surface stays flat, because that is what the cat stands on. A run of `B`
cells -- the low overhang you sneak under -- is **one fallen tree**: a trunk
lying down, bark along its length, the grain in rings on the end that broke,
snapped branch stubs standing up off it, moss on top. Like a boulder, it is
a thing lying on the ground, so the dark does not live inside it. Every ground and rock tile comes in three drawings, picked from a
tile's own place in the grid, so a run of floor never repeats in step.

Behind the level, distance is done with tone: the far trees are pale and
flat, the mid trees a little darker with a shadowed underside, both drawn as
silhouettes in one hazy family rather than a brown trunk under a green blob.
Haze lies along the floor between the ranks, and a canopy hangs across the
top of the screen, one seamless strip repeated so it has no joins, thinning
where the sun comes through. Climbable trunks are bark the full
width of their tile.

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
  little hearts on top.
- **Two pools** cut into the forest floor, three tiles deep. Neither has
  anything living in it — that comes later.
- **A shaft** made of two rock towers facing each other across three tiles. The
  left one overhangs, so you walk in underneath it at ground level; getting back
  out means alternating wall jumps between the two faces, quickly enough that
  you never stop rising.
- Little hearts to collect, counted top left, per level.
- **Scenery**: trees in two depth ranks, bushes and grass along the floor.

**Rules today**

- Collecting a little heart increases the counter. Nothing happens at 26 yet.
- Falling into the gap respawns you at the start, with a screen flash.
- Nothing else can hurt you.

## Dying

Anything dangerous kills the cat on contact, and so does falling out of the
world. There is a short pause — a flash and a shake — and then the cat is back
at the start of the level, or at the **last checkpoint** it touched, if any.

You get **three lives**, shown as red hearts in the top right. Each death dims
one, and **little hearts you have already collected stay collected** between them.

Lose the last heart and the whole game starts again from the forest, with three
fresh hearts.

**Lives travel with you** from level to level, which is what makes finding a
spare one worth the detour.

### Spare hearts

A spare heart and a nest are two separate things now, placed separately: a
heart on its own is nothing but a heart, and a heart written directly above a
nest is what makes it read as sitting in one. Nothing about where either goes
is random, and none of them is needed to finish a level.

The forest and the cave each keep one in a proper nest, at the point
that guards it: the crow's nest at the top of the forest's great tree, and the
back of the cave's longest dead end. The
swamp and the canopy have their own now too, guarded the same way. A heart
placed with nothing around it -- in open water, say -- is simply that: a heart,
floating where it is, no nest implied.

Each nested one is **guarded**, which is the point of it: a spare heart is
something you go and take off a bird, or walk a tunnel of spiders for, not
something you pass on the way. **Dying gives it back.** Taking it is not spent
for good — only holding onto it is — so losing the fight it is guarded by and
coming back finds it waiting again rather than gone for the rest of the level.

The cat sits **in** a nest, not on top of one: the floor of a nest is partway
down it, and the near rim is drawn over the cat's legs, so only its head and
shoulders show above the straw. A heart sitting in one floats just above that
rim; one with nothing below it sits lower in its own tile instead, and one
surrounded by water sits centred in it, the way any other floating thing in
the water does.

A hundred little hearts is worth the same as a spare heart, and both follow
one rule. "Full" is not a fixed number — it is the **most you have ever held
this run**, up to a hard ceiling of **seven**:

- Below that watermark, either one fills every spent heart back in, in one go
  — **"Lives Restored"**, grown and dissolved in the middle of the screen.
- At the watermark or above, it raises the watermark and adds one more —
  **"Extra Life!"** A hundred little hearts always says **"100 ❤️ Collection
  Bonus"** instead, whichever of the two it turns out to buy.

One specific count says something extra, the same grow-and-fade: landing on
**exactly "6/7"** -- one heart short of the absolute ceiling, at the
ceiling -- says so out loud. Nothing else does; 2/3, 4/5 and 3/6 are silent.
It is a one-off notice for that moment, not a running readout of the
watermark.

## Checkpoints

A spinning star, gold and blue, flipping through both as if it were turning to
face you. Touch one and dying no longer sends you all the way back to the
start of the level — it sends you here instead. The start of a level already
works this way without one; a checkpoint just moves that point further along.

It stays exactly what it looks like. Touching it again later does nothing new,
and touching an **earlier** one after passing a later one moves the point back
— which is correct if you go back for something you missed.

## How long they are

| Level | Tiles |
| --- | --- |
| Forest | 90 |
| Swamp | 248 |
| Canopy | 78 |
| Cave | 240 wide, 64 deep |
| Volcano | 104 |

Every level is **written out** in its file, row by row.

They were all pulled out to five times their length once, by repeating a
pattern, and every one of them came back. A stretched level is not a longer
level: what they lost was the reason to walk through them. The cave is the one
exception, and it was never stretched — it is long because it was designed long,
as a descent.

## The seven levels

**Beach, desert, forest, canopy, swamp, cave, volcano.** It starts at the sea
and ends in the fire. Each level starts at one end and ends at a **portal**,
which takes you to the next: the beach runs out into the desert, the desert
into the forest, the cave is the descent into the volcano, and the volcano's
portal — which only appears once the beetle is dead — ends the game, so the
beetle is the finale. Little hearts are optional everywhere.

### 2 — Desert

Up from the beach into the open: sand and sandstone under a
white sun, pyramids on the skyline, heat shimmering along their feet. Flat
going, mostly, with low dunes of stacked sand to climb and a few sandstone
shelves to jump between. Nothing here hunts you, and nothing walks the sand
but **camels**, which hurt nobody: jump on one's back and it carries you
along, slowly, as it ambles. What kills is standing still in the wrong place:

- **Worms** live under the sand, each with a mound for a hole. Now and
  then one **comes up out of its hole without warning** to look about, and
  goes back down. If you are within range on the sand when it does, it has
  seen you: it leans your way and watches you while it is up, and once it is
  back under, it **hunts**
  you: it crawls under the sand toward you, hole and all — the mound moves,
  rippling along the sand (slower than you run, so you can outrun it; it
  closes when you stop), as far as the sand goes — rocks, walls, cacti and
  drops stop it — and sand kicks up where it goes, so you can see it coming.
  Close enough, **the ground churns**, sand thrown up around
  the very spot it will come out of: a little warning, long enough to turn
  and run clear even when it is right under you. Then it
  **lunges** out of the sand *at* you, leaning your way and following you as
  it comes, snaps, and sinks back in wherever it is. Step away while the
  ground ruffles and it lets you go. After a lunge it needs a moment under
  the sand before the next — that is the gap to run through. Walk away far
  enough and it crawls back to its hole and forgets you. The part that is
  out kills, the look included. **Worms are afraid of camels**: with one near, a worm stays
  under the sand, and one that is up ducks back down — so a camel's back is
  the safe way over the sand.
- **Landing on a camel always sticks.** Come down anywhere on its back, from
  any height, and you stand on it; jump off whenever you like.
- **Cacti**, two tiles tall, kill from any side, in any pose — there is no
  crawling under a cactus and no jumping out of one.
- A few **rocks** to climb and wall-jump off.

### 1 — Beach

Where the game begins: a strip of pale sand with the sea behind it,
swells far out with a couple of sailboats slipping across them, lighter water
nearer in, and foam creeping up the sand just behind where you walk. The map is **nearly empty for now** — one of each
thing the beach has, so each can be looked at on its own:

- **Crabs** scuttle along the sand, quicker than a hedgehog, and once one
  has seen you — near, and on its level — it comes straight at you, stopping
  only at an edge or a wall. The hedgehog's letter, on the beach.
- **Jellyfish** lie washed up on the sand, pulsing: mines. Touch one from
  any side and it kills.
- **Gulls** glide along the shore at their own height and, when you are
  ahead of one and near enough, swoop: a dive to chest height along a line
  it picks when it breaks off, skimming past where you were, and a climb out
  ahead. It does not follow you down the line, so **duck** — a sneaking cat
  is under it — or be somewhere else. The crow's letter, on the beach.
- **Palms** are trunks you can climb, ringed with the scars of old fronds,
  with a crown on top and a place to stand up there. They come in two
  sizes: a thin one, and a **big** one — twice as wide, a thicker trunk and
  a crown of fronds reaching well out either side and drooping below the
  top — which is written as two columns side by side. Some of the fronds
  hang in front of you: at the top of a palm you climb and jump in among
  the leaves, not on top of a picture of them.
- **Sand castles**: the beach's rock is sand. Build one from `R` cells and
  it comes out as one castle of pressed sand — not a grid of blocks — with
  battlements along the top, a little red flag on each tower (a top edge two
  or more blocks wide), and an arched gate wherever `Q` is written. The gate
  is a picture: the castle is a wall all the way, and climbs and wall-jumps
  like rock.

### Cacti come tall

A column of cactus cells in the map is one tall cactus, drawn as one with an
arm every so often, and deadly along its whole height — the desert has a
three-high one.

## Winning, and the score

Walk into the volcano's portal and the sunlit forest comes up out of the
black with **"You actually won!"** in gold over it, your **time** under
that, and how often you died. The time is the score, and lower is better:
every second you spend in a level counts, from the moment it starts until the
moment you leave it, and **every death adds a minute, at once** — the clock
jumps and flushes red. At the end it reads, say, `Time 7:12`, and beneath it
`5:12 played · died 2 times (+2:00)` — or `never died!`. The
same clock runs **top left during play**, over the level name, and jumps by
a minute when you die; the little-heart count sits top right under the lives,
beside the mute button. It carries from level to level and
survives a hot reload; it does not run on the title screen or while the game
is paused. Any key on the victory screen takes you back to the title.

A level may have **more than one portal**; every one leads on to the next
level, and none is special. The portal is a **wormhole**: a round picture two tiles across, a blue
spiral of light curling into a black centre, its rim fading out. It sits *in* the
world: in front of the backdrop — the cave wall, the sky, the leaves behind
the trees — and behind everything you stand on, so the ground and the rocks
cut across its foot. It spins, slowly, and swells and shrinks a little as it
spins — always round. Its foot is sunk into the ground. The cat is drawn in
front of it, so you see it being pulled in, and as it goes the portal fades
out with it. It is **entered, not touched**: nothing happens
until the cat's middle is inside the hole, so brushing past the rim does
nothing and neither does a jump that clears it. A jump *through* it counts.
The moment the cat is in, it stops dead — no more steering, no gravity — and
is drawn into the centre, shrinking and fading, while the world and the
level name fade to black under the hearts, which stay. The next level comes
up out of black with a portal standing where you appear — there from the
first frame, while the world is still dark — that fades away as you take your
first steps. From that moment nothing can hurt it: a hedgehog arriving a step
behind, or lava a tile away, no longer costs a heart.

The cave comes second to last rather than second. It is the descent, and what it
descends into is the volcano, so it has to be the thing you do immediately
before arriving there.

While developing, **Ctrl-clicking the level name** goes to the next level and
**Cmd-clicking** goes back one, both wrapping round. Neither is in the built
game.

**Every portal always opens.** Nothing in a level has to be collected to leave it.






### 3 — Forest

90 tiles. Every branch grows from a trunk here, and the parser holds the level
to it. Trees to climb by their branches, boulders to wall-jump between, a pool
with a piranha in it, hedgehogs on the floor, and near the end **the great
tree** — with the crow's nest at the top of it and the spare heart in the nest.

### 5 — Swamp

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

**The banks cost something too.** Nothing walks them — a hedgehog trundling into
a crossing is an interruption rather than a danger — but a swamp of nothing but
crocodiles and piranhas is one idea eight times over, so the dry ground is no
longer a rest. None of what is on it is another set of teeth:

- **Thorns**, in patches of two, on four of the banks. You jump them, which
  means landing off a crossing and setting up another jump straight away.
- **Low boughs** over two banks. A standing cat is 18 pixels and the gap under
  one is 16, so you go under it sneaking or over it jumping — and one of them
  has that bank's hearts beneath it.
- **A boulder block** at the lip of the fifth bank, two tiles high and not to be
  walked round. The crossing after it is taken from the top of it, two tiles
  higher than every other crossing in the level.
- **Crows**, over two of the liana crossings. A bird coming at you while you
  hang over piranhas is the most dangerous thing here, and the only one that
  comes looking for you. It does not look for a sneaking cat, and it loses one
  that sneaks into the leaves.

The lianas here are five tiles long, hang low over the water and **hang from
nothing**. That is on purpose: all you can do with one is cross, there is no
climbing up out of the level on them, and the swamp has sky overhead rather than
a roof.
### 4 — Canopy

78 tiles and one idea all the way through: **jumping off a liana onto a platform
out of its reach**. The lianas hang from the roof rather than standing on the
floor, and every platform is far too high to be reached from the ground — the
best jump from down there falls 138px short — so there is no way through that
does not involve letting go in mid-air.

In the middle, **five lianas hang side by side**: holding on is not pinned to
one rope, so that stretch is crossed sideways as much as it is climbed.

### 6 — Cave

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
be a trap, one you climb into is a decision. Three of them are worth little hearts.

The fourth runs back over the top of the level for thirty tiles and ends in a
chamber with the **spare heart** in it — and hanging over the doorway, a spider
**ten times the size** of the others, a third of the screen across. It walks the
ceiling like the rest of them and drops like the rest of them, slowly, and there
is no getting past it except by timing it.

### 7 — Volcano

The floor is a **lava lake** and only the islands are safe, so the level reads
as somewhere not to land rather than somewhere to walk. Chains hang over the
gaps where there is nothing living left to climb, bolted to rings in the roof of
nothing.

Lava is shaped exactly like water and behaves nothing like it: not solid, and
**fatal to touch**. And unlike water it does not sit in its basin: the surface
**stands three pixels proud of the land** beside it, heaped up under a domed
crust, and **spills over the edges** — a tongue of lava lies on every ground
tile that borders the lake. The line that kills is the line you see: the
crust burns to within a pixel of the bank, so a cat with a toe over the edge
of an island is dead — quick, and the point of a lava level. It is
also alive, and **each lake is drawn as one thing**, the way a run of rock
is one boulder — not a repeat of tiles: a crust that heaps up across the
whole width, plates of dark skin drifting along it with white-hot cracks
between them, cooled lumps riding the rim, bubbles swelling and bursting
where the lake decides, and below the surface long **veins of hot lava**
wandering through dark cooled plates. Eight frames, and lakes out of step
with each other. **Heat stands over it** in soft columns that breathe and
sway, with **wisps** lifting off and thinning away; and every half-second or
so a **gobbet jumps out** of a random spot, arcs, and falls back in. None of that is a new way to die — touching lava already kills. It
is there so the lake looks like something that would.

Behind it all, **three ranks of mountains** on a sky that goes from black
overhead to deep red at a hot horizon: far ones wide, low and hazy, near ones
tall and dark, each with a jagged ridge, lit red from below as if by the lava
at its feet, a glowing crater at the summit, and — on the near ones — thin
streams of lava creeping down the slopes to a pool at the foot. Smoke stands
over the near craters, ash falls through the whole level, and embers rise.
The ground is basalt with a crust of ash and cinder; nothing grows here.

The level ends at the **volcano itself**: a cone of rock with a crater notch at
the top and a mouth at ground level. Walk in through the mouth and you are in an
enclosed **arena** — walls all round, the cone's slope for a ceiling.

Nothing walks the lava fields — no hedgehogs down here. The only living thing
in this level is what waits at the end of it.

Inside waits the **evil lord beetle**, a ladybird with the sweetness taken out,
three times the cat in every direction. It does not patrol and hope you walk
under it. It **hunts you**:

- When you come near it **stalks**: hangs a little way off to the side and
  above your head, wings buzzing, for as long as its patience lasts.
- Then it **charges**: it locks where you are *at that instant* and
  accelerates at that spot in a straight line — not tracking, so moving
  early means it goes past you, and standing still means it hits. It carries
  on a little past the spot, brakes, picks a new spot near you, and comes
  again.
- It **gets angrier**: every charge shortens the next wait, from about a
  second towards half of one. Walking out of the arena cools it off.
- It **flies, but not through rock**: a charge into the arena's wall ends
  there.
- **The four spots on its back are its lives.** Every time it hits thorns it
  loses one — thrown back, squealing, flashing red — and with the last one
  gone it falls out of the sky and is gone. The back is the health bar; there
  is no other. A charge is a straight line at where you *were*, so stand with
  thorns behind you and step aside.

It is the one thing in the game that can be beaten, and the one way to do it
is to make it hurt itself. Or just get past: every charge is a moment it is
not between you and the door.

**The way out only appears once it is dead.** There is no portal in the
arena until the beetle has fallen; then it comes up out of nothing at the far
end, with the checkpoint's two notes. The fight is not optional.

## Sound

Quiet, and all of it made in code — there are no audio files any more than there
are image files. A **speaker button** sits top right, just under the hearts,
and `M` does the same thing; the setting is remembered between visits.

**Three taps, not two.** One press cycles silent → effects only → everything →
silent again, so the bed (wind and that hum) can be turned off on its own
while the cat's own sounds — jumping, collecting, getting hurt — keep playing.

**Every place has a bed**: one continuous layer under everything, filtered noise
with a slow swell on it. Wind in the forest, the jungle and the swamp; a low
rumble in the volcano — with, under the noise, a drone of two deep sines a hair
apart beating against each other, surging on its own slow clock, the sound
a mountain makes; and in the cave a hush, which is the sound of a big room
with nobody in it. Over the top, sparsely and never on a beat: **birds** in the
forest and the jungle, **drips** in the cave.

- **The cat** blips going up, and a wall jump is sharper than a plain jump.
- **The crow** caws once, as it breaks off its circle to come at you. Calling
  the whole way in would be an alarm rather than a bird.
- **The lava** bloops every time it throws a gobbet.
- **The beetle** growls as it commits to a dive: two saws a few cents apart,
  beating against each other.
- **A rat's feet** make a dry scurry, and only while it is actually moving.
- **A hedgehog eats** — see below.
- **A rat leaping at you** is the loudest thing in the game, and deliberately:
  everything else sits under the game and that one comes out of it.
- **Losing your last heart** is three notes falling away. It is the only sound
  here allowed to be a tune, because it is the only moment allowed to be an
  ending.
- Collecting a little heart chimes; losing one does not.

**Switch away and everything stops.** Take a call, answer a message, put the
phone in your pocket, and the game freezes exactly where it stood and goes
silent. Come back and it carries on from there. It matters most on a phone,
where the screen going away does not stop the sound on its own -- that is how
you end up with wind and a growling beetle coming out of your pocket.

## Leaves in front of you and behind you

The levels are built on a grid and always will be — that is what the jumps are
measured in. What makes them *look* like a grid is that every edge falls on the
same sixteen pixels, so the leaves are the one thing that ignores it: clumps
wider than a tile, dropped at offsets nothing else agrees with.

They come in two layers. **Behind**, a full canopy — deliberately overdone, so a
tree is a mass of dark leaves with wood standing in front of it rather than a
pole with shelves on it. Every clump of it is placed from a **branch** or from
the crown, never from the trunk, because that is where a tree actually carries
its leaves: the canopy sits on the branches and the bare trunk runs up into it
from the ground. And **in
front of you**, growing up off the branches: walk into one and you are hidden to
the shoulders, with your ears and your tail still out. Sneak into one and you
are hidden from the crow (see *Moving*). It hides nothing else — the hearts
are drawn in front of the leaves, and the creatures that walk the floor are
behind them — but a cat sitting in the foliage looks like a cat in a tree
rather than a cat on a shelf.

For now only where a place actually has leaves: the forest, the jungle and the
swamp. A cave shelf is the same tile as a branch underneath and does not sprout.

## Thorns

Reeds, stalagmites, a spiked railing — one shape in three materials, dark with a
pale point, and the only thing in the game that kills you without being alive or
being a liquid. What kills is smaller than the tile it stands in: the spikes are
nine to fifteen pixels of sixteen and the rest is air, so clearing the points is
clearing them, and brushing the edge of the tile on the way past is not a death.

**A sneaking cat crawls under them.** Standing or walking in thorns kills, and
so does falling into them; low on your belly you pass, and from your belly you
may jump: on the way up you are safe, on the way down you are not. This is the
one hazard sneaking gets you past -- a stalk is worth something, not only a
way through a gap. And it
looks like it: of the four spikes in a tile, the first and third are drawn
behind the cat and the second and fourth in front, so a crawling cat threads
between them rather than sliding across a picture of them.

## Everything sleeps until you get there

Nothing in a level is doing anything until you are within a screen and a half of
it. A rat at the far end of a level is not pacing, a crow is not circling, a
piranha is not patrolling — and none of them is making any noise.

The distance is the point of it. Half a screen of it is the screen you are
looking at, so everything starts moving a **full screen before it can be seen**:
you never catch something standing still and then watch it decide to walk.

Being *heard* stops sooner than that, at one screen, because the two are not the
same question. Sound here is not positional — a rat scurrying at the other end
of a hundred-and-seventy-tile level is exactly as loud as one beside you — so
before this, a level full of rats sounded like every rat in it at once.

The lava is not a creature. It is the place, and it carries
on whether or not anybody is looking.

## The creatures

- **Hedgehogs** pace the floor, turning at anything solid, at the edge of a
  drop, and at the edge of the level, so they never fall off. They keep to plain
  ground: never on platforms, never on boulders, never in water. They are slow,
  and cannot be defeated — touching one is fatal from any direction.
  **They hide behind bushes** (and the swamp's reeds), in every level: for a
  moment you cannot see them, so you have to remember where they were. Trees
  and rocks never hide them.
- **Rats are afraid of you.** They pace like anything else until the cat comes
  close, then turn and **run** — half again as fast as they walk. And when a
  running rat meets a wall or the end of its ledge, it stops, holds for a
  quarter of a second, and **leaps at your face**. It is the only attack in the
  game that comes from something trying to get away, and the only sound in the
  game meant to make you jump. Measured: cornered against a wall, the leap
  carries it fifty pixels and lands it exactly where the cat is standing.
  No level has a rat at the moment, but the creature and its `r` are kept.
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
