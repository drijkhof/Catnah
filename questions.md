# Questions

Everything in the backlog is built. That meant answering a pile of open
questions without you, so here is every call I made and why — and the ones I
think are actually still open.

Change any of these and I will rebuild around it; none is baked in deep.

---

## Dying

**Infinite retries, no lives.** Dying puts the cat back at the start of the
level after a short pause. A life counter punishes a young player for
experimenting, which is most of the fun of a platformer.

**No checkpoints.** The levels are a couple of minutes long, so a death costs
the walk back rather than real progress. If they grow, this is the first thing
that will need revisiting.

**Berries stay collected through a death.** So dying never undoes work. It also
means you cannot lose a berry you have already reached — say if you would rather
death reset the level properly.

> **Still open:** should the berry count carry between levels, or is each level
> scored on its own? It resets at the moment, and there is no total.

## Hedgehogs

**Cannot be defeated.** No jumping on them, no way past — contact kills from any
direction, including from above. Jumping on enemies is the single most expected
platformer verb, so this is the decision I am least sure of.

**Sneaking does not hide the cat.** I kept the same answer for the crow, so the
rule is at least consistent: sneaking is about fitting through gaps, not about
stealth.

**Much slower than the cat** — 42 px/s against 190. They are obstacles to time,
not chases.

> **Still open:** should jumping on a hedgehog squash it? And should sneaking be
> stealth as well as a way through low gaps? Those two answers belong together.

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

> **Still open:** should the nest hold something — an egg, a berry hoard, the
> level's real prize?

## The cave

**A separate level, reached through a door**, not a hole you fall into from the
forest. Levels are independent grids, which is what made three of them cheap.

**Darkness is not a mechanic.** It is dark to look at, but the view is not
limited and there is nothing to light. A real "you can only see so far"
mechanic is a much bigger job and would change how the level must be designed.

**It reuses the forest's creatures.** Hedgehogs underground are a stretch, and
there is no cave-specific creature at all.

> **Still open:** the two above are the weakest parts of the cave. Limited
> vision would give it an identity; bats, or something blind and crawling, would
> give it inhabitants.

## The city

**Night, with both streets and rooftops.** Branches became steel girders,
trunks became drainpipes, the pool became a canal, and the buildings are brick.

**No people, traffic or dogs.** It reuses hedgehogs and a crow, which is the
same weakness the cave has.

> **Still open:** what actually lives in a city level? Traffic as a moving hazard
> is the obvious one, and it would need a mechanic none of the others have.

## Level structure

**Three levels, played in order, looping.** A glowing door at the far right of
each ends it. Finishing the city returns you to the forest.

> **Still open:** there is no win state. What should happen after the city — a
> score, a "well done", a fourth level?

**Reaching the door is the only goal.** Berries are optional; nothing requires
collecting them, and nothing happens when you get them all.

> **Still open:** should the door need all the berries, or a minimum number?

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
