# Questions

Everything in the backlog is built. That meant answering a pile of open
questions without you, so here is every call I made and why — and the ones I
think are actually still open.

Change any of these and I will rebuild around it; none is baked in deep.

---

## Dying

**Three lives**, shown as hearts. Each death spends one; losing all three
restarts the level.

**They carry between levels, and losing the last one restarts the whole game**
from the forest. You asked for both, and they belong together: lives that reset
each level would make the spare hearts pointless, and spare hearts are what make
the stakes bearable.

It does mean a run has real stakes now — losing the last heart in the volcano
costs everything. That is the usual arrangement for this kind of game, and it is
also the one that can cost a long session.

> **Still open:** worth watching whether that lands as tension or as
> frustration. A checkpoint at the level you reached would soften it without
> giving up the stakes.

**No checkpoints.** The levels are a couple of minutes long, so a death costs
the walk back rather than real progress. If they grow, this is the first thing
that will need revisiting.

**Little hearts stay collected through a death**, so dying never undoes work — but
running out of lives does reset them, since the level itself starts over.

> **Still open:** should the little heart count carry between levels, or is each level
> scored on its own? It resets at the moment, and there is no total.

## Hedgehogs

**Cannot be defeated — confirmed.** No jumping on them, no way past; contact
kills from any direction.

**Sneaking does not affect the environment — confirmed.** It is about fitting
through gaps, not about stealth.

**They keep to plain floor**, and the parser refuses a level that puts one on a
platform, on a boulder or in water. **Rats replace them in the city**: same
behaviour, nearly twice the speed.

**Much slower than the cat** — 42 px/s against 190. They are obstacles to time,
not chases.

## Piranhas

**Fixed rhythm**, one leap every 2.2 seconds, the same in every pool. A hazard
whose timing cannot be learnt is just bad luck.

**They lurk below the surface** between leaps rather than waiting at it, so a
pool looks empty until it moves.

**Only one pool per level has one.** That was your rule, and it only means
something if the empty pools are genuinely safe — so water on its own is
harmless everywhere.

## The crow

**Attacks on distance from its nest, not from itself.** Come within 150px of the
nest and it launches; it gives up at 230px, so hovering on the edge of the range
does not make it flicker. In practice that means it only bothers you up in the
tree, and it ignores the cat crossing the ground far below.

**It cannot be defeated, and the nest is not a goal** — there is nothing in it.

**It steers rather than points**, turning its velocity gradually, so it banks
and overshoots instead of tracking like a missile. That is what makes it
possible to dodge.

**Settled: the nest holds a spare heart.** That is the whole point of a nest
now — a spare heart is only ever found in one, and only ever behind a crow.

**The top of the great tree was a death trap, and is not any more.** Being able
to stand on a crown and in a nest is what fixed it: the cat now has a floor to
dodge on instead of hanging off a trunk at 95px/s.

**The crow is back to its first, fiercest version** (150px notice, 230px give-up,
180px/s dive), because what it guards changed. It was softened once when it stood
between the player and something the level *required*; a spare heart is optional,
so the crow is allowed to be as unpleasant as it likes. Climbing the last stretch
and taking the heart is now a real fight rather than a formality.

> **Still open:** is an optional prize that most players will fail to take worth
> building? It could be that nobody ever gets a fourth heart.

**The old note, kept because the shape of the problem is still worth knowing:** Measured: the cat can
climb the whole 384px trunk, and the crow catches it at the very top every time.
There is nothing up there to reach and no way to survive arriving, so at the
moment the tree is something to admire rather than to climb.

That is a straight consequence of the crow being undefeatable and the nest being
empty. Whatever the answer to the question above is, it probably settles this
one too — a prize worth the climb needs a way to survive taking it, whether that
is a slower crow, a place to shelter, or being able to fight back.

## The cave

**A separate level, reached through a door**, not a hole you fall into from the
forest. Levels are independent grids, which is what made three of them cheap.

**Darkness is not a mechanic.** It is dark to look at, but the view is not
limited and there is nothing to light. A real "you can only see so far"
mechanic is a much bigger job and would change how the level must be designed.

**It reuses the forest's creatures.** Hedgehogs underground are a stretch, and
there is no cave-specific creature at all.

**It is now caving rather than merely dark**: ropes bolted to the roof to climb,
bedded rock shelves, stalagmites as well as stalactites.

**It is a tunnel network now**, carved out of solid rock: uneven floors, roofs
over everything, branches, and dead ends that only hold little hearts. One passage is
a single tile high and only a sneaking cat fits.

> **Still open:** it has no creature of its own and still borrows hedgehogs.
> Bats, or something blind and crawling, would fix that. Parked, as you said.

> **Still open:** the tunnels are hand-carved, so the layout is mine rather than
> designed. It holds together and the exit is reachable, but it is a first pass
> and worth playing before it is called done.

## The city

**Night, with both streets and rooftops.** Branches became steel girders,
trunks became drainpipes, the pool became a canal, and the buildings are brick.

**Rats live here**, not hedgehogs. It still borrows the crow.

**Parked cars, lampposts and drainpipes** are all climbable or standable, so the
street furniture is part of the level rather than scenery.

> **Still open:** moving traffic. Everything in the city stands still, and a car
> that actually drives would be a hazard unlike any other in the game.

## Level structure

**Three levels, played in order, looping.** A glowing door at the far right of
each ends it. Finishing the city returns you to the forest.

> **Settled:** the last level's portal leads to the victory screen -- see
> "Winning, and the score" at the end of this file.

**Reaching the door is the only goal.** Little hearts are optional; nothing requires
collecting them, and nothing happens when you get them all.

> **Still open:** should the door need all the little hearts, or a minimum number?

## Rules that turned out to be forest-only

**"Every branch grows from a trunk" now applies to the forest alone.** The
parser still enforces it there and would refuse a floating branch. The cave's
stone shelves and the city's girders stand on their own, because neither place
has trees.

I think that is what you meant — the rule was about a forest making sense — but
it is a rule you gave me and I narrowed it, so it is worth saying plainly.

## Things I would like your eye on

**The shaft entrance reads as a floating rock.** Two towers standing on the
ground cannot be walked between, so the left one stops short of the floor and
you walk in underneath. It works, but it looks like a mistake.

**The wall slide no longer leads anywhere.** Since a wall jump needs you to be
rising, and sliding means falling, the slide is only a soft way down now. It
could be given back its old job, or dropped.

**Every level is the same shape** — start on the left, door on the right, ground
along the bottom. Nothing is built around climbing yet, even though the camera
now follows upward and the great tree is 384px tall.

## One bug worth knowing about

The sky was never drawn. `fillGradientStyle` renders fine to the screen but
bakes to a fully transparent texture, so every sky in the game was invisible and
what you were seeing was the canvas clear colour behind it. The forest sky now
actually appears, which means level 1 looks slightly different from every
screenshot before today.


---

## The swamp

**Built as level 2**, between the forest and the cave, because a swamp sits next
to a forest and the two read well in sequence.

**Nothing grew where it stands**, so its logs are not attached to anything — the
forest's "every branch grows from a trunk" rule is off here, as it is in the
cave and the city.

**Nothing has to be collected here** — nor anywhere else. Every door in the game
always opens; the only optional prizes are the two spare hearts, in the forest
and the city.

> **Still open:** the lianas hang from the top of the screen with nothing
> holding them up, because there is no ceiling to anchor them to. It works, but
> a canopy to hang them from would look less like they start in mid-air.


---

## Controls changed

**`↑` no longer jumps; `Space` does, and `↑` climbs.** Jump and climb had been
the same button, which meant you could never jump off a rope or a liana — the
press that should have launched you just kept climbing.

Worth flagging because an up arrow that does not jump is not what a player
expects from a platformer, and a child especially will try it first. The
alternative is a dedicated grab button, which is a button more to hold.

> **Settled, later:** Space is gone and `↑` is the jump again -- see "No
> Space: up is the jump" at the end of this file for how one key does both.


## The canopy level

**Added as a new first level**, ahead of the forest, and nothing else moved.

**It is a single idea rather than a place**: liana, jump, platform, repeated
four times with a hedgehog on the floor. There is no water, no prize and no
second route. That suits teaching the move but makes it thinner than the levels
after it.

> **Still open:** it uses the forest's backdrop with a jungle palette, because a
> canopy is a forest seen from underneath. If it should look distinct, it needs
> scenery of its own.

> **Still open:** as the *first* level it is also the hardest opening the game
> could have — it demands climbing and a committed jump before it has taught
> either. It might want an easier first stretch in front of it.


## Jumping straight up a rope

Holding climb and jumping repeatedly **re-grabs the rope** and gains height
faster than climbing does. Measured: 153px from one jump instead of 86.

Left as it is, because it only happens while climb is held and it is a
reasonable reading of what the player is asking for. But it is the one place
where the cat still sticks to a rope, so worth knowing about.

> **Still open:** should a jump off a rope refuse to re-grab until the player
> lets go of climb? It would stop that, at the cost of not grabbing a rope you
> walk into while already holding climb.


## The volcano

**Lava kills on touch.** You did not say, but a volcano whose lava is safe is
not a volcano, and it costs nothing: it reuses the same death the enemies use.

**It is shaped exactly like water and behaves nothing like it** — not solid, so
you fall in rather than being stopped by it. That is deliberate: being stopped
by lava would be stranger than dying in it.

**Chains instead of ropes or vines**, since nothing grows here.

> **Still open:** it is the last level and the hardest-looking, but mechanically
> it is the simplest — islands, gaps, chains. It has no idea of its own the way
> the canopy has the liana jump or the cave has its tunnels.

> **Still open:** the lava lake is flat and static. Rising lava, or a level that
> floods as you climb, is the obvious thing a volcano wants and is a much bigger
> job.


## The level-skip shortcut

**Enabled whenever the dev server is serving, not strictly on localhost.** You
said localhost; I used `import.meta.env.DEV`, which is true for the dev server
however you reach it, and false in a built game.

That is a wider net than you asked for, and deliberately: it means the shortcut
also works on a phone pointed at the dev server over the network, which is where
skipping ahead is most wanted — walking five levels on a touchscreen to reach
the sixth is not a good use of an evening. It is also the safer of the two
checks, because a hostname test would still ship the code.

> Say the word and it narrows to `location.hostname === 'localhost'`.


## The boss

**It cannot be beaten, only got past.** Nothing in this game can be defeated, so
giving the boss a health bar would have meant inventing combat for one fight.
Instead it is a pattern: sweep, line up directly overhead, drop.

**The line-up is the whole warning**, and it is deliberately slower than the
drop. A fast one is not a pattern, it is a coin toss.

**It cannot pass through rock.** It flies, and it used to fly through the
arena's walls and roof when its sweep or its rise took it there. It has a
collider against the level's blocks now, like the walkers; its steering sets a
velocity every frame, so a wall simply holds it where it presses until it
wants to go elsewhere.

**It holds station above the arena's own floor.** Its guard height came from
the level's `groundLine`; with the arena's floor on another row -- which the
rebuilt volcano has -- the beetle came down to a floor that was not there and
sat in the rock, and with the collider, against it. The floor is now the first
solid straight below the `X`, whatever row the arena is on.

Two things the testing forced, both worth knowing:

- **It needs a floor to fight on.** The arena was four-tile islands at first,
  and since the beetle is 56px wide, the only way out of its path was into the
  lava. It has one long floor now.
- **A diagonal dive was useless.** It reached its depth before it reached the
  cat, so a cat that simply stood still was never hit. Lining up first fixed
  both that and the readability.

**It waits before its first attack.** Arriving restarts its count with a grace
period on top, so it can never already be half wound up when you walk in.
Measured at 4.8 seconds from entering the arena to the first drop, the same
three times running.

**The arena is inside the volcano now** — a cone with a mouth at ground level
and an enclosed chamber behind it, rather than a stretch of open ground.

Measured: standing still dies in about three seconds; running to the far end of
the arena each time it commits survives six drops over thirty seconds untouched.

> **Still open:** there is no sense of progress in the fight and no reward for
> surviving it — you simply walk out. A boss usually wants one or the other.

## Crocodiles, and the swamp rebuilt around them

**A crocodile is harmless from above and fatal from the water.** That rule was
not given and it is the one everything else hangs off: the back is a floor, the
water beside it is not. It also means a sinking crocodile eventually kills the
cat standing on it, which is what turns "keep moving" from advice into a rule.

> **Still open:** the submerged ones bite too. It makes a missed jump expensive
> — you land in the water on top of the thing that just went under — and it may
> be one punishment too many.

**Fourteen crocodiles, twenty piranhas, thirteen lianas, 248 tiles.** The level
was allowed to grow five times longer and grew to a bit over three. Eight
crossings felt like the point at which the alternation stops teaching and starts
repeating; two more of each would have been more of the same.

**Gaps run 5 to 7 tiles.** Measured: a jump from a standstill carries 119px and
one with a run-up about 130px, and a crocodile's back is 38px wide. A 7-tile gap
(112px) is a real jump from a back you have no room to run along, which is the
intent — but it is close to the ceiling of what the cat can do, and the last two
crossings are all 7s.

**The lianas hang from nothing.** Asked for: only the bottom of a liana should
be usable, so the cat can never climb to a roof, and no roof should ever be
visible. Implemented as a five-tile liana hanging low over the water with
nothing above it at all, rather than a long rope with a dead upper half.

> **Still open:** a rope that visibly continues up out of the frame would
> explain what it is hanging from without putting a ceiling in the level. That
> needs a decorative column that is drawn but not climbable, which does not
> exist yet.

**The crossings were measured, not assumed.** Confirmed in the browser: the cat
gets over the first crocodile water and the first liana water — bank, liana,
liana, far bank — and dies in the water beside a crocodile but not in open water
that has none.

## The cave, rebuilt as a descent

**The cave moved to fifth and became the only vertical level.** Asked for: the
idea of going deeper and deeper, and the cave as the level before the volcano.
Everything else follows from putting those two together — you descend into the
earth and come out where the earth is on fire, so the cave had to stop being a
corridor and start being a shaft.

**Eight chambers, and the holes alternate ends.** Otherwise the level plays
itself: one hole under another is a single fall from top to bottom. Alternating
makes each chamber a crossing, which is where the puzzle jumps live.

**Three rows of floor between chambers.** The old cave's water hung in mid-air
with open space under it. A thicker floor means a pool or a pit can be sunk into
it and still have rock underneath, which is what a cave actually is.

> **Still open:** you can never climb back up to the chamber above. Nothing
> needs you to, and every dead end is on the level it branches from — but a
> player who misses a little heart has no way back to it.

**Measured, not assumed.** The wall in the second chamber is clearable with a
straight jump. The towers in the fourth are six rows (96px) against a 90px jump,
so the shaft between them has to be wall-jumped — confirmed the cat gets above
them. The sump is swum under and climbed out of. The squeeze is crawled. The
spawn survives forty-five seconds of standing still.

**The cave's creature is the spider, and only the spider.** No hedgehogs down
there any more. The cave had nothing of its own before, which was an open
question in this file; it does now, and a ceiling that has to be watched is a
different kind of attention from a floor that has to be watched.

**A third spare heart.** There were two, deliberately, and this adds one. It is
in the longest dead end, which is what was asked for, and it is guarded by two
spiders rather than by a crow.

**The spider was drawn three times.** Two attempts at generating eight legs from
a loop produced a solid block either side of the body. At 16px what makes a
spider read is the *gaps* between the legs, so they are placed pixel by pixel.

## The city, rebuilt at the cat's scale

**Buildings block the pavement, so every one has a pipe on both sides.** The
first version put a drainpipe on whichever side looked right, and a bot walking
right got exactly seven tiles before a six-storey wall stopped it. A building is
not scenery here: it is the obstacle, and the route is pipe up, roof across,
pipe down.

> **Still open:** that is nine climbs over 176 tiles, one every twenty or so.
> It gives the level a rhythm; it may also turn out to be the same puzzle nine
> times. Ground-floor passages through some of them would break it up.

**A car is two tiles tall and five long now**, with the cabin over the middle
three, and each tile works out which part of the car it is from its neighbours
alone. The old one was one tile tall -- shorter than the cat climbing on it --
and drawn as a slab with a window painted on.

**A drainpipe is told from a lamppost by what is beside it.** A column with a
wall on either side gets a gutter hopper; one standing in the open gets a lamp.
Nothing else about them differs.

## You cannot climb a tree

Asked for, and the forest survives it. The great tree's branches are four tiles
apart, which is 64px against a 90px jump, and they alternate sides of the trunk
-- so the climb that used to be holding up against a trunk is now a zigzag of
five jumps. Measured: every hop lands, and the last one reaches the nest.

It is a per-level switch rather than a per-theme one, because it is a statement
about trees and the forest is the only level that has any. The trunks are still
drawn, still walked through, and their crowns are still something to stand on.

> **Still open:** nothing in the game says a tree cannot be climbed until you
> try. A cat that visibly fails to grip would say it; at the moment the trunk
> just does nothing.

## What the cat collects, and what the cars look like

**Little hearts.** The collectible was a berry, and a cat does not pick fruit. It is
now a little fish: pale blue with an orange tail, twelve pixels by eight, drawn
deliberately unlike the piranha, which is dark and angular and all teeth. The
name changed everywhere too rather than leaving a berry-shaped hole in the code
with a fish drawn over it.

**It took two goes.** The first one had a two-pixel eye and a gill line, and at
this size that reads as a *face* rather than as a fish. One pixel of eye, no
gill, and a notched fork for a tail instead of a solid wedge -- a triangle reads
as an arrow.

**The cars were a slab with a window painted on.** They now have a bonnet that
drops away, a raked windscreen, a B-pillar between two side windows, a chrome
rubbing strip the length of the car, wheels with hubs sat in their arches, a
headlight, a tail light, a number plate and a shadow on the road.

> **Still open:** every car in the game is the same car. A second body colour
> per level, or per car, would cost one number.

## Hiding from the crow

**Used to be only a picture:** the leaves hid the cat from you, not from the
game. Now it is a rule, for the one creature that hunts by sight. You asked
for the crow to stop attacking when you sneak, best of all behind bushes or
leaves; I split that in two, so the cover means something:

- **A sneaking cat is never attacked.** The crow does not start a dive at
  something low and slow. A dive already under way goes on, though -- going
  flat in the open does not shake it off.
- **A sneaking cat behind cover is lost.** Behind a bush, a reed or in the
  leaves on a branch, the crow breaks off and returns to its circle. Cover is
  the rectangle of the picture, and it is the middle of the cat's body that
  has to be inside it; standing up in a bush does not count, the ears and the
  tail are out.

Nothing else hunts by sight, so nothing else changed: hedgehogs, piranhas,
spiders and the beetle are as deadly to a sneaking cat as before.

**Bushes are drawn in front of the cat now** (depth 0.5; they were behind it
at -0.3), at your word, so the cat walks behind them and a cat sneaking
behind one is out of sight as well as out of the crow's. Hedgehogs still hide
behind them; hearts still draw in front.

**Where this actually comes up:** only the forest's great tree has cover
within a crow's attack range (150px of the nest) -- the leaves on the branches
around the nest. The swamp's eight crows have no reeds or leaves closer than
160px to any nest, so there a sneaking cat is simply never attacked, and one
already being dived at has to get out of range. Worth knowing when placing
the next crow.

> **Still open:** whether sneaking in the open should also shake off a dive.
> It would make sneaking a panic button; as it stands you have to reach cover.

## How far away a creature stops living

A screen and a half for moving, one screen for being heard.

Two numbers rather than one because they pull apart: wake something too late and
you see it standing still and then start; let something be heard too far and a
long level is a wall of noise. A screen and a half means a full screen of margin
outside the frame, which is what makes the first of those impossible.

Chose to leave the **lava and the rain running everywhere**, because they are
the place rather than things living in it — a lake that stops boiling when you
walk away is a lake that was never boiling. Only the *sound* of the lava is cut
at a distance.

Also chose to gate the **beetle** like everything else. It guards the end of a
level, so you always arrive from far off and it wakes five seconds before you
reach it. Say the word if the boss should always be awake.

## Checkpoints

Added `*` as the character, since `C` was already the crocodile and `c` the
crow. A literal asterisk rather than a letter, which is unusual for this
format, but nothing else read as clearly as "a star."

Touching an checkpoint you have already passed **moves the respawn point
backwards** if you touch an earlier one after a later one -- there was no
guard against walking back over an old one. Decided that is correct rather
than confusing: if you deliberately go back for a missed heart, dying there
should not fling you all the way forward again.

Checkpoints are always touchable (never disabled, unlike a charm). Still
open: whether a level should ever want a checkpoint that expires or moves.
Nothing in the six levels needs one.

No guard requires a checkpoint to have footing under it, the same as charms --
they can float along a jump line on purpose. If that turns out wrong in
practice, `assertThornsStandOnGround` in `Level.ts` is the pattern to copy.

## The full-heart watermark now has a ceiling

`maxLives` was open-ended -- a hundred charms is a permanent extra life, so
there was no natural stopping point. Given a hard cap: **six**, double the
starting three. Chosen mostly for the HUD: the row of hearts lives in the
corner of a screen that is already crowded on a phone, and six is roughly what
still fits without shrinking them.

Both the hundred-charm bonus and a spare heart are clamped to it now, sharing
one method (`healOrGrantLife`) so they can never drift apart on the rule.

## Spare hearts reset on death, little hearts do not

Explicitly asked for: taking a spare heart and then dying should give it back,
unlike a little heart, which the docs already say stays collected. The
difference reads as intentional rather than inconsistent because a spare heart
is always guarded by something that can kill you -- losing that fight and
finding the heart waiting again is the point of going back for it, where a
little heart is never guarded by anything in particular.

It only resets on a real death, not on god mode's own save from falling out of
the world -- god mode never actually dies, so there is nothing to give back.

## On-screen text for what a heart bought

"100 ❤️ Collection Bonus" always, for the hundred-charm bonus, regardless of
which of the two things it bought. "Extra Life!" or "Lives Restored" for a
spare heart, depending on which it was. The charm bonus does not distinguish
the two out loud; only the spare heart does. Not asked which of those should
also play a sound -- currently neither does, beyond the existing flash.

## The heart ceiling is seven, not six

Raised from six after asking. No particular reasoning behind the exact
number beyond "one more than double the start" — say the word if it should
move again.

## A second, generic "current/max" announcement

Added on top of the three specific ones ("Extra Life!", "Lives Restored",
the charm bonus): every change to the life count, gain or loss, now also
grows and fades its own "X/Y" -- including a plain death, which previously
announced nothing about the count at all. Delayed 400ms behind whichever
specific text fires alongside it, so the two read as one after another
rather than as a garbled overlap grown from the same centre point.

The growth is a real `setFontSize` each step, not a `setScale` -- asked for
explicitly, because a Text object is a canvas rasterised at its own font
size, and scaling that up stretches the same soft, antialiased small glyphs
rather than drawing new, actually crisp ones at the bigger size.

## The lives ratio only announces exactly "6/7"

Corrected twice: first from "every change" down to "not full", then from
"not full" down to exactly one heart short of the absolute ceiling while
at the ceiling. 2/3, 4/5 and 3/6 say nothing; only landing on precisely
lives === MAX_LIVES - 1 with maxLives === MAX_LIVES does. A one-off notice
for a specific moment, not a running readout.

## Splitting the liana off T into its own character (l)

Asked for so a jungle level could have real, unclimbable trees (`T`) and
climbable lianas (`l`) in the same level -- one character with one flag
(`climbableColumns`) could not do both, so the liana got its own always-
climbable list (`lianaZones`) instead of sharing `climbZones`.

Went further than the rename alone: gave the liana its own art, baked
unconditionally rather than switched by the theme's `columnStyle`, so it
looks the same everywhere (like a little heart does) instead of taking on
whatever a rope, drainpipe or chain would have looked like in that theme.
Jungle's and swamp's `columnStyle` moved from `'liana'` to `'trunk'` as a
result -- what `T` renders as now that it is never a liana in either place.

Existing liana usage in canopy.ts and swamp.ts was renamed T -> l wholesale
(129 and 29 tiles) rather than left for a future edit, since every T in
either file was already a liana and nothing there needed to stay T. Neither
level has an actual tree in it yet; that is free to add now.

## Jungle and swamp's trunk colours were still tuned for a liana

Found while checking "same style as forest": T in jungle rendered with the
right bark *shape* but the old liana-green colours, since columnStyle
changed to 'trunk' but the palette's trunk/trunkDark/trunkLight fields never
did -- they were the liana's stem colour all along. Changed both themes to a
proper wood brown (their own branch tone, so a trunk matches the branches it
carries), which also recolours the liana's stem from green to woody brown.
Kept that side effect rather than giving the liana its own colour fields:
the leaf blobs along it still make it read as a liana at a glance.

## Dead vines (v)

Asked for after T and l: something that looks like a liana but is not one --
no leaves, never climbable, purely decoration. `v` for vine, distinct from
`l` for liana, since the two words already mean slightly different things in
English (a liana is specifically the climbing kind).

Given no ledge at its top and no separate anchor picture the way a real
liana has, since nothing about a dead vine is a place to stand or a place a
liana's leafy anchor point would make sense on -- it is one plain stem
texture, used for every tile of it including the top.

## l renamed to V, and its top is never a platform

Two follow-up corrections on the liana. First: the lowercase `l` became
capital `V`, freeing `v` to pair with it the way `S`/`s` already pairs the
giant spider with the ordinary one -- upper case for the climbable one,
lower for its decoration-only twin.

Second: the top tile of a liana used to get a one-way ledge, the same
treatment a tree's crown gets. Removed -- a liana hangs from nothing, so
there is nothing at the top of it to stand on either. Falling onto that tile
still grabs it exactly as any other tile of it does; only standing on it,
never climbing it, was ever the question.

## A branch directly above a T was misread as the crown

`isTop` only checked for another `T` above, so a branch sharing that exact
column (rather than sitting beside it) made a mid-trunk tile look like the
top of the tree and hand it a ledge partway up its own length. Found in
canopy.ts once it had enough trees for the case to actually occur -- 12 of
them, all now correctly mid-trunk. `=` now counts the same as `T` for this
check: a branch growing out of a trunk is the trunk continuing, not ending it.

## N and + split into two characters

Asked for explicitly: `+` used to be both the heart and its own nest ledge in
one tile; now `N` is only ever a ledge and `+` is only ever a heart. "A heart
sitting in a nest" is written as the two stacked -- `+` directly above a row
of `N` -- rather than being one combined tile.

Went with the vertical stack the user's own example showed, not the
horizontal `N+N` the six existing spare hearts already used. Converted all
four that relied on the old auto-nest and would otherwise have shown a gap
where the heart used to also provide a ledge (forest, city, and two in
canopy): the heart moved up one row, the row it left became a full `NNN`.
Left three untouched because they were never flanked by `N` in the first
place and were always meant to be bare floating hearts by the new rule
anyway (one each in cave... actually cave's nest was implicit -- see below --
and two isolated ones in swamp).

Also added a water case, asked for separately: a `+` surrounded by `w`/`f`/`C`
centres in its tile instead of sitting low, since there is no rim to sit
above when it is floating in water rather than resting near a nest.

One nuance found while doing this: the *old* `case '+'` pushed a nest **and**
its own ledge even with no `N` anywhere nearby -- every existing spare heart
in the game, including the isolated cave one, drew the full nest bowl
automatically regardless of neighbouring characters. Cave's now has an
explicit `NNN` added beneath it to keep that look, since it is one of the
three the game has always described as sitting in a nest.

## A hole in the water: + needs to be W when it is inside a pool

Found right after the water-heart offset work: a `+` written where a pool
needed to stay water punches a one-tile hole in it, since the water zone
simply skips whatever tile isn't `w`/`f`/`C`. Same problem `f` and `C`
already solved by being water themselves rather than something placed on
top of it. `W` does the same for a heart: water and a heart in one
character, joining `waterZones` exactly like the other two.

## Background trees drifted off their own roots when climbing high

Found by suspicion: `Backdrop`'s far and mid tree ranks looked wrong high up
in the canopy. First diagnosis was half right -- the trees did run out
higher up -- but the fix (repeating rows to fill the sky) was wrong and made
it worse: told directly that it now looked like the trees were flying,
because a *second* problem was still there underneath. A tree at scroll
factor 0.25 or 0.5 moves less than the floor (factor 1) does for the same
camera movement, so as the cat climbs, the ground pulls away from the tree
faster than the tree follows -- the tree looks like it is lifting off its
own roots. Repeating rows just multiplied that drift into a mess of
overlapping, half-airborne trees instead of fixing it.

The real fix: `setScrollFactor` takes the two axes separately, and only the
horizontal one should ever have been below 1. Locking the vertical factor to
1 keeps a tree's foot exactly on `groundLine` on screen regardless of camera
height, and one row is enough again -- the "empty sky above" symptom turns
out to be correct once the rooting is fixed, since a tree pinned to the
ground disappears below the frame exactly when the ground does, the way a
real distant tree would once you have climbed above it.

## Canopy's `groundLine` was itself wrong, on top of the above

The scroll-factor fix above was necessary but not sufficient: told directly
that the background was "helemaal fout" for canopy still, with the hint that
the player spawns one tile above the ground. `groundLine` is not derived from
the tile grid at all -- every level sets it by hand as `groundRow` (a row
index times `TILE`), and Canopy's was `26`, the exact same number as Swamp's,
which only makes sense as a stale copy-paste left over from before Canopy's
grid grew to 43 rows with the floor pushed down to row 39. Row 26 sits in the
middle of the liana section, so every rooted tree, bush and grass tuft was
planted ~208px too high -- mid-air in the canopy rather than at the real
floor.

Fixed to `groundRow: 39`, matching how City, Cave and Swamp all set it: the
row of the general, continuous floor, not the local boulder the spawn happens
to sit on one row above it. The pattern worth remembering for any future
level: `groundRow` is always spawn-row-plus-one, or plus-two when a boulder
sits directly under the spawn tile.

## Climbing down and reaching for a charm dropped the cat

Reported directly: climbing down a liana and picking up a little heart makes
the cat fall. `findTrunk` tested the body against the exact width of the
climb zone, and charms are routinely placed one tile beside a column rather
than on it -- reaching for one moved the body past the zone's edge, and
`findTrunk` finding nothing is exactly what is supposed to drop a cat off the
end of a rope. Fixed with `CLIMB_SIDE_MARGIN` (10px): `findTrunk` now looks a
little wider than the zone itself, so leaning sideways for something within
reach no longer reads as climbing off the end.

**Left open on purpose.** Told separately that a well-timed jump pressed at
the exact moment of touching a charm already lets the cat jump clear (works
with both charm types), that this is wanted, and that it is probably the
other side of the same coin as the fall -- likely the coyote window
`releaseTrunk` hands out on a genuine release, cashed in by a jump pressed in
that narrow gap. The margin fix removes the release in exactly the case that
used to need saving, which should make the fall-without-a-jump case simply
not happen any more rather than change what a well-timed jump does elsewhere
-- but I have not reproduced the original "jump exactly on touching a charm"
timing precisely enough in the console to confirm the margin left it intact
for a charm placed exactly at the margin's edge. Told not to add anything
further speculative on top of the margin fix while that is unconfirmed, so it
ships as-is; worth an eye next time a charm sits right beside a rope.

## God mode no longer ships

It used to be the one exception to "everything in `src/dev` drops from the
build" -- deliberately, since testing happened on a phone against the copy
deployed to Pages, and a cheat that only exists on the machine it was written
on is no use there. Told directly it should only work on localhost, and
ideally not even be in what CI builds at all.

Reversed: `installGodMode` is now called from behind the same
`import.meta.env.DEV` branch as `installLevelSkip`, and dropped from the
bundle the same way -- confirmed with a grep over `dist`, zero hits for the
function name, the toast strings and the registry key. The two gameplay call
sites (`kill()`, the fall-out save) keep `isGodMode` itself unwrapped, since
class methods in this file run in every build regardless of guards, but each
read is now `import.meta.env.DEV && isGodMode(this)` -- a literal `false` in
production, so the flag can never read true there either way.

Testing on a phone still works exactly as before, just against the dev server
over the local network (see the project's own `CLAUDE.md`) rather than the
deployed copy -- that phone is talking to a dev build, so it gets the cheat
too. What it no longer gets is a cheat reachable by anyone playing the live
game, which was the actual problem with shipping it.

## Cat animations, and swimming's own gravity

Asked for directly: a walk loop, a climb loop, a swim loop, and something
other than perfectly neutral buoyancy under water. Numbers I picked without
asking back, all in `CAT` and easy to retune:

- **`animFrameRate: 8`**, one number shared by all three cycles. Slower read
  as sluggish at this pixel size; faster blurred the chunky shapes together.
- **Walking is 4 keyframes but only 2 new textures** -- the idle standing
  pose sits between two stride textures (`cat`, `walk-a`, `cat`, `walk-b`)
  rather than the two strides running back to back, which is what keeps a
  slow walk from reading as a nervous shuffle.
- **Climbing is a 2-frame shuffle**, the existing `cat-climb` alternating with
  one new reaching pose, and only plays while `vertical !== 0 || sideways !==
  0` -- holding still on a rope holds the still grip, same as before.
- **Swimming got its own pose for the first time.** There was no dedicated
  swim texture at all before this -- a swimming cat just showed the standing
  `cat` texture regardless of the pool. It is a brand new 2-frame paddling
  cycle, plays unconditionally (no still frame; treading water is still
  paddling), and is drawn at the same standing-frame size climbing uses, since
  the body does not resize in water either.
- **`swimGravity: 150`, a tenth of ordinary `gravity` (1500)**, was a direct
  answer to being asked "somewhere in between, 10%?". Implemented as Arcade's
  additive per-body gravity (`swimGravity - gravity`, cancelling nine tenths
  of the world's) rather than replacing the buoyancy code with real physics,
  so `applyBuoyancy` still caps the resulting sink at `sinkSpeed` and still
  stops it at the water's own bed -- the fraction changed, not the shape of
  what happens once you stop pressing anything. Worth a look if a tenth turns
  out to read as too slow or too fast in an actual pool once real art is in.

**Caught immediately after shipping:** dying underwater and respawning at a
checkpoint left `swimGravity`'s offset on the body -- ordinary gravity stayed
at a tenth of itself on dry land afterwards. Not a wrong call on the 10%
itself, just an incomplete one: the offset is per body and additive, and
`step` only cleared it back to zero on the ordinary route out of water (still
alive, walking onto a bank). Dying and respawning skips `step` entirely, so it
needed the same reset in `respawnAt` too, which it now has. The old
zero-gravity version never had this seam, because it never had a persistent
value to forget to clear -- `setAllowGravity(true)` alone was always enough.

## A wider forward button, and a three-way mute

Both asked for directly. Numbers and shapes I picked without asking back:

- **`RIGHT_BUTTON_REACH: 24`** -- how much further right the "right" button's
  hit zone reaches past its drawn edge. Checked against every other button on
  the narrowest supported aspect ratio (16:9) before picking it: the widened
  zone's right edge sits well short of "sneak"'s left edge even there, so
  there is no aspect ratio where it can eat into a neighbouring button.
- **The mute button moved from bottom left to top right**, just under the
  hearts (`GAME_WIDTH - TILE, TILE * 2 + 4`) rather than sharing their row --
  the hearts grow leftward from that exact corner, so the button needed a row
  of its own rather than the corner itself.
- **The middle mode is called `sfxOnly`, not `bgMuted` or similar** -- named
  for what stays audible, not for what is cut, since that is the half of the
  game a player reaching for this mode actually wants to keep.
- **Its icon is one arc instead of two**, reusing the two-arc "all" icon and
  the crossed-out "silent" one either side of it, rather than drawing a new
  shape from scratch. Reads as "quieter," not literally as "background off,"
  which is a placeholder simplification worth a second look once real art
  exists for this button.
- **`catnah:sound-mode` is a new localStorage key**, read in preference to the
  old boolean `catnah:muted`, which is still read once as a fallback so an
  existing silent/on preference survives rather than resetting to `all`. The
  old key is never written again.

## First dev test level: a mandatory duck

Asked for directly: a small, dev-only level to test sneaking under something.
`DEV_TEST_1` is appended to `LEVELS` from inside `import.meta.env.DEV`, in
`levels/index.ts` -- confirmed gone from `dist` the same way as
`installLevelSkip`/`installGodMode`.

**First version was not actually mandatory**, and worth recording why: the
overhang (`B`) sat directly above the gap with open rows above it, copying
`forest.ts`'s optional duck passage exactly -- but forest's is a *choice*
(jump up, land on top, walk across), and a test level needs the thing it is
testing to be unavoidable. Fixed by running solid ground the rest of the way
up to the top of the level, so there is no open air anywhere above the gap to
arc a jump through.

**Found while checking that fix held**: standing still cannot walk through
the wall, and sneaking passes cleanly -- but repeatedly tapping jump while
pinned against the wall lets the cat creep through it, a few pixels at a
time, over several taps. Traced to the same 2px margin that makes the duck
gap work at all (an 18px standing body against a 16px opening): each jump
nudges the body's Y by a pixel or two right as it is separated from the wall
on X, and Arcade resolves the two axes in separate passes, so a nudge on one
axis occasionally leaves less overlap on the other than there was a moment
before, letting the body creep past the edge instead of snapping cleanly
back to it. Not something introduced by this level -- the same 2px
margin is what the shipped forest overhang relies on too, just never stressed
this way there because it was never mandatory. Left alone: reproducing it
needs a deliberate, repeated tap-jump-into-a-wall pattern no ordinary play
does by accident, and a real fix would mean touching how Arcade's own
separation is used generally, well past what a test level should be
motivating on its own. Worth knowing about if a *later* level ever makes a
duck mandatory for real.

## Ducking against a wall dropped the cat through the floor

Reproduced on `DEV_TEST_1` more than half the time: walk right into the
wall, tap down, and the cat sinks and falls out of the level. Diagnosed as
the walk cycle still running while the cat was ducked, and one of its ticks
putting a standing-height frame back on the flattened body -- confirmed by
switching every cat animation off, after which it could not be reproduced at
all. Details in `src/objects/CLAUDE.md`, under the poses.

- **Fixed at the picture, not the body.** The pose swap now stops any running
  animation, and a sneaking cat's texture is re-checked every frame. The body
  maths and `hasHeadroom` were left alone: they were correct, they were only
  ever fed a wrong sprite position.
- **`hasHeadroom` still measures from the sprite**, not the body. With the
  cause fixed the two never disagree, so this stays as is; if a second way of
  desynchronising them ever appears, measuring from the body is the safer
  choice.
- **`sneakBodyWidth` is still 18 against a standing 13**, so the duck frame
  still nudges the body 2.5px sideways into whatever is beside it. Arcade
  cleans that up and it was not part of this bug, so it was left; equal
  widths would remove the nudge if it ever matters.

## Sneaking under thorns

Asked for: crawl past the spikes without dying. Built as a rule on the pose,
not on geometry.

- **Pose, not height.** The 9px sneaking body does still overlap the thorn
  rectangle; the check simply skips thorns while `player.sneaking`. Shrinking
  the deadly rectangle to the top two pixels would have let the body slip
  under by exactly zero margin, and a one-pixel bounce would have been a
  death. The pose is what the player chose, and it drops as soon as the cat
  leaves the ground, so falling into thorns still kills.
- **Only thorns.** Lava spares nothing, and neither does a hedgehog -- its
  spines are a creature's, not scenery's, and going under a hedgehog reads
  wrong. If "spikes" was meant to include the hedgehog, that is a separate
  decision.
- **Levels were not re-checked for shortcuts.** Every thorn patch in the game
  can now be crawled through where before it had to be jumped. Nothing is
  known to be broken by that, but a patch that was the only thing forcing a
  jump is now optional.

## A chain caught the cat from a tile away

Reported from the volcano: one `T` in the map, drawn as a thin chain, but
three tiles' worth of air took hold of the cat. `CLIMB_SIDE_MARGIN` (10px),
added so a climbing cat could lean for a charm without dropping, was widening
the catch: tile plus margin each side plus the cat's own 13px body made a
49px band.

- **First fix kept the margin for holding on only.** That made the catch
  narrower than the hold, and it showed: jump past a chain without catching
  it, catch it higher, shuffle back to that spot, and hang there in air you
  could never have grabbed from. Rejected on sight.
- **Now: no margin at all.** Catch and hold are the same test, body over the
  tile. Measured: both end at 14px from the column's centre, and leaning
  that far still collects a heart in the next column while climbing.
- **Found on the way: climbing down past a heart dropped the cat**, climbing
  up did not. Arcade raises `touching.down` on any overlap entered while
  moving down, and the climb's "landed on the floor" check read it. It reads
  `blocked.down` now. `onGround` itself was left alone, because...
- **...taking a heart in the air gives a jump, and that stays.** It is the
  same flag, it began as a side effect, and it is wanted -- now written into
  `work.md` as a rule. Any future change to `onGround` has to keep it.

## A version on the title screen

Asked for: `v0.1.<build number>`, visible on the title screen. Three ways to
get the number were tried in the space of one conversation:

- **Commit count** -- rejected by the user; it also needed the deploy to
  fetch the whole history to count it.
- **Short commit hash** -- exact but unordered, and awkward to say aloud.
- **GitHub Actions run number** -- chosen. `GITHUB_RUN_NUMBER` is set for
  every workflow run, goes up by one per deploy, and reads as a build number
  should. A laptop build has none and falls back to the short hash, so the
  two kinds of build cannot be confused. The `0.1` is typed by hand in
  `vite.config.ts` and is the thing to bump for a real release.
- **A re-run of the same deploy gets the same number** (run number is per
  run, not per attempt). Fine for this purpose.

## The graphical overhaul, first pass

Asked for, with five reference pictures. What they had in common was not
resolution but lighting and composition: depth by tone, lit tops on dark
masses, organic edges, and nothing drawn where it cannot be seen. Decisions:

- **Stayed at the current resolution and stayed pixel art.** The reference
  ground was at roughly our scale; what it spent better was colour and
  contrast. Doubling the canvas remains possible later and is not needed for
  this.
- **The dark ground is an overlay, not baked into tiles.** A distance field
  from every exposed face, cached per pattern and placed as one image per
  tile. Tunable in one place, works for every theme, and the tiles under it
  stay simple.
- **Drawn in code, by Claude.** The reference textures are an artist's; this
  is a step toward them, not a match. Every drawing is one function in
  `src/art`, so any of them can be replaced by a file later without touching
  anything else.
- **Forest first.** The other themes get the ground shade and the new tiles
  for free (the cave already reads much better); their own backdrops are
  untouched so far.

## Stones in the ground versus boulders on it

The same `R` is used for both, and for a turn the shade treated every `R` as
a boulder in the open, which lit the stones buried to break up the earth
and left holes in the dark. Rather than a new glyph, the level's own layout
decides: a rock cluster with air anywhere round it is a boulder (lit, mossy,
grass running on underneath); one with earth on every side is a stone in
the ground (bare, darkening with the earth). Whole clusters, not cells -- the
middle of a boulder has rock on every side too. A glyph would have been
explicit but would have meant editing every level that already has both.

## The cave lagged on a phone

Not residual: the cave itself. Measured on the laptop, a cave frame took
14ms against the forest's 0.9ms, because the cave had 27,000 game objects
-- 12,400 fill tiles, 10,000 shade overlays, fringes, boulders -- every one
submitted to the renderer every frame, with 195 textures breaking the
batches. The overhaul roughly doubled a count that was already too high.

- **Fixed by baking**, not by drawing less: all static scenery is drawn once
  into 512px chunk textures when the level is built (`world/BakeScenery.ts`).
  Cave: 14ms -> 0.16ms a frame, 27,000 objects -> 326; the build dropped from
  over five seconds (a quadratic cleanup, since fixed) to half a second.
- **The level order was temporarily CAVE first** for the phone test, and is
  back to forest, canopy, swamp, cave, volcano, city.
- **Found on the way:** Phaser 4's `RenderTexture.draw` only queues; the
  first bake drew nothing and the cat stood on invisible ground.

## A cell that is neither air nor a tile

Asked for after the cave's lag: a way to write the mass behind a cave's
walls without paying for a tile per cell. `_` is void: solid rock that is
never seen. It counts as solid for everything -- neighbours' faces, the
darkness, the level checks -- but gets a collision body only where it
touches something that is not solid (the shell; a buried `_` is just a
character in the file), and its whole picture is one flat dark rectangle
per run, in the colour the ground shade fades to, so `#` deep in a mass
and `_` beside it meet without a seam.

- **`_`, not a space.** A space was suggested and would read well, but rows
  are written short and padded with air, and every editor trims trailing
  spaces: a row ending in void would silently become a row ending in air,
  invisible in the file. Only the dev test level ever used spaces (as
  pits), so the choice was free; `_` survives the editor.
- **After the scenery bake, void no longer buys frame time** -- a chunk
  costs the same whatever it holds -- only build time and memory. It is
  still the honest way to say "mass" in a level file.
- **The bottom row of a level is always shell**, because outside the level
  counts as air for a tile's faces. Harmless: a body per cell along one
  row.
- **A `#` under a `_` is fill, not grass-top.** The grass-top rule was "grass
  unless `#` above", which put a grass top -- and with it the fringe and
  rounded corners -- on every `#` sitting under void: the underside of every
  shell around a cave ceiling. Void above now counts as rock above.
- **The darkness finishes in a flat tone, and void is that tone.** The fade
  used to stop at 80%, leaving faint stones in deep `#`; a flat void beside
  it drew a hard line, and a textured void beside it looked like `#` still
  being painted. Now the fade runs to full strength and each theme's shade
  colour was recomputed to be exactly the tone 80% used to reach, so deep
  `#` is flat, `_` is the same flat, nothing got darker, and there is no
  seam.
- **Fillets go only in open cells.** The inner-corner fillet loop treated
  every non-`#` cell as air, void included, and put a green wedge at every
  corner of a cave's mass.
- **The cave was converted by script**: every `#` at least four cells from
  anything not solid became `_`, keeping three cells of textured rock
  round every opening. 10,113 of 13,036 cells.

## Dev test level 1 deleted

Asked for: the duck level, after it had been emptied, deleted outright. The
file and its entry in `LEVELS` are gone; the notes above stay as history. The
`if (import.meta.env.DEV)` block in `levels/index.ts` went with it, since it
had nothing left to push, and `level/CLAUDE.md` says how to bring one back.

## The city is gone

Asked for: the whole city level removed, the car included, the letter `A`
freed, and the rat kept with its logic.

- **Removed with the level:** its theme, backdrop, the rain and its sound, and
  the parked-car art. Also the pieces that only the city used: `M` houses (the
  letter is free too), the drainpipe and lamp column, the girder platform, and
  the `solidPlatforms` option. I read "complete" as meaning these, not only the
  level file. If any should come back, they are in git history.
- **Kept:** the rat, `r`, its leap and its sound. Nothing places one now, so it
  is untested until a level does.
- **The game is five levels**: forest, canopy, swamp, cave, volcano. The
  volcano's door leads back to the forest.

## Crocodiles lowered with the water

The water's picture sits `WATER_DROP` (3px) below the swimmable zone, and the
crocodiles were still placed off the zone, so they rode 3px too high. They now
sit `WATER_DROP` lower. Their backs are still 4px above the swimmable surface,
so a cat standing on one is not counted as swimming. The piranhas were left
alone: they lurk under the surface, where 3px does not show.

## Crocodiles: two pixels lower, varied facing, no shaking on the way home

- **Lower by 2px**, not 3. The back now rests 2px above the swimmable surface
  and dips to 0.5px above it at the bottom of the bob. At 3px it would touch
  the surface, a cat standing on it would count as swimming and sink off.
- **Facing is now per crocodile**, from a hash of its home x, so the same ones
  face left on every device. Turning the picture also moves the back collider
  to the tail end. Say so if you would rather choose the direction per crocodile
  in the level file.
- **The shaking** was the swim home orbiting the spot: its turning circle was
  wider than the arrival tolerance, so it circled and flipped left and right
  every half turn. The last stretch is now a straight glide, it snaps on
  arrival, and it only turns to look at something more than 4px to one side.
  Not watched in a browser; checked by reading the code and by typecheck only.

## Title screen: a cut of the real forest

- **"66/67"** I read as the editor's column numbers, which are the file's tile
  columns plus 4 (three characters of indent and quote, one-based). That makes
  forest columns 62/63: the last two tiles of the lowest `=====` branch of the
  great tree, with a hedgehog on the ground beneath. The cat stands on the tip
  of that branch. If you meant other columns, only `P` in `levels/title.ts`
  moves (and the camera follows it).
- **The map** is a copy of forest columns 36-89 and rows 7-33 (54 x 27 tiles),
  so the widest screen (21:9, 53 tiles) is still covered. It is a copy: later
  forest edits do not change it.
- **The crow** is placed in the sky left of the tree and flies the whole width
  and back, 70 px/s, bobbing 10 px over 1.9 s, 40 px past each end. All four
  numbers are in `config.ts` (`CROW.flyby*`). It never attacks, and the title
  has no collisions that could hurt anyone anyway.
- **The crow's height** was raised two tiles at your request. On a short screen
  (a phone) that would be above the picture, so in title mode the crow's height
  is held to one tile below the top of the view: on a phone it flies a little
  lower than on a laptop, but is always seen.
- **Behaviour per level** is `crowBehaviour` on the level definition, default
  `'attack'`, so no other level changed.
- **Hedgehogs hide behind bushes, not trees.** Baking the scenery had put the
  bushes in front of them by accident, and trees and rocks too. Now the
  hedgehog is in front of the baked layer (-0.4) and the bushes and swamp
  reeds are live objects in front of it (-0.3). The bushes sit 2px higher, as
  they now draw over the grass instead of under it, and they also overlap the
  foot of a tree or boulder beside them. Say so if a bush in front of a trunk
  bothers you.
- **A spawn on a branch** no longer trips the "no floor under the spawn" check.
- **Not tried:** a real phone. Checked in a desktop browser at laptop size and
  with `?phone`.
- **Controller change.** Stick on the left, jump on the right,
  `Space` = jump, `↑` = up. Judgement calls: `↑`/`W` no longer jump on the
  ground; the stick is a fixed one with big zones rather than a floating one;
  down on the stick keeps the name `sneak` in code; the old forward button's
  wider hit area is gone with the buttons. Say if you want a floating stick
  or `W` to jump as well.

## The exit is a wormhole you walk into

**Two complaints: the door was ugly, and you could keep walking -- and die --
after it had already fired.** Then, while it was being built: make it a
magical spinning wormhole, round not oval, swelling and shrinking as it
spins, and sink its foot into the ground. (The first swell scaled x and y at
different speeds, which is a fine warp and a terrible way to keep a circle
round: it is one uniform scale now.) All done, with a few calls of my own:

- **It is wider than the grid.** A 44px disc on a 16px tile, standing on the
  `E` tile's ground, centred on it; if an `E` is ever in the very last column
  it is nudged inwards so the disc stays inside the world.
- **Entered, not touched.** Phaser's overlap fired when a paw brushed the rim.
  Now the level is left when the cat's centre is within eight pixels of the
  portal's centre -- about half a cat, so it is really in the hole. A jump
  through the hole counts as entering; a jump that clears it does not.
- **The cat is drawn in.** It stops dead and tweens into the centre,
  shrinking to nothing, while the glow flares and the screen fades. Its
  physics body is switched off at that moment, so nothing can touch it: not
  the hazard checks, which no longer run for it, and not a collider either --
  a hedgehog teleported onto a leaving cat was the test, and it used to kill.
- **A sound.** Three rising notes, the last one long, played once on entry.
  Nothing else in the game marks the moment and it felt like it wanted one.
- **It draws over everything but the cat.** It started out above the scenery
  and below the cat, went above the cat at your word, and came back under it
  when that hid the cat being drawn in -- which is the point of the drawing
  in. Above every bush and creature still, so nothing can hide it.
- **Its rim fades out.** You asked whether the alpha could depend on the
  distance from the centre, after trying it behind the scenery: it can, once,
  at boot -- the picture is copied to a canvas and every pixel's alpha is
  eased down from `fadeFrom` (45% of the radius) to nothing at the edge. That
  does what sinking it behind the rocks was meant to do, in every level,
  without the bake getting in the way. The outer arms of the spiral go with
  the rim; if you want more of them back, `fadeFrom` is the knob.
- **It sits between the backdrop and the terrain.** You wanted it in front
  of the backgrounds -- the cave wall, the sky -- and behind everything
  else: ground, rock, branches, boulders, bushes, creatures. The bake made
  that impossible at first, because it flattened the cave wall and the leaf
  masses into the same single layer as the ground, so a portal behind the
  ground vanished in the cave and the canopy. The bake now makes two layers,
  split at depth -5.5 (`BACKDROP_LIMIT` in `world/BakeScenery.ts`): the
  backdrop at -20 and the terrain at -0.5, with the portal at -10 between
  them. Nothing else changed its depth. The faded rim stays; it reads as a
  hole in the world now.
- **The sunk foot is a mask, not a shorter picture.** The disc turns and
  warps, and a texture with its bottom cut off would turn with it; a mask
  along the ground line clips whatever is below it, whatever the disc is doing.

**It is your picture.** `public/assets/portal.png`, 78px, the first and
only binary file in the project -- the no-binary-assets rule now reads "except
the portal". Three calls made putting it in:

- **Shown at 32px.** It was 48 -- three tiles -- which you found too big;
  two tiles now, with the foot sunk six pixels instead of eight so enough of
  the disc stays above ground, and the hole you have to reach eight pixels
  across instead of ten.
- **Filtered smoothly.** The game samples textures nearest-neighbour, which
  is right for pixel art and wrong for a photo-like spiral turning at a third
  of its size: it shimmered. This one texture is set to `LINEAR`.
- **The gold rim went with the drawn disc,** and later the gold glow behind
  it went too, at your word: the second picture (78px, a clean round disc
  rather than a ragged one) stands on its own.

> **Still open:** where the picture comes from. If it is stock art, check it
> may be used in a game that is published; `main` deploys to GitHub Pages.

## Water under stone fills its cell

**A `w` directly under a `#` left a strip of sky between the rock and the
water.** Every water tile with no water above it counted as a surface, and a
surface is drawn `WATER_DROP` pixels down with a swell on it. Under stone
there is no surface: the parser now marks water as one only when the cell
above is open air (not water, not any solid letter), so covered water fills
its cell, flat and still, and the rounded-corner fillets follow the same flag.

> **Still open:** lava has the same rule and the same potential strip under
> a `#`. Not touched -- say so if the volcano shows it.

## Bushes: a thinner shadow, and none on the water

**The dark strip under a bush was three pixels, and read as a slab.** One
pixel now, like the heap at a boulder's foot. And the forest's bushes were
scattered along the whole ground line, pools included, so a bush could stand
on the water; a bush whose foot would overlap a pool at the ground line is
skipped. The random draws are made before the skip, so the other bushes stay
exactly where they were.

> Only the forest and canopy backdrop does this; the swamp's reeds stand in
> the water on purpose.

## Thorns: two layers, and you may jump out of them

**Two of the four spikes are drawn in front of the cat** (the second and the
fourth, at depth 0.5) and two behind, so a crawling cat threads between them.
Same drawing, split into two textures; you looked and approved it.

**Jumping out of thorns is allowed.** The pose drops the moment the cat
leaves the ground, so until now a cat could crawl into a patch but never jump
out of it -- the first airborne frame was a standing cat in thorns, and dead.
Now a cat that is airborne and moving *up* is spared; one moving down is not,
whether it fell from above or is dropping back into the patch it jumped from.
"Rising" is the body's velocity, so the apex of a jump inside a tall patch is
where safety ends.

## The portal no longer pulses

**The alpha pulse (0.8 to 0.4) is gone,** at your word; the fade towards the
rim stays. The only alpha animation left is the exit itself: the moment the
cat steps in, the portal fades from its resting alpha to nothing over the same
420ms as the cat shrinking into it, so the two go out together. That resting
alpha is 0.8 (`EXIT.alpha`), so the world shows through it a little.

## A level may have several exits

**Every `E` is a portal, and all of them do the same thing** -- the next
level, with everything you carry. The parser collects them as `exits`; the
scene builds one portal per `E` and asks each one whether the cat is in it.
The beetle, which keeps itself between the cat and the way out, takes the
portal nearest its own start as the one it guards. No level uses more than
one yet.

## Leaving fades out over 650ms, and the next level fades in

**The fade to black on leaving is 650ms now** (was 450), the same length as
the pause after a death before the respawn, so leaving and dying take the
same breath. **And there is a fade in**: there was none -- the next level
simply appeared -- so now every level arrived at, from the title or through a
portal, comes up out of black over 650ms -- it was 220 for a moment, and
went back. A hot reload does not fade, because the player never left.

**An arrival portal** stands where the cat appears, opaque from the first
frame while the screen is still black, and fades to nothing over 650ms with
a quarter turn. It is seen through the black because the black is not the
camera's fade (which paints over everything) but a screen-pinned rectangle,
with the portal just above it. Purely a picture: it has no opening and
nothing happens if you walk back into it.

**Neither fade touches the hearts.** The black sits at depth 999, just under
the hearts (1000), on the way out as well as on the way in: it is the world
that goes dark, not the screen. The level name is the exception, at 998 just
under the black, so it fades with the level it names. The camera's own fade
could not do any of that; it paints over everything the camera draws.

**The arrival portal starts at 0.8,** like a standing one, and is centred on
the cat: measured in all five levels, it stands within a pixel of the cat's
middle, and the cat does not drop after spawning anywhere. If it ever looks
off, it was the first version, which read the body's centre before the
physics had placed it.

## The flash between the fades

**One fully lit frame showed between the fade out and the fade in.** The
fade out destroyed its black the moment the tween finished and asked for the
next level in the same breath, but `scene.start` is only carried out at the
top of the following frame, so the old level drew once more with nothing
over it. The fade out's black now stays until the scene switch takes it; only
the fade in's black is thrown away when it is done.

## The volcano, made to look like one

**Lava stands above the land.** You asked for it higher than the ground
around it, flowing over. The surface is drawn `LAVA.rise` (5px) above its own
cell under a domed crust, the vents and heat haze ride on that crust, and the
rectangle that kills rises with it so the line you see is the line that burns.
Where a surface tile has a whole tile of ground beside it on the same row, a
tongue of lava (`lava-lip`, 7px long, 5px thick) lies over that tile's edge.
Ground a row *higher* than the lava gets no lip -- the lava is below it, there
is nothing to spill onto -- so a lake that should overflow its banks has to be
written on the banks' own row, which is what you did.

**The backdrop is rebuilt.** The flat dark cones with a lit tip are gone.
Three ranks of mountains, two silhouettes each, flipped at random: a jagged
single-peaked ridge drawn as a function of x, which is what lets the rest be
cheap -- the red underlight is two-pixel bands trimmed to the mountain's
width at each height, and a lava stream is kept on the slope by the same
question. Streams are thin, smooth, slanting lines (a steady drift plus a
slow sine); the first version was a random walk per row and read as scratches
on the picture. Only the near rank has streams. Craters glow with a halo;
smoke rises from the near ones on tweens; ash falls and embers rise.

**Basalt and ash instead of brown grass.** The volcano's palette uses the
cave's `dust` surface style -- a cinder crust with the odd lit pebble -- over
near-black basalt, so the lava is the only warm thing in the picture.

> **Still open:** the mountains' lava streams are baked into the picture and
> do not move. A slow glow pulse on them, or a shimmer, is a tween away if
> the backdrop wants life beyond the smoke and the ash.

## Lava, heat and the volcano's drone

**The lava is drawn finer, in more colours, and it moves.** Eight surface
frames instead of four: plates of dark skin drift right two pixels a frame
with white-hot cracks between them, cooled lumps ride the rim at half that
speed, two bubbles swell and burst out of step, and the orange body has
warmer patches in it. The body below the surface is animated now too, four
slow frames of hot veins creeping down through dark cooled lava. All in the
tile's own 16 pixels: more detail and more tones, not bigger tiles -- the
game is pixel art, and a lake drawn at another resolution than the ground it
sits in would read as pasted on.

**The heat is a column, not a rectangle.** A baked `heat` texture, brightest
at the foot and ragged at the top, breathing and swaying on two tweens, and
wisps lifting off random vents, rising and thinning, capped at 18 in the air.

**The rumble is ominous now, still subtle.** Under the low-passed noise sit
two deep sines a hair apart (36 / 36.7Hz) beating against each other, with an
octave above at a quarter the level, surging on a slow clock of their own.
Not a note, a presence. Mute cycles it with the rest of the bed.

## Lava is drawn per lake, like a boulder

**You wanted boulder logic for lava, and that is what it is now.** My first
pass kept drawing per tile and only made the tile busier, which is not what
you asked. `art/lava.ts` joins connected `L` cells into pools and bakes each
pool whole, in eight frames, keyed by theme and position: a crust that heaps
up across the whole width (a dome plus a slow waver), plates and lumps
scattered by a seed rather than repeating every sixteen pixels, two or three
veins wandering the length of the body, bubbles where the seed puts them,
large cooled plates with a hot rim, and glow specks that come and go. The
tile-level surface and body textures are gone. The lips over the banks, the
heat columns and the wisps stay as they were, per surface cell.

A pool need not be a rectangle: the crater's V is one pool, and every feature
is clipped to the cells that are actually lava.

**The lava lip is six pixels now, not seven,** at your word.

## The lava's raised crust kills almost to the bank, on purpose

**The kill rectangle of a surface tile rises with the crust,** and stops one
pixel (`LAVA.bankMercy`) short of the bank: a cat at the very edge of an
island with its body more than a pixel over the lava cell dies. That felt
"very precise" at first, and I tried mercy at the banks -- a body's width,
then a toe's -- and you set me straight: dying fast there was the good part,
it had only been a hair too extreme. Settled at one pixel of mercy, the rise
at 3px and the lip at 4px. The tongue of lava over the bank is a picture
only; what you saw as "standing in the crust and dying" was the body over the
cell edge while the drawing, 4.5px wider each side, still looked to be on
the land.

**Rise and lip each lost a pixel** at your word: the surface stands 4px
proud now, the lip reaches 5px over the bank.

**Your taller map:** four rows went in above, and `groundRow` is still 28
while the spawn is on row 31 -- the backdrop plants on it, so the mountains
hang 64px too high. That is your file; the number wants to be 32.

## The beetle flies again

**It sat on the ground waiting.** Two of my own doing, both from giving it a
collider against rock: a dive used to end 70px *below* the floor, reached by
diving through it, so with rock in the way that depth never came and it
stayed in the dive, pressed into the ground; and a line-up aimed at a column
behind the arena's slope could never get over it, so it stood against the
wall aiming. A dive ends on the floor now, and a line-up that is blocked or
has gone on for more than 1.4s dives from where it is.

**And it hovers higher** -- 36px over the floor instead of 14. It was placed
low on purpose, so a standing cat could not pass under it; you wanted it to
fly, and a beetle you can run under but which comes down on you is the
better fight. **Its wings are heard** while it is after you: a short low buzz
every 0.42s, from where it is. Not heard by me; say if it is too much.

## The beetle is a hunter now

**"Tame as a lamb"** -- in the rebuilt arena the old gatekeeper (stand between
the cat and the door, line up overhead, drop, climb back slowly) mostly sat
and waited. You asked for an attacker: near the cat, attack; an attack is an
acceleration towards where the cat was at the start of it, in a straight
line; then find a new spot near the cat and go again. That is what it does
now, in four phases (idle, stalk, charge, recover; see `objects/CLAUDE.md`).
Calls of mine inside that:

- **It stalks from the side it is already on**, `standoff` 96px off and
  `hoverAbove` 64px over your head, so you always see where the next charge
  will come from.
- **A charge starts at 80px/s, not from a standstill**, and accelerates at
  1100px/s² to 470: a wind-up you can read, then faster than you can run.
- **It carries on 14px past the locked point**, so a charge at a standing
  cat connects rather than stopping short of its nose.
- **The door is no longer guarded.** Every charge is a moment it is not
  between you and the exit; the fight is dodging and going, not baiting a
  drop. If the arena turns out too easy to run through, a `guard` phase can
  come back between charges.

> **Still open:** whether a charge should be allowed to end *on the cat*
> (it overshoots and brakes beyond you now) and whether the rest should
> start shortening at 1.1s or slower. Numbers in `BOSS`, all of them.

## The beetle can be beaten, on the thorns

**Its spots are its lives.** Four on its back; a sting on the thorns takes
one -- thrown back, squealing, flashing -- and the last one is a slow fall out
of the sky. (There were five for a moment, but the fifth sat under the head
and was never seen, so it looked like four lives that took five hits; four it
is.) The texture is baked once per count, `boss-4` down to `boss-0`,
so the back is the health bar and nothing else is needed on screen. Calls:

- **One patch, one spot.** A sting cooldown of 0.9s, or a beetle lying in a
  patch for half a second would be stripped bare.
- **Lost from the tail forwards**, so the head end keeps its spots longest
  and the loss reads from behind.
- **Knocked back along the reverse of its charge**, up a little, into its
  recover phase: the charge that hurt it ends there.
- **A dying beetle cannot hurt you**: its body is switched off for the fall.

**Shift-click the level name puts it back** (dev only), spots and all, and
the cat back at its respawn point, so the fight can be taken from the top
without a walk or a death. Its dying fall is stepped by
hand rather than tweened, and stepped wherever it is: the first version fell
out of the awake range and hung there, faded, for ever.

**The arena needs thorns for any of this to matter.** The volcano has none
in the arena today; `^` wants to go in where a charge at a cat standing in
front of it would carry the beetle through. That is your map.

## No way out until the beetle is dead

**In a level with an `X`, the portals are hidden and cannot be entered until
the beetle has fallen.** Then they come up out of nothing over 0.7s with the
checkpoint's two notes. The fight was optional before -- every charge was a
moment it was not between you and the door -- and you wanted it not to be.
The dev respawn (shift-click) hides the portals again along with putting the
beetle back. Every `E` in such a level behaves the same; none is special.

## Winning, and the score

**The last level's portal leads to `VictoryScene`** -- "You actually won!",
your words, in gold on black -- instead of looping back to the forest. The
dev level-skip still wraps round, so the forest is one Cmd-click past the
volcano in a dev build.

**The score is a clock, and lower is better**: every second in a level, plus
`SCORE.deathPenaltyMs` (a minute) per death, shown as one time with the sum
written out beneath it. Calls of mine:

- **The clock runs through dying and leaving**, and stops only on the title
  and while paused (`update` does not run then). A death's 650ms pause
  therefore counts twice, once as time and once as the minute; it is small.
- **It carries from level to level** in the `scene.start` data, next to
  lives and hearts, and through a hot reload in the snapshot.
- **Game over does not show it**: a run that is lost has no score.
- **The clock runs in the HUD too**, top left over the level name, at your
  word, with the little-heart count moved to the right under the lives: the score
  as it stands, to the second, jumping a minute at a death. `src/score.ts`
  holds the sum and the format so the HUD and the victory screen agree.

## The victory screen is daylight, and says "Time"

**A positive background**: the sunlit forest, run the way the title screen
runs it (title-mode `GameScene` launched underneath), coming up out of the
black the volcano left, with a soft dark band behind the words so they read
against the trees. **"Time", not "Score"**, at your word, and the deaths said
plainly: `5:06 played · died 2 times (+2:00)`, or `never died!`. The minute
per death was already added the instant you die; the HUD clock now flushes
red for 650ms as it jumps, so the cost is seen.

## The game is going to live at catnah.rijkhof.nl

**A custom domain, not a repo rename.** You wanted a URL without a capital
to say out loud; renaming the repo to `catnah` would have killed the old
`/Catnah/` link and every installed copy. A custom domain on the same repo
serves the game at the root of `catnah.rijkhof.nl`, and GitHub redirects
the github.io URL to it, so everything old keeps working.

**Vite's `base` is `./` now**, relative, so one build serves from `/Catnah/`
and from `/` alike -- there is no moment where the site is broken while DNS
catches up. The manifest, icons and service worker were relative already.

The CNAME took DDS about two hours to publish; once it pointed at GitHub
the custom domain went into the repo's Pages settings, GitHub requested the
certificate, HTTPS was enforced when it arrived, and the README link moved.
`drijkhof.github.io/Catnah/` redirects there, so old links and installed
copies keep working.

## No Space: up is the jump

**"Spatie niet meer gebruiken, onmiddellijk."** So `↑`/`W` is the jump on a
keyboard, and the only one. The split that Space existed for -- climb a rope
without leaping, leave it with a straight jump -- survives on one key by
**order and edges**: grabbing wants up *held* and runs first, leaping wants
the jump *edge* and only listens once the cat is already climbing. So beside
a rope one press grabs, holding climbs, a second press leaps; in water
holding swims up and a fresh press is a stroke; wall jumps are a press
against a wall. Measured: 86px ground jump, grab-climb-leap in that order,
stroke at -280px/s. The touch stick pushed up still never jumps; the button
does. The earlier `CAT.upAlsoJumps` half-step is gone with Space.

The one habit this punishes: tapping `↑` repeatedly while climbing leaps
off the rope on the second tap. Holding is climbing; tapping is jumping.

## The desert, level 6

**After the volcano, as you asked**, so the volcano's portal -- the one the
beetle guards -- leads out into the open, and the desert's portal ends the
game. Your brief: camels to jump on that cannot kill you, mounds in the sand
that long worms come out of, a few rocks, cacti that kill if you stand on
them, no hedgehogs, and pyramids for a backdrop. Calls of mine inside that:

- **A camel ambles, slowly, and carries you.** It stood still for an hour
  at your word and then you wanted it walking again: 20px/s, turning at
  walls and edges like a hedgehog, not pushable so the cat never shoves it,
  and the rider carried by hand each frame. Its body is its back only, from
  the hump tops down, so the cat stands on the humps rather than at the
  height of the head. Drawn with long legs, two humps, a curved neck and a
  dark muzzle; the worm got thinner at the same time.
- **A camel turns two tiles short of a cactus**, at your word, so it never
  carries you into one: the scene hands every camel the cactus rectangles as
  fences, and `pace` turns at a fence like at a wall.
- **The rider is carried by the camel's actual movement**, not its
  velocity. The first version used the velocity, and you slid off the back
  whenever the camel pressed against something and went nowhere.
- **Back: title first, then out, at your word.** One history entry is
  pushed when a run starts and taken back when the run ends (game over,
  victory, or back itself), so the title never has an entry of its own and
  back from there is the browser's plain back -- the exit. Back during a
  run, or on the game-over or victory screen, pops our entry and goes to the
  title. A reload mid-run takes the leftover entry back on load, so the
  first back on the title still leaves. The run lost to a back press is
  not saved anywhere; neither is one lost to a game over.
- **The empty score board, and the game over with no word on it**: the
  same thing. Phaser's fullscreen wraps only the canvas in a fresh element,
  and a browser shows nothing outside the fullscreen element -- so from the
  moment the title's keypress went fullscreen, every word (now HTML beside
  the canvas) was invisible, box and picture intact. Fullscreen now takes
  the game's own container, canvas and text together.
- **"After game over you don't return to the title"**: you did, for a
  few milliseconds. The title took any input the instant it appeared, and a
  key still held from the death auto-repeats `keydown`, so the same key
  that dismissed the game-over screen started a new run through the title
  before it could be seen. Now neither screen listens to repeats, and the
  title holds half a second before it listens at all.
- **All text crisp, at your word.** The canvas is 640×360 (less on a
  phone) stretched to the screen, so any word drawn on it is upscaled in
  blocks like the sprites. Rather than render the world at device
  resolution -- which would touch every camera, HUD and touch-zone
  calculation -- text moved off the canvas into Phaser's DOM layer: one
  `<div>` per text, kept over the canvas by the Scale Manager, drawn by the
  browser. Same font families and sizes as before, so nothing moved; the
  canvas stroke became a CSS text-stroke painted under the fill. Two
  consequences handled: the layer is above every canvas fade, so the level
  name and the victory words fade by hand alongside; and the words take no
  pointer events unless made interactive, or they would steal touches from
  the stick. The dev shortcuts on the level name now get native pointer
  events. The monospace family stays; a nicer face is now a one-line
  change, if you want one.
- **Records and totals, at your word**: fastest time and fewest deaths as
  the records, and played time, little hearts, big hearts and deaths as
  the totals. Calls of mine: records come only from a *won* run, because a
  fastest time for a run that stopped halfway is not a time; totals count
  as they happen, so an abandoned run still adds up; the fastest time is
  the score (clock plus the death minutes), the same number the victory
  screen calls Time, not the bare clock; it is all per device in
  `localStorage` (`catnah:stats`), since there is no server -- the
  anti-cheat replay question from earlier stands if that ever changes;
  time is written out every five seconds and on the tab going away, the
  rest the moment it happens; shown on the title screen down the right-hand
  side, each value under its name, at your word, and only once anything has
  been played, and on the victory
  screen as "New record" in gold or the best to beat in grey. Wins are
  counted too, since they were free. Then, at your word, records went
  **per version** -- keyed by `__APP_VERSION__`, which already carries the
  deploy's run number (or the commit hash on a laptop build), so each build
  has its own fastest time and fewest deaths and old ones stay in storage
  under their version -- while the totals stay all-time, as you said.
- **The order of the levels is yours**: beach first, desert second, then
  the forest through to the volcano -- which makes the beetle the end of
  the game, since the volcano's portal is the one that leads to the victory
  screen now. The level headers and `work.md` are renumbered to match; the
  level files themselves did not move.
- **The beach, level 1 now, at your word**: sea behind, sand underfoot, the map
  kept to one example of each thing. Calls of mine: the crab is the
  hedgehog's letter and the gull the crow's, decided by the place (the
  parser maps `h` by theme; the level definition says `crowBehaviour:
  'swoop'`), so every level is written with the same letters; the crab sees
  110px sideways and about its own height, chases at 115px/s (the cat runs
  190) and stops at edges rather than turning; the jellyfish is a static
  mine, the crab's size as you asked, and lies *on the sand* at your word
  -- washed up, pulsing, not floating as I first had it; the palm's crown
  is big at your word, fronds that reach well out and droop below the top,
  and the example palm is nine tiles tall; then, at your word, the palms
  went the way of the castle: one picture per tree, a `TT` pair being one
  big palm (wide trunk, crown at 1.6×) and a lone `T` a small one (crown at
  0.9×), the trunk its own baker (`art/palm.ts`) with frond-scar rings and
  a flared foot rather than the forest's bark; and the crown is two
  layers at your word -- the back fronds and the coconuts behind the cat,
  four front fronds in front of it at depth 0.6, like the bushes -- so the
  cat is in among the leaves; you built a sand castle out of
  `R` and asked for it to look like one with flags on the towers, so on the
  beach `R` is pressed sand (`rockStyle: 'sand'` in the palette) rather
  than boulders -- and, at your word, one picture per castle rather than a
  grid of blocks: every cluster of touching cells is baked as one mass with
  edges only along its outline, the sky-facing cells notched into
  battlements and a flag on every run of two or more top cells (my reading
  of "tower"; a single top cell is a merlon and gets none). `Q` is the
  gate, as you used it: an arched dark doorway over the run of `Q`s, still
  solid, since a walk-through gate would be a hole in the map rather than
  a letter; the gull's swoop is aimed
  once and committed to, skimming 20px above the feet so a standing cat is
  hit and a sneaking one is passed over -- ducking is the dodge, which is
  what makes it a different attack from the crow's chase; the palm is the
  theme's climbable trunk with a crown on top and a ledge to stand on, and
  the beach's `T` is therefore climbable; the sea is three tiling bands
  pinned sideways and drifting, with a foam edge that creeps up the sand,
  rather than a parallax strip that would run out; the ambience is the
  wind; and sailboats on the water at your word -- three, far out, tiny
  (a hull, a mast, two sails, one with a red band), pinned sideways like
  the sea and drifting across at their own slow paces, two one way and one
  the other, sliding off one edge and in at the other so there is always
  one about; the higher on the band, the smaller, and the near water's
  crests pass in front of the hulls. A gull cry of its own is not made yet -- it uses the crow's caw.
- **Cacti may be stacked, at your word**: a column of `Y` is one cactus,
  one tile taller than the column, baked at that height with arms every
  14px alternating sides, and one deadly rectangle; the camels' fences see
  it as one too.
- **Landing on a camel had to be 100%, at your word**, and it was a coin
  toss: Arcade's collision between the two moving bodies chose the sideways
  push near the edges of the back, and the snap I added on top was undone
  by Arcade itself, which moves the sprite by the body's fall *after* the
  scene's update. So the cat has **no collider with a camel at all** now;
  standing on one is geometry, every frame, before the cat's own step: over
  the back, not rising, feet at the top or crossing it this frame means
  standing on it, with the body snapped as well as the sprite. Measured 64
  of 64 drops and every jump that reaches the back. A jump that falls short
  of the back by a pixel still falls short; that is the jump, not the
  landing.
- **The worm is a Dune worm, at your word**: it hunts a cat that comes
  near, lunges *at* it rather than straight up, surfaces anywhere along its
  sand and dives in anywhere, and the ground shivers first. Then you made
  the order concrete: up out of the hole without warning while the cat is
  still at a distance, a look at it, back down, the crawl toward it with
  the hole, and only close by the shake and the attack -- and the looking
  about stays on the worm's own clock, at your word: *that* is the coming
  up without warning, so a worm looks about every 1.8 to 3.6 seconds
  whether or not anybody is there, and the hunt starts from the look that
  finds you. My calls inside that: the look leans up to 25° toward the cat
  and turns with it, 900ms up; the worm
  forgets the cat once it is back home, so the next approach gets the look
  again; a cat that drops in right beside the hole gets no look, only the
  churn; it travels at 55px/s, slower than the cat runs, so it can be outrun
  and only catches a cat that stops; it hunts within 150px and lunges within
  48px, which is what a 44px lunge leaning 70° can actually reach; the
  ruffle before the lunge is 550ms, sized so that a cat standing right on
  top of the worm can see it, turn and run clear (50px at 190px/s is
  265ms, and a player needs a moment to notice), and it lets the cat go if
  it steps away; the sand ripples while the worm sneaks along under it; after a lunge there
  is 1.1s under the sand before the next, which is the gap to run through;
  its sand is the run of open floor either side of its mound, ended by a
  rock, wall, cactus or drop, so it cannot follow you up a shelf or past a
  cactus; a cat on a shelf above the sand is out of reach and not hunted;
  and the peek stays, straight up and slower, as the warning that the sand
  is lived in. A worm whose mound sits in a one-tile pocket can only peek
  and lunge in place. The ripple is the mound sprite itself moving; a trail
  of disturbed sand would look better and is not drawn yet.
- **The ride is geometry, not the touching flags.** Those flicker every
  other frame -- gravity drops the cat a hair, the collision lifts it back
  -- and a rider carried on half the frames fell behind, reached the edge
  of the back and was pushed off. Now: feet within a few pixels of the
  back's top and over it, not rising, means riding, every frame, and the
  feet are set on the back. Measured: the camel walks at 20px/s and turns at
  its fences; over 400 frames with a turn in them the cat stayed on,
  drifting a dozen pixels on a thirty-pixel back, then walked off the end
  and jumped off at full height.
- **A worm is a clock and a cropped picture**, not a body: hidden 1.8-3.6s,
  up in a third of a second, tall for 1.1s, down in half a second; the part
  that is out is what kills. The mound is drawn in front so it comes out of
  the sand. It makes the rat's scurry as it surfaces.
- **Cacti kill from any side**, two tiles tall, inset 4px from the tile's
  edges, with none of the thorns' mercies: no crawling under, no jumping
  out. "If you stand on it you are dead" -- and if you walk into it.
- **Pyramids, not dunes.** Two ranks on parallax, lit from the right, with
  courses of stone and a paler capstone; the forest's sun, whiter and
  higher; the swamp's mist tinted sand as heat shimmer.
- **The map is a first pass**, 108 tiles -- about the forest's 97 and the
  volcano's 104, as you asked -- laid out by a script and frozen: flats
  with low sand dunes, five sandstone shelves, four camels, six mounds -- three of
  them in the first stretch -- six cacti, a checkpoint halfway. It is yours to reshape.

## Worms are afraid of camels

**Your rule, as said.** With a camel within 40px of its mound (`WORM.fearRange`)
a hidden worm stays hidden, and one that is up sinks at once, taking as long
to go down as it had come up. It gives the camel a job: its back is the safe
way over the mounds, and walking the same ground on foot is the gamble.

## Quitting to the title

**Double-tap the time, as asked.** Two taps within 350ms (`TOUCH.doubleTapMs`)
on the clock in the top-left corner end the run and fade to the title, the
same way back does. The clock is now the one HUD word that takes touches;
it sits well clear of the stick and the jump button. Decided without you:

- **Escape does the same on a keyboard**, one press, since every feature has
  to work with both. If a stray Escape mid-run turns out to cost runs, it
  can be made a double press like the tap.
- **No confirmation**, as you said: the second tap is the confirmation.
- Ignored while a game over is on screen, which is already on its way to
  the title.

## The title's hidden back button

**As asked:** the same spot and size as the clock, double-tapped, on the
title screen. It calls the browser's back, which is what the back button
does there: it leaves the game. Decided without you:

- **A double tap, not a single**, to match the time in the game and so one
  stray tap on the title never closes the app. Say so if you want one tap.
- **No key for it on a laptop.** The browser's own back button is already
  there; an Escape that navigated away from the page would surprise.
- **It may do nothing in an installed app.** A page cannot close itself: if
  the game was opened straight from the home screen, there is no page to go
  back to and the browser ignores the call. In a browser tab, and on a phone
  that came to the game from another page, it goes back.

## The city and the sand path, and a new order

Asked for: the levels in the order city, forest, canopy, swamp, cave,
volcano, desert, beach, sand path; a city as long as the other levels with
houses, rats and drainpipes, and houses that are not ugly; and a sand path,
stones with a bit of green and sand, leading to a big portal.

- **The city is a Dutch street at night, in the rain** (asked for after the
  first version, which was a sunny morning). I read "not ugly" as tall
  narrow canal houses: stepped gables in white stone, sash windows, flower boxes, shutters, doors with fanlights, a
  different brick or plaster for every neighbour.
- **The steps of a gable are the steps you climb.** A gable is drawn exactly
  on its cells, so the roofs are a staircase rather than a slope painted over
  a flat collision box.
- **Drainpipes are climbable `T`**, topped by a hopper level with the roof;
  **awnings are the city's `=`**, one-way, sticking out of a house's side
  wall. In side view an awning cannot hang over a shop front, because the
  front is the wall the cat walks past.
- **Some houses stand on arches**, walked through, and one low one is
  sneaked under. A doorway in a side view is a hole into a wall, so an
  arcade over the full width is the only way *through* a house that reads.
- **No cars and no crows.** The old city had both, and they are in git
  history. The rain is back, drops and sound as before, and the windows
  are lit about half at random.
- **The big portal is three times the usual size**, and its mouth scales
  with it, so walking into its foot is enough.
- **The sand path is 66 tiles, shorter than the rest**, because "gewoon een
  steentjes pad" read as a short walk to the end rather than a level to
  fight through. Nothing lives on it.
- **The beetle is no longer the finale.** The volcano's portal still only
  opens once it is dead, but now leads on to the desert.

> **Still open:** the city is 104 tiles, against 90 to 109 for the outdoor
> levels. The sand path could be made longer, or given something to do.

## Sneaking: nothing alive can get at you

Asked for: when the cat is sneaking, nothing can get at it -- the same way
the beetle could not reach a cat sneaking in the thorns.

- **Every creature passes a sneaking cat by**: hedgehogs, rats, crabs,
  crows, gulls, spiders, piranhas, worms and the beetle.
- **Lava, cacti and jellyfish still kill a sneaking cat.** I read "niks kan
  erbij" as nothing *reaching* for the cat; those three are things the cat
  walks into. Say if they should spare it too.
- **This makes a lot of the game easier**: a sneaking cat can crawl past
  every walker and the beetle. Sneaking is slow and the pose is lost the
  moment the cat leaves the ground, which is what is left of the danger.

## The big portal pulls from four tiles

Asked for: on the sand path, being sucked in from four blocks away.

- **Four tiles from the portal's rim**, not its centre. The big portal is
  three tiles from centre to rim, so four from the centre would have been
  barely one tile outside it.
- **The pull is the draw-in, started early**: from the moment the cat is in
  range it stops steering and is drawn into the middle, slowly at first and
  faster as it goes, shrinking and fading. There is no tug that can still be
  walked away from.

## Space, the map, and the moon

Asked for: a galaxy with stars and planets that you fly through away from
the Earth, then a map with the Moon, Mars and Saturn where only the Moon can
be clicked, which starts the moon level: little robots that want to grab
you, grey blocks they come out of every five seconds, holding down breaks a
block, and stars and planets behind. And: the robots must be able to get
off the grey block themselves.

- **It comes after the sand path.** Its big portal goes to space now, and
  the moon is the last level: its portal is the win.
- **You fly the cat itself**, no rocket, with the walking keys and stick.
  Nothing can hurt it out there, and the run's clock stops while it flies.
- **The map comes up at 1500px from the Earth, or after 40 seconds**, so
  someone who does not fly away still gets there.
- **Mars and Saturn are shown dimmed** and do nothing when tapped. Nothing
  says "soon"; say if they should.
- **A block lets out at most two robots of its own at a time**, and only
  while the cat is near, or a long wait somewhere would fill the level.
- **Holding down works standing on a block or pressed against its side**, for
  0.7 seconds in one hold. Holding down is sneaking, so robots cannot hurt the
  cat while it breaks one -- the rule asked for earlier.
- **Robots step off any edge**, not only their block's. That is what lets them
  off it; they also follow the cat down into craters.
- **The moon has ordinary gravity.** Lower gravity would make it feel like
  the moon, but it changes every jump; say if you want it.

## The flag, the moon base, and the space helmet

Asked for: the American flag in the background, a moon base you can go into
with a laboratory inside it, and a space helmet whenever the cat is in space.
Then: the base smaller.

- **Flags, three of them**: one on the hills on the horizon, one planted at
  the start and one by the base's door, all behind the cat. Stiff on a rod
  along the top, as on the real moon, where there is no wind.
- **The base is walked through**, a door at each end, sixteen tiles across
  (it was twenty-eight at first), after the tall tower. Nothing hunts
  inside, though a robot from outside can roll in.
- **The helmet is on the moon too**, not only on the flight: there is no air
  there either. It stays on inside the base.

## The alien in the lab, and the map's question under the planets

- **One alien, at the computers**, typing and blinking; it does not walk
  about and cannot be touched. Asked for only as "an alien at work".
- **"Where should we go?" is under the row of planets now**, and comes up
  once they are there, as asked: the planets in a row, and then the question.

## Bob, the robot in the tank, and no robots in the base

Asked for: a little robot growing in the tube in the moon base; standing in
front of the alien starts a talk -- "Hi, my name is Bob", Next, "What a cute
little kitty", and then it ends, and after that he says "too busy"; the
camera zooms in during the talk on the lab, the alien and the cat; and the
robots cannot get into the moon base.

- **Written "Too busy!"**, with the spelling corrected from "to bissy".
- **The last line's button says Bye**, not Next, since it ends the talk.
- **Next is a tap on it, or the jump input**, so it works on a keyboard too.
- **The HUD is hidden during the talk**: zooming the camera would zoom it
  too, and what was asked to be seen is the lab, Bob and the cat.
- **The growing robot loops**: it grows over nine seconds, rests, and starts
  small again, as if the next one is growing.
- **Robots turn at the base's doors**, chasing or not. One already inside
  (none can be, now) would not be thrown out.

## No grey blocks or robots in the cave

A stray `D` had sat in one of the cave's rows for a long time, meaning
nothing, and the day `D` became the moon's grey block it put a block in the
cave, with robots coming out of it. It is gone, and a `D` anywhere but the
moon now stops the level loading rather than slipping through again.

## Bob's story, the rocket, Mars and Saturn

Asked for: Bob also tells the cat the robots have taken over the planets --
the Moon, Mars and Saturn; he needs ten parts to destroy them; he built a
rocket but does not know where Mars is; he asks whether the cat can do it,
and then the cat is sent into space in the rocket. The first time in space
you fly to the Moon and only the Moon can be chosen. The parts are not on
the Moon nor on the Earth. Mars and Saturn have the parts; some easy to
find, some harder.

- **Five parts on each of Mars and Saturn.** "Mars en Saturnus hebben 5
  onderdelen in totaal" read as five each: five in all would never make the
  ten Bob needs.
- **Bob's lines, in English like the rest of the game**: "The robots have
  taken over the planets: the Moon, Mars and Saturn." / "I need 10 parts to
  destroy the robots. I built a rocket, but I do not know where Mars is." /
  "Can you do it, kitty?" -- answered with a **Yes!** button, which launches
  the rocket.
- **The moon has no portal any more**: Bob is the way on, so the base moved
  to the end of the level and the last run of blocks before it.
- **With the rocket, the map opens Mars and Saturn and closes the Moon**,
  shows each planet's parts found ("Mars 2/5"), and each planet's portal
  comes back to the map, so a missed part can be fetched later.
- **Leaving a planet with all ten is the win.** Nothing was said about what
  happens with the parts; the victory screen says "All 10 parts! Bob can
  stop the robots."

> **Still open:** whether to fly back to Bob with the parts and see him
> destroy the robots, rather than winning on the spot.

## Winning at Bob's, a hundred parts, more worlds, and the Death Star

Asked for, in turn: you win when you have given all the parts to Bob; more
planets -- Jupiter, Venus, Uranus, Neptune, Pluto and the ISS -- and Bob
talks about them; the ISS cannot be landed on but is seen in space; lots of
obstacles on the planets; the parts harder to find; Mars and the others
looking good too; no planet with itself in its own background; a hundred
parts needed; and the Death Star, not enterable, with a small readable
"That's no moon" when you come near.

- **The win**: with all hundred parts the Moon opens on the map again, the
  cat lands by the base, and Bob's thanks end in the victory screen.
- **A hundred parts: 15 on Mars and Saturn, 14 on each of the other five.**
  The earlier "five each on Mars and Saturn" is gone with the hundred.
- **Harder to find**: every part is faint until the cat is within about
  three tiles, and they are hidden in cages of grey blocks, down holes,
  among thorns, high up, beside towers, under slabs.
- **The new worlds are each about 250 tiles**, as long as they need to be
  to hold their parts among the obstacles. They were laid out by a script
  from a set of obstacles in a different order per world, then frozen.
- **Each world shows the others in its sky**: Saturn sees Jupiter and
  Uranus, Uranus sees Saturn and Neptune, and so on.
- **The Death Star** is a generic grey battle station with a trench and a
  dish, between the Earth and the rest, so most flights pass it.

> **Still open:** a hundred is a lot to find; the map shows each world's
> count so a missing one can be gone back for.

## Robots keep out of pits

Asked for: robots do not want to go into pits. They turn at the edge of a
gap or a crater like every other walker now; the one edge they still roll
off is the top of their own grey block. A robot written into a crater in a
level (`h` on its floor) stays down there.

## The cat says "That's no moon"

Asked for: near the Death Star, the cat says "That's no moon". It is a
speech bubble over the cat's head now, following it, instead of a line
under the station.

## A robot every fifteen seconds

Asked for: a grey block lets a robot out every fifteen seconds, not every
five, which made it too hard (`ROBOT.spawnEveryMs`).

## The Death Star's laser

Asked for: the Death Star fires lasers, but not at the cat or the planets,
just once every ten seconds into space. Its dish glows for a moment and a
green beam goes out; the way it fires is picked so the beam passes well
clear of the cat, the Earth, the Moon and every planet out there, and if no
way is clear it skips that shot. It is heard only when the cat is within a
screen of it. Nothing it does can hurt.

## Lighter gravity on the other worlds

Asked for: on every planet but the Earth you can jump higher. The moon and
the seven robots' worlds have 0.45 of the Earth's gravity
(`CAT.offEarthGravity`, a level's `gravity`; first 0.6, lowered when asked
for less gravity on the planets): measured, a held jump goes
196px there against 86px at home. Letting go of the jump early cuts it
short by the same share. Everything there falls by it, the robots too.

> **Settled:** real gravity now, per world (`GRAVITY` in `config.ts`),
> asked for "even if it gets in the way of jumping". This was: 0.45 is a gameplay number, not the real one (the moon's is
> about a sixth). Lower makes the obstacles too easy to jump.

## The Enterprise and the Death Star, at it

Asked for: the Enterprise hangs in space too, fires at the Death Star and
the Death Star at it, and both move slowly. The starship is a generic one
-- saucer, neck, hull, two nacelles -- going round the station once every
seventy seconds; the station drifts round a small circle once every ninety.
The station's laser now goes at the starship when the way is clear (else
into empty space, as before); the starship's phaser goes at the station
every seven seconds when its way is clear, else it waits. Nothing is ever
fired at the cat or across a planet, and nothing is hurt.

## Ten parts again

Asked for: ten parts to find, not a hundred. Two each on Mars, Saturn and
Jupiter, one each on Venus, Uranus, Neptune and Pluto. The ones kept are
the best hidden: every world's part down a hole in the ground along a low
pocket, and the second on the three with two in a cage of grey blocks. The
other places a part used to be have a little heart now, as far as the
level's budget of hearts allows, and are empty after that -- including the
pillar past Saturn's portal.

## Each world its own obstacle, its own look, and no more map

Asked for: the levels not all with the same obstacles but new, more fun
ones; every planet its own colour and look; and no menu of planets --
fly to a planet, and its level starts.

- **One obstacle of its own per world**, found nowhere else: worms on Mars,
  lava on Venus, seas to swim on Neptune, bounce pads on Uranus, moving
  clouds on Jupiter, slippery ice on Saturn, crumbling ice on Pluto. Bounce
  pads, moving platforms, crumbling ice and slippery ice are new to the
  game; worms, lava and swimming were already in it. Some plain pieces --
  thorns, a tower with a chain, a slab -- are still between them.
- **The worlds are shorter now**, 105 to 160 tiles, being built around one
  idea each rather than everything at once.
- **Each world's own ground**: fractured rock for Venus and Saturn, a cloud
  fringe for Jupiter, ice tiles for Uranus, frost for Pluto, dust for Mars
  and Neptune, each in its own colours.
- **The map is gone.** The worlds hang in space round the Earth, and
  flying into an open one lands on it. The question "Where should we go?"
  went with the map; the hint at the top says where to go instead.
- **Arrows at the screen's edge** point to the open worlds out of sight --
  nothing asked for this, but space is big and a planet off screen is easy
  to lose.

## Hit by the Death Star's beam, and Bob's warning

Asked for: if the Death Star fires and you get in between, you are hit and
lose the parts; and Bob also says "but look out, there are not two
moons...".

- **The station still never aims at the cat.** It is flying into the green
  beam while it is there -- most of its 0.7 seconds -- that hits.
- **Hit costs every part found**, not one: they go back where they were on
  their worlds, to be found again, and the counts under the planets drop.
  With all ten lost the Moon shuts again. No heart is lost.
- **The starship's orange phaser does not hit the cat**: only the Death
  Star's was asked for.
- **Bob's line is written** "But look out: there are not two moons...",
  just before "Can you do it, kitty?".

## Every part well hidden

Asked for: in every level the parts well hidden. Each world hides its own
way now, mostly with its own obstacle: under a slab and in a cage on a
tower (Mars), in a room inside a rock (Venus, and inside cloud on Jupiter
and ice on Saturn), in an underwater cave (Neptune), on a shelf above the
screen off a bounce pad (Uranus), at the end of a high cloud ride (Jupiter),
behind thorns under the ice (Saturn), and down a pit under a crumbling
bridge (Pluto). Each was tried in the game: every one can be reached, and
left again.

A bounce pad throws harder now. The cat's speed is capped for falling, and
the cap held going up too, so a pad could never throw it higher than about
two hundred pixels; the cap is lifted for a bounce until the cat starts to
fall.

## Sneaking: only birds, and the beetle under the thorns

Asked for: sneaking under the spikes only works against the evil beetle,
and against no other animal except birds. So a sneaking cat is safe from a
crow or a gull anywhere, and from the beetle only while it is in thorns;
hedgehogs, rats, crabs, robots, spiders and worms get it sneaking or not.
This replaces "sneaking, nothing alive can get at you" above. Breaking a
grey block on the moon is no longer safe with a robot coming.

## The internet

Asked for: back on the moon Bob has built a machine, puts the parts in,
says "well thank you kitty, I'm sorry", and the machine zaps the cat into
computer levels: YouTube, Insta, Facebook, Catnah, the dark web. Cables to
scratch through with your claws; spikes the only enemies; on the dark web
hackers who lead you the wrong way to your death. Decided without asking:

- **The win moved** from giving Bob the parts to leaving the dark web.
- **Bob's lines**: "You found all 10 parts!", "Well... thank you, kitty.",
  "I'm sorry.", and the button **Huh?**. The parts fly into the machine as
  the talk starts.
- **Scratching is holding down** against a cable, the same gesture as
  breaking a grey block on the moon: there is no claw button, and a new
  button would be one more thing on a phone screen. 900 ms of one hold.
- **Cables are twelve tiles tall**, so a jump plus a wall jump off the cable
  (about 172 px) cannot get over one: the only way is through.
- **No real logos.** Each site is drawn as what it is about, in its
  colours: videos, photos, thumbs up, cats, skulls. The names are the level
  names.
- **Hackers are signs, not monsters**: they do not hurt; the lie does. Each
  points at a way that kills -- spikes too wide to jump, a hole, a stair
  that ends over spikes -- and the safe way is the other one. They speak
  one line each when the cat comes near.
- Earth's gravity in the internet, and no helmet.

## The bar on Pluto

Asked for: a bar on Pluto with aliens in summer-coloured T-shirts; talk to
the bar alien, "Hi cat, what would you like to order?": a life for 50 pink
hearts, milk for 10, rocket fuel to fly ten times as fast. Decided
without asking:

- **Rocket fuel costs 30** -- no price was given.
- **What milk does**: gives back one lost heart, and is refused when the
  cat is not hurt. A life adds a heart to hold *and* fills it.
- **Rocket fuel lasts the rest of the run** and makes thrust, top speed and
  drag in space ten times as much, so stopping is as quick as going.
- The bar stands at the very start of Pluto, so it is found; robots are
  kept out of it like the moon base.
- The menu is picked by tapping, or left/right and jump: no new buttons.

**Later made a hut with an inside**, as asked: on Pluto a hut with a door;
through the door, a level of its own with only the bar, zoomed in like
Bob's talk; walking out, back outside. Decided without asking:

- **Walking into the doorway** goes through it, no button; arriving in a
  doorway does not send you straight back (you have to step out of it
  first).
- **Pluto is remembered as you left it** -- hearts taken, checkpoint, the
  cat in the doorway -- so going in and out is not a way to collect its
  hearts again. Robots and grey blocks do start over.
- **The helmet stays on inside**: it is still Pluto, and a game over in
  there is a game over in space.
- Zoomed in twice; the HUD and the bar's menu are drawn by a second camera
  that does not zoom, so they stay where they always are.

**Later changed**, as asked: milk fills every empty heart, and rocket fuel
lasts a while with a meter beside the hearts. Decided without asking: a
tank is **20 seconds of flying with the thrust on** (`BAR.fuelMs`) --
coasting burns none; it can be bought again once some is used; and the
hearts are now shown in space as well, where the meter matters and the sun
can take one.

## The Death Star is an easter egg

Asked for: "I cannot find the Death Star nor the Enterprise" -- then no red
arrow to it: it is an easter egg. It hung far out down and to the right,
where nothing else is. It was moved to half as far, and then back: it is
better in its old place (Earth + 900, 950), still with no arrow or name.

## Real gravity on every world

Asked for: the gravity on the other planets should be about right, even if
that gets badly in the way of jumping. Each world now has its own
(`GRAVITY`): Moon 0.165, Mars 0.38, Venus 0.9, Jupiter 2.53 (at the cloud
tops; a gas giant has no ground), Saturn 1.07, Uranus 0.89, Neptune 1.14,
Pluto 0.063. Decided without asking, so that nothing becomes impossible:

- **Every rock with a room inside got a chain up its side** (Venus,
  Saturn, Jupiter): seven tiles is out of reach of a jump on those worlds,
  and parts are in there.
- **Jupiter's clouds ride one tile off the floor**, not three: a jump there
  is 31 px, under two tiles. Its first patch of thorns is one wide, not two.
- **Bounce pads throw as high everywhere** -- scaled to the level's gravity
  -- or Uranus's high shelf, with its part, would be out of reach.
- On the Moon and Pluto a held jump goes to the top of the level; letting
  go early makes it as short as you like.
- Piranhas still leap as high as on the Earth.

**Later made less extreme**: asked for less variation, still right for the
planet, "linearly". Each world keeps 40% of its real difference from the
Earth (`GRAVITY_KEEP`, `GRAVITY = 1 + 0.4 x (real - 1)`): Pluto 0.63, Moon
0.67, Mars 0.75, Jupiter 1.61. The 40% is a judgement call. The moon's
secret island got three stone shelves up to it, and two of its high
islands one shelf each, since a jump no longer reaches them from below.
**Still open**: the request ended "dus op pluto willen ..." -- what was
wanted on Pluto is not known.

## No parts in the water on Neptune

Asked for: on Neptune no parts lying in the water. The underwater cave is
gone (its sea stays, without the cave); the part is in a rock with a room
inside, up a chain, like Venus's, Saturn's and Jupiter's.

## Game over in space: back to the moon

Asked for: a game over in space starts you again on the moon. "In space" is
taken as any level with the helmet on -- the moon and the robots' worlds;
the internet is not space, and a game over there still goes to the title.
Kept: the parts found, Bob's rocket, rocket fuel, the little hearts and the
clock. The hearts start again at three (the most held this run is kept as
the number of heart slots).

## A secret place on the moon

Asked for: on the moon a kind of secret level up above -- jump up and find a
part there and two robot boxes. Decided without asking:

- **Still ten parts**: the moon's comes from Jupiter, which had two and has
  one now (its cloud room holds a spare heart instead). So the moon has a
  part after all, where it had none.
- **The Moon stays open in space while its part is still up there**, even
  in Bob's rocket, or a cat that missed it could never finish. Landing
  there again, Bob tells his story again and sends you off again.
- The island is solid rock, so it is reached by jumping past its edge and
  steering on, not through it. A trail of four hearts going up is the hint.


## The sun, and the worlds going round it

Asked for: a sun you cannot walk on and die near; every planet going round
it at its logical speed, in proportion, but the slowest still visibly
moving. Decided without asking:

- **The distances are squeezed**, not real: the real ones would put Pluto
  a hundred times further out than Venus. The order is right, each orbit
  far enough from the next that two worlds never overlap.
- **The times round are real**, in Earth years, with an Earth year of 50
  seconds (`SPACE.yearMs`). Pluto then moves about a pixel and a half a
  second; Venus goes round in half a minute.
- **The Moon is not in proportion**: its real month is 2 Earth-year-days
  of play, under four seconds round -- it could never be landed on. It
  takes 40 seconds (`SPACE.moonMonthMs`).
- **Burning is a death**: a heart lost, set off again beside the world you
  came from; the last heart is game over and back to the Moon, as for any
  game over out there. God mode only throws you back.
- The Death Star stays where it was in space (down and to the right of the
  middle), now between the orbits of Mars and Jupiter; planets may pass
  behind it. **Later**, as asked, it goes round the sun too, with no ring:
  four Earth years a time round, between Mars's 1.9 and Jupiter's 11.9.

## Coins, and steering from inside the rocket

Asked for: 20 coins from Bob the first time he is spoken to; the bar takes
coins, not hearts; rocket fuel about three times as fast, lasting ten times
as long; on the keyboard in space, up flies forward and left and right turn
the rocket. Decided without asking:

- **Prices**: first a life 10 coins, milk 5, rocket fuel 5; then, as asked,
  a life 20, milk 30, rocket fuel 40.
- **The coins come with a line of his**: *"Here are 20 coins for the trip.
  You can buy things with them."*, before *"Can you do it, kitty?"*. Told
  the story again (the moon's secret part), he leaves it out and gives none.
- **Fuel**: 3x, and 200 seconds of flying with the engine on.
- **The steering from inside the rocket was taken out again**, as asked:
  space is steered by the screen's directions, as before.
- The coins show in the corner under the parts, once there are any.

## Coins hidden in the levels, and none of Bob's parts on the Moon

Asked for: a coin in some levels, 100 coins at most, 20 from Bob, 10 to find
on the Earth and one on every planet but Pluto, well hidden; the bar at a
life 20, milk 30, fuel 40; then no parts on the Moon. Decided without
asking:

- **"100 coins in total" is read as the most you can carry** -- there are
  only 37 to get (20 + 10 + 7), so it is a ceiling, not a count.
- **The Earth's ten**: one in each of its nine levels and a second in the
  city. **Hidden** means high or tucked away, and faint until the cat is
  near, the way parts are. Several sit beside a spare heart's spot, which
  is already somewhere that takes getting to.
- **The Moon's part went back to Jupiter** (its cloud room, where it was
  before), so there are still ten; the Moon's secret island has the Moon's
  coin instead. The Moon no longer stays open in space for a missed part.
- A coin found is kept found for the run, like a part; a game over that
  goes back to the Moon keeps them too.

## Fewer robots

Asked for: fewer robots. A grey block now lets one out every 30 seconds
(was 15) and only while its last one is gone (was two at a time), and half
of the robots placed at the start are gone on the Moon (6 to 3) and Mars
(4 to 2), the two worlds that had the most. The other worlds kept their
three or four.

## The fourth internet level is Google

Asked for: Catnah becomes Google. The level, its theme and its name are
Google now; its look went with it -- the orange of the cat became a white,
bright board with a blue line, and the paws and cat faces in the sky became
magnifying glasses and search bars with four coloured dots. No real logo,
like the other sites. The layout is unchanged.

## More obstacles on the internet

Asked for: more obstacles in the internet levels. Added by hand on the
floor of each, in the stretches that were empty: YouTube six (spikes, a
block, a hole, a three-tall block before the exit), Insta four, Facebook
three, Google three, the dark web four. Still only spikes as enemies, as
asked before; every exit still reachable.

## The end: out of Bob's machine, and Bob is gone

Asked for: after the internet you come out of Bob's machine and Bob is
gone; then the game is over for now, "Bob Be Back" in Catnah 2. Decided
without asking: it is a short scene, not play -- the cat appears out of
the machine with a flash, looks left and right, "Bob is gone..." comes up,
and after six and a half seconds the victory screen, whose second line is
"Bob Be Back — in Catnah 2" instead of the parts. The moon's robots are
still about, but the cat does not move and they keep out of the base.

## Jumping on robots

Asked for: jump on a robot and it breaks into little parts, and after ten
seconds it puts itself back together and moves again. Decided without
asking: the cat bounces off (three quarters of a jump), the bits shiver
for the last second and a half as a warning, and a robot never mends on
top of the cat -- it waits until the cat has moved off its spot. Only
landing on it from above breaks it; walking into it still costs a heart.
The bits are pictures, not the ten parts Bob needs: nothing to pick up.

## The bar keeper serves, and throws you out

Asked for: zoom in when talking to the keeper; milk poured into a glass,
a life handed over, rocket fuel filled into a tube beside him, all for
coins; prices life 10, milk 20, fuel 25; keep ordering what you cannot pay
for and he closes, says you are just like his old friend Bob, throws you
out, and says "closed" when you try to come back in. Decided without
asking: "keep ordering" is three times in a row (the second time is a last
warning; buying something resets it); the bar stays closed for the rest of
the run (a game over keeps it closed too, like the coins), shown by planks
across the hut's door; you pay when you order and get it when he has made
it, about two seconds; the menu moved to the top of the screen so the
zoomed counter is visible under it.

## No arrows to a finished planet

Asked for: no arrows to a planet whose parts are all found. Its name stays
gold and it can still be flown into; only the arrow is gone.

## Things to find and sell

Asked for: wallets, candy and hats to find in ten levels, kept for the
run, sold to the bar keeper; a man at the start of the desert who only
buys a cap/hat, for 15 coins; unused rocket fuel sold back for 10.
Decided without asking: "hoed" and "pet" are the same thing, a straw hat;
one thing in each of ten levels (all nine on the Earth and Mars), on the
ground mid-level rather than hidden, since the ask was to find them, not
to hunt for them: wallets in the city, swamp and sand path, candy in the
canopy, cave, desert and on Mars, hats in the forest, volcano and beach --
so a hat can be found before the desert. The keeper pays 10 for a wallet,
5 for candy, 10 for a hat (the man's 15 is the better deal, the reason to
go to him). "Not used yet" fuel means a full tank. The man buys any number
of hats and wears one from the first.

## The black blocks with green stripes

Asked: no black blocks with green stripes in the forest or anywhere.
That pattern is what the engine draws when a picture is missing, but on
this machine no level has one -- every level was checked, on a laptop and
in the phone view. Still open: where exactly, and on which device.

## Back beside the planet, and the lasers kill

Asked for: coming out of a planet's level you should be beside that
planet, wherever it has moved to; the Death Star should fire at the
Enterprise (it often fired out into empty space, to keep its beam clear
of the cat and the planets); and they should fire even with the cat in
between, which kills it. Decided without asking: both beams kill, the
station's and the starship's; dying in a beam is a heart lost like in
the sun, and the old rule -- a hit loses every part found -- is gone, the
heart being the price now. Beams may cross a planet.

## Sunlight on the planets

Asked for: the light on the planets to match where the sun is and their
turning. Done by taking the light out of the pictures and laying it over
them, turned to the sun, instead of turning the whole picture (which spun
Jupiter's bands round and left Saturn always lit from the left). Decided
without asking: the planets do not spin on their own axes -- "their
turning" read as their going round the sun; in a level's night sky, with
no sun drawn, the light comes from the left.

## What the cat says when it finds something

Asked for: no "+1 wallet" on a pickup (coins keep "+1 coin"); the cat
says "is dis from some whon?" or "why do pheaple drop things?"; "+20
coins" when Bob gives the coins. Written as "Is this from someone?" and
"Why do people drop things?", taking turns rather than at random.

## Planet sizes, and eclipses

Asked for: sizes in the real order (the Earth was far too big -- four
times Venus, bigger than Jupiter), and an eclipse of the Moon. Decided
without asking: sizes are the real ones to the power 0.4 around an Earth
of 140 px (the same squeeze as gravity): Jupiter 368, Saturn 344, Uranus
244, Neptune 241, Venus 137, Mars 108, the Moon 83, Pluto 71. The orbits
moved out to make room -- and then further, asked for when Saturn's ring
crowded Uranus: Mars 1250, Jupiter 1900, Saturn 2750, Uranus 3500,
Neptune 3900, Pluto 4250, the Death Star between Mars and Jupiter at
1500; space is 9600 px across, the Moon in to 250 round the Earth, and the Death Star's own
little circle smaller, so it stays clear of Mars and Jupiter. An eclipse
of the Sun came with it: the Moon's shadow on the Earth. Both happen every
time round, since everything here is in one flat plane.

## Someone drowned by the swamp's wallet

Asked for: a dead body underwater where the wallet is found in the swamp.
Decided without asking: one, on their back on the bottom of the pool just
right of the wallet's rocks, cartoonish (eyes as crosses, weed over the
legs) rather than grisly. A swamp pool behind its water hid it completely,
so it is laid *over* the water, 60% opaque -- seen through the water.
Not tinted green, asked for afterwards: ordinary skin colour. It is scenery: nothing to touch or pick up.

## The desert man's stall: water and a hat

Asked for: the man in the desert gets a stall and buys water (30 coins)
and a hat (10); one water bottle in the whole game, well hidden; one hat
in the game. Decided without asking:

- The water lies at the bottom of the flooded well in the cave (a new
  letter `g`, water with the bottle in it): a dead end you drop into and
  get out of by wall-jumping up its two walls -- tested. It has to be
  before the desert, since the man stands at its start.
- The one hat is the forest's; the volcano's and the beach's are gone.
- The bar keeper does not buy the water. He still buys a hat, for 10.
- The man is behind his counter: it hides his legs, the awning is over his
  head.

## Bob's betrayal

Asked for: Bob thanks the cat, asks one more favour -- its soul, for the
AI of his computer system, to speed up the downfall of mankind --
laughs, and zaps it into the internet. Written in English like the rest
of his lines, one thought per bubble; the button under the laugh is still
"Huh?". Nothing else about the zap changed.

## The sun, like the photograph

Asked for: the sun in space like a photograph of it (a boiling orange ball,
white swirls, a bright rim, flames all round), animated if possible.
Drawn per pixel from noise at boot, no image file -- the portal is still
the game's only bitmap. Animated without redrawing anything: separate
layers turned and swollen by tweens (flames two ways, swirls two ways over
the ball). Its size and how close the cat may come are unchanged.

## Venus, like the photograph

Asked for: Venus like a photograph of it. Drawn per pixel from noise like
the sun (cream cloud, tan patches swept sideways, a white-blue whirl at the
south pole, a pale north cap, a hazy limb), same size, still unlit -- the
sunlight laid over it is what gives it a night side. Not animated: the
photograph is still, and the light already moves round it.

## Uranus, like the photograph

Asked for: Uranus like a photograph of it. Per pixel like Venus: blue-green,
faint bands along the equator, six thin rings and a broad dark one,
leaning over, their near half in front of the ball. The ball is the same
size in space as before; inside its picture it is smaller, so the rings
reach half again past it as in the photograph -- which also makes the
rings bigger where Uranus hangs in another world's sky.

## The planets are NASA photographs

Asked for: the planets based on NASA photographs, high resolution; the Moon
in colour (then not after all: the plain NASA full Moon); the Earth not showing America -- Europe, or unrecognisable.
Decided without asking: which photograph for each (see
`public/assets/CLAUDE.md`), full discs so the game's own sunlight still
makes their night side; the Earth from DSCOVR with Europe and Africa;
Saturn from Hubble (2019), the Cassini portraits being cut off or half in
shadow; Uranus from Voyager 2 (featureless, as it really is) made a little
bluer and kept in the drawn rings, since no NASA photograph in the archive
shows it whole with its rings. The sun stays drawn and animated. These
replace the per-pixel Venus and Uranus of just before.

Still open: the game draws on a canvas 360 game pixels high (252 on a
phone), enlarged to the screen, so a planet in space is at most a few
hundred of those pixels however sharp its photograph.

## No made-up planets

Asked for: every made-up planet and moon that hangs about in space, not
going round anything, gone. The six nameless ones past Pluto are, and so
is the made-up ice world in Jupiter's sky (it was standing in for Europa).
Kept: the moons in the skies of Mars, Jupiter and Pluto (the Moon's photo
standing in for their own moons) -- they are in a level's sky, not
floating in space. Say if those should go as well.

## The Space Bar: tables, soup, whiskey and Whiskey Jones

Asked for (by the player's daughter): two tables, one taken; milk drunk at
a table; soup for 5 coins brought by a little alien walking over the bar;
the bar called the Space Bar; whiskey refused to a cat; the alien at the
table wants whiskey and moans; the cat jumps on the bar and takes
someone's; he says he is Whiskey Jones and not to trust his brother; the
bar shuts, everyone out, never in again. Decided without asking:

- The room is wider to fit the tables (`y` free, `z` his).
- Milk fills the hearts once drunk at the table; the cat walks there by
  itself.
- Soup does nothing but be soup.
- Whiskey stays on the menu at 15 coins, refused, no strike.
- The whiskey is the last guest's at the counter, taken by walking into it
  on the counter top -- a one-way ledge like a branch. Carried, it goes
  with the cat; leaving the bar loses it (it is back next time in).
- Who his brother is is left open.
- The closing is the same shut bar as being thrown out (`barClosed`).

## The Space Bar as a diner, after Spaceballs (a separate commit)

Asked for (by the player, in its own commit, in case the daughter does not
like it): clear references to *Spaceballs*, whose space diner is an old
railway dining car with a neon sign on its roof; the soup is the film's
diner gag; the whiskey is *Leisure Suit Larry*'s bar. Done: the hut outside
is now an old dining car, our own drawing -- dark body, curved roof, a row
of lit windows, wheels under the skirt -- with SPACE BAR over DINER on the
roof, not the film's name or lettering. Not done: Larry himself, or any
character from the film or the game; the whiskey hand-off and the little
soup-bringer are the nods. The inside of the bar is unchanged.
To undo: revert this one commit.

## Touching the ISS

Asked for: touching the ISS crashes it onto the Earth in a mega explosion,
and the cat says "... oops". Decided without asking: it stays gone for the
run (`issDown`, carried like `barClosed`); the cat does not lose a heart,
and the Earth keeps a small crater where it hit (asked for after: a crater, not half the Earth), its edge glowing, with lumps of Earth floating by it; the explosion was made smaller (asked for); for the first 2.5 s in
space it cannot be touched, because the cat sets off right where it goes
round. In English, like everything the cat says.

## Bob's whiskey, the painting, and who the brother is

Asked for: a whiskey bottle on a shelf at the back (right) of Bob's lab, to
take -- and once taken the bar's whiskey cannot be stolen; a painting of
the bar keeper, his brother and Bob, Bob in the middle; Whiskey Jones's
brother named: Bob. Decided without asking: the three are brothers (the
painting shows the keeper, Bob, Whiskey Jones); the bottle is in the bag
(`whiskey`, not for sale) and goes to Jones like the glass; the shelf is
low, by the tank, reached by walking past. The keeper's old line about "my
old friend Bob" is left as it is.

## The Death Star, nicer

Asked for: the Death Star as nice as the planets ("take a NASA photo",
as a joke). Drawn per pixel instead, in detail and scaled down: panels
curving with the sphere, seams, the trench, the sunken dish with a green
focus, lit from the upper left. Its size in space is unchanged.

Then the player gave a picture of it to use: it is that picture now, cut
round (`public/assets/planets/death-star.jpg`), at the same size.

## Real moons, and room round Venus

Asked for: the real moons in the skies, and more room between Venus's ring
and the Earth's (the Moon came close to Venus). Done: Phobos and Deimos
over Mars, Io and Europa (back again, now the real one) over Jupiter,
Charon over Pluto, all NASA photographs, the irregular two cut out by the
dark round them. Venus moved in to 330, the Earth out to 820: the Moon now
passes Venus with about 130 px to spare and Mars with 80.

## Arrows to every open world

Asked for: arrows always shown, also to worlds whose parts are all found,
those as a yellow outline without fill; and a little bigger or smaller by
distance. This undoes the earlier "no arrows to a finished planet". Sizes:
1.35x at 400 px away or nearer, down to 0.65x from about 2850 px on.

## The camper and the fighter

Asked for: a Viper (Battlestar Galactica) chasing a Winnebago (Spaceballs),
small, not too pixelated, a small chance to find, going round after each
other; and in god mode red arrows to them and to the Death Star. Done as
our own drawings, nods rather than copies: a flying camper van and a small
long-nosed fighter, drawn at four times their size and shown smoothed at
three quarters of it (the camper about 33 px), 90 px apart. First round a loop about the sun; then, asked for, flying
about at random anywhere within 4200 px of the sun, always upright, facing
left or right the way they go -- the camper heading for one random spot
after another, the fighter keeping 90 px behind it. They do not shoot, and nothing happens on touching them.

## Bob's rocket, chequered

Asked for: the rocket like Tintin's. Done as a nod in our own drawing, then
redrawn after a photo of the model: a long plain red pointed nose (the
cat's porthole in it), a middle of big red and white squares, a red tail,
two legs curving out to round feet and a stem between them to a third;
drawn four times as fine and smoothed. Same size.

## Borrowed pictures

Decided by the player: the Death Star stays the picture they gave, though
it is not ours; if anyone ever asks, it comes out (back to a drawing of
our own). Everything else borrowed is a nod drawn our own way, or a NASA
photograph.

## Load times on a phone

Asked for: acceptable load times on mobile connections, as little work at
run time as can be done at build time, measured, with no loss of quality.
Measured as a phone on Lighthouse's mobile profile (Slow 4G: 562.5 ms round
trip, 1.47 Mbit/s; CPU four times slower), cold cache. Targets looked up:
Google calls a main picture within 2.5 s good and over 4 s poor; for web
games 3-5 s to playable, with many players gone past about 6 s.

- Before: the title after 9.0 s -- the script by 3.6 s, then every planet
  photograph (880 kB) and every picture drawn, 0.8 s even on a laptop.
- Space's pictures are no longer loaded at boot: fetched in the background
  once the title is up, waited for only by a scene that needs them first.
- The heavy pictures (sun, Uranus's rings, sunlight, rocket, camper,
  fighter) are drawn at build time (`npm run bake`, in the deploy) and
  shipped as files: no phone works them out.
- Phaser's build without Matter physics (never used): 110 kB less.
- The portal in the script as a data URL, and the page's style inline:
  two round trips fewer. A loading screen in the page itself.
- The photographs cut to about one and a half times the most they are ever
  shown at (880 kB to 233 kB), and a level makes only its own sky's planets.
- The cave's rock and every level's ground shade worked out faster, the
  pictures identical (checked pixel for pixel): the cave from 1.44 s to
  about 0.65 s on the slow phone.
- After: the loading screen at 0.6 s, the title at 4.3 s on Slow 4G (1.6 s
  on ordinary 4G, 0.6 s on a second visit), 434 kB; levels 15-200 ms, the
  cave 0.65 s. Measured with `scripts/measure-load.mjs`, with the GPU on:
  headless Chrome without one made the graphics card's part look far
  slower than on any phone.
- Not baked: the 189 small pictures every level draws at boot. As files
  they would be 250-390 kB -- 1.4-2 s over Slow 4G -- against 0.4 s of
  drawing them.

Open: the script is now most of what is left: Phaser 314 kB compressed,
our own code 123 kB. Phaser built from its sources with only what the
game uses (no tilemaps, sound, text, particles, ...) would save about
75 kB, some 0.45 s on Slow 4G, at the cost of assembling and keeping up
the engine ourselves. The cave's rock (0.36 s of its 0.65 s) could be
worked out in the background while the levels before it are played.

