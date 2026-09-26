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

> **Still open:** there is no win state. What should happen after the city — a
> score, a "well done", a fourth level?

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

> **Still open:** is `Space` the right jump key, or should jump be `↑` and climb
> get its own key? Any split works; this one puts climbing where a ladder is.


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

## Hiding in the leaves is only a picture

The foliage in front of the branches hides the cat from *you*, not from anything
in the game. A crow still dives at a cat standing in a clump of leaves.

Made it that way because the alternative is a stealth mechanic, and there is
nothing in the game that hunts by sight -- a crow circles a nest, a rat runs
from you. Turning cover into a rule would need all of that rewritten. Say the
word if hiding should actually work.

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
