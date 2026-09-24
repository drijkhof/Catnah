# Level

Level data, the palettes, and the parser that turns a grid into world
coordinates.

- `Level.ts` — the `LevelDefinition` shape and `parseLevel`.
- `themes.ts` — one palette per place.
- `levels/` — the three levels, one file each, plus the order they play in.

A level is a grid of characters plus a theme, a width, a ground row, and whether
its platforms must attach to a column. Everything else is derived.

## Format

`LEVEL_SOURCE` is an array of strings, one per row of tiles:

| Char | Meaning |
| --- | --- |
| `#` | forest floor / earth |
| `=` | branch — what the platforms are in level 1 |
| `B` | fallen bough, a full-height solid for low overhangs |
| `R` | boulder / brick — solid rock, and what wall jumps are taken from |
| `M` | masonry — a house rather than a flat: plaster under a pantile roof |
| `T` | climbable column — a rope, drainpipe or chain, or (`climbableColumns: false`) a real tree, which is never climbable at all |
| `V` | liana — always climbable everywhere, regardless of `climbableColumns`. Never a platform, even at its top: it hangs from nothing, so there is nothing up there to stand on. Coexists with `T` in the same level: a tree, and the liana beside it |
| `v` | dead vine — the liana's stem with no leaves, never climbable, purely decoration |
| `w` | water — swimmable, not solid, harmless on its own |
| `L` | lava — not solid either, and fatal to touch |
| `o` | little heart — the little fish the cat collects |
| `N` | nest — a ledge set into the tile, so the cat sits *in* it |
| `+` | nest with a spare heart in it |
| `A` | parked car — two rows: a long lower one, a short upper one over its middle |
| `h` | hedgehog, `r` rat — walkers, only ever on plain `#` floor |
| `f` | piranha — water *with* a fish in it |
| `c` | crow |
| `^` | thorns — deadly to touch, and needs something solid directly under it |
| `s` | spider — walks the ceiling above it, so it needs rock directly above |
| `X` | the evil lord beetle |
| `P` | cat spawn (exactly one) |
| `E` | the way out |
| `.` | empty |

Rows may be written **short** — `parseLevel` pads them to
`LEVEL_WIDTH_IN_TILES` with empty tiles, so only the interesting left-hand part
of a row needs typing. Long runs use `'#'.repeat(n)` rather than hand-counted
characters, because miscounting a row by one is invisible in review and
maddening to debug.

A tile is `TILE` (16) game pixels, from `src/config.ts`.

Tiles are not all a full tile tall. A `=` branch is only as tall as its wood
(`BRANCH_THICKNESS`), so the collision box is exactly the surface the cat lands
on rather than a 16px block of air. `parseLevel` therefore returns explicit
`width`/`height` per solid instead of assuming a square.

Branch end-caps and the grass line are chosen from neighbouring tiles: a branch
is rounded off where it ends, and earth only grows grass where it is actually
exposed to the sky. That last rule is what stops a stack of ground tiles reading
as stripes.

## Buried sides are switched off

`exposedFaces` works out which sides of a tile anything could ever touch, and
`GameScene` switches the rest off with `body.checkCollision`.

This is not tidiness. Each tile is its own rectangle with four solid sides,
including the ones buried inside a mass of rock where nothing can reach. When
the cat presses against a wall, its overlap with that wall is a fraction of a
pixel — and so is its overlap with the tile above once its head crosses a seam.
Arcade separates on whichever axis overlaps least, so it could pick the vertical
one and report a *ceiling*, killing a jump against a flat wall. Turning off the
buried sides removes the choice. It fixes snagging while running along a flat
floor for the same reason.

Phaser's own tilemaps do this internally when they calculate faces; a static
group of individual sprites does not, so it is done here.

## Themes are palettes, not new tiles

All three levels use the same tile *shapes* and differ by colour: a girder and a
branch are the same one-way platform underneath, a drainpipe and a trunk are the
same climbable column. Tilesets are baked per theme under namespaced keys
(`cave:rock-fill`), and the scene resolves names through `this.tile()`.

Character comes from the backdrop, which is where each place actually differs —
stalactites and crystals, or a skyline of lit windows.

## Trees and lianas are two characters because they are two rules

`T` follows the level: climbable everywhere except where `climbableColumns:
false` says a tree cannot be climbed at all. `V` follows nothing — a liana is
climbable in every level it appears in, full stop.

One flag cannot carry both rules at once, which is the whole reason there are
two characters rather than one with a per-tile switch. A jungle level can
therefore have a real tree standing next to a liana hanging from nothing
beside it, and each behaves as what it is regardless of what the other one
does. `ParsedLevel.lianaZones` is kept apart from `climbZones` for exactly
this reason, and `GameScene.create` concatenates
`(columnsAreClimbable ? climbZones : []) ++ lianaZones` when it hands the
Player its climbable list, rather than folding the two together earlier where
that distinction would be lost.

**A liana is never a platform, not even at its top.** A tree's crown gets a
one-way ledge (`trunk-top-ledge`) because a branch has to hold you up somehow;
a liana's top tile gets none, because it hangs from nothing and there is
nothing up there to stand on. Falling onto the top tile still grabs it the
same as any other tile of it does -- climbing and standing are different
questions, and only the second one is "no" here.

Rendering follows the same split. A liana is baked once per theme from its own
shape (`drawLiana` in `tiles.ts`), never from `palette.columnStyle` — a liana
looks like a liana in every theme, the way a heart or a checkpoint star does,
regardless of what a `T` in that same theme happens to be standing in for.

## Every branch grows from a trunk — in the forest

`assertBranchesGrowFromTrunks` refuses to parse a level containing a branch with
no trunk at either end, but only when the definition asks for it. That is the
forest's rule: a branch belongs to a tree. The cave's stone shelves and the
city's girders stand on their own. Physics is perfectly happy with a branch hanging in
mid-air, so this is a rule about the world rather than about the code — checking
it here means a level cannot quietly drift out of that shape.

It is what makes climbing worth anything: if every branch belongs to a tree,
then anything you can jump to you can also climb to.

**A branch stacked directly above a `T` does not end the trunk.** `isTop` used
to check only for another `T` above, so a branch sharing that column read as
"nothing above me" and the tile got treated as the crown -- a ledge partway up
a trunk that plainly kept going, found with 12 real cases once a level had
enough trees for one to turn up. It now also accepts `=` there: a branch
growing out of a trunk is still the trunk continuing, not the top of it.

## Branches are one-way

A branch's faces are forced to `up` only, whatever its neighbours are, and the
scene gives them a collider of their own with a rule on it. You jump up through
a branch from underneath and land on it coming down.

This is what lets a branch grow straight out of the trunk it belongs to. Solid
branches could not: the cat is 22px wide against a 16px tile, so it overhangs a
trunk by about 3px each side, and a solid branch merely *next to* a trunk caught
the cat's shoulder and stopped the climb dead several tiles short.

## Pools

A pool is cut out of the floor and filled with `w`, with a row of floor left in
beneath it as the bed. Carving the floor away means the backdrop trees would
otherwise show straight through the half-transparent water, so the scene lays an
opaque `water-bed` tile behind every water tile.

Keep the surface level with the surrounding ground. The cat swims up to the
surface and then simply moves sideways onto the bank; a pool whose surface sits
below the bank needs a jump out, which a swimming stroke may not provide.

## Designing for climbing and wall jumps

**End a trunk two tiles above its highest branch.** Letting go at the top needs
enough fall time for the cat to drift sideways over the branch before it drops
past the level of it. One tile only clips the branch's edge.

**Wall jumps need two walls facing each other**, not one. Sides have to
alternate, so a lone face gives a single jump and nothing more.

**A shaft has to be taller than two jumps to be worth building.** A wall jump
is a full jump now, and one wall is worth exactly one of them, so a jump off the
floor plus a single wall jump reaches about 172px. The level 1 shaft is 224px
precisely so that one wall cannot do it and alternating can. Build one shorter
and it quietly stops testing anything.

**A shaft has to be enterable.** Two walls standing on the floor cannot be
walked between — you meet the first one. Level 1 solves it by stopping the left
tower two rows short of the ground, so the cat walks in underneath it.

**A wall-jump face needs clear air across the whole swing**, roughly 25px out
from the wall, not merely the column directly above it. Branches no longer count
here, since they are one-way — but rock, earth and boughs all do.

## The sneaking passage

The bough on row 17 leaves a one-tile gap above the floor. A standing cat is
18px and does not fit; a sneaking one is 9px and does. It can still be jumped
onto and crossed over the top, which keeps it a choice rather than a wall.

A mandatory sneak needs a ceiling *and* no way over it. Nothing in the format
enforces that — it is a level-design decision.

## Parsing is separate from rendering on purpose

`parseLevel` returns plain coordinates — `solids`, `coins`, `spawn` and the
world size — and knows nothing about Phaser. `GameScene` turns that into sprites
and bodies.

That split means levels can later come from a file, a Tiled export or a
generator without touching physics or rendering: anything that can produce a
`ParsedLevel` works. Keep Phaser imports out of this folder.

## Ground line

`GROUND_ROW` states where the forest floor's surface is, and `parseLevel`
passes it through as `groundLine` for scenery to plant against. It is stated
rather than derived because the sneaking bough is also solid and sits higher, so
scanning the tiles for "the topmost solid" would find the wrong line.

## Falling out of the world

The level has a gap in the floor. `GameScene` sets the physics world **taller**
than the level (`FALL_OUT_MARGIN`) so a missed jump falls into empty space and
respawns, instead of landing on an invisible floor at the bottom of the screen.

A level with a pit therefore needs no special markup — just leave the floor out.

## Creatures need clear space

`assertCreaturesHaveRoom` refuses a level where an `h`, `f` or `c` has been
written over a solid tile. Doing so leaves a hole in the tile *and* a creature
wedged in it, jittering on the spot — which looks like broken patrol logic
rather than a misplaced character, and cost a debugging session to find.

## Carved levels

## Levels are written out, never generated at boot

Every level in `levels/` is a literal `ROWS` array. Some of them were **laid out
once** with a throwaway builder -- the forest's bays, the swamp's crossings, the
cave's chambers -- and the builder's output was then frozen into the file and the
builder deleted.

That is the rule: a level is a fixed thing that is the same on every machine, in
every run, for every player. A generator that runs at boot is one refactor away
from being a level that quietly differs, and a level nobody can point at is a
level nobody can fix.

Rows are written **short** and padded out to `widthInTiles` by `parseLevel`,
which is why the right-hand ends are ragged. To change a level, edit the rows.
To lay out a new one, write whatever you like, run it once, paste the output in
and throw the script away.

## The old note on carving, which still explains the shapes

`cave.ts` builds its grid in code: one block of rock, with chambers carved out of
it by `hollow`, `carve` and `block`. At 48x96 the hand-written string style the
other levels use stopped being readable, and the cave's structure -- eight
chambers at a fixed spacing, each with a hole through a three-row floor -- is
arithmetic anyway.

The floor between chambers is **three rows thick** so that a pit or a pool can
be sunk into it without opening a hole into the chamber below. That is what the
old cave's water lacked: it sat in a two-row floor with open air under it, and a
pool with nothing holding it looks exactly as wrong as it was.

**Length is not design.** The first long draft of the forest was fifteen copies
of four shapes and it was boring in a way the short version never was. It is
fifteen *different* pieces now. A generator that repeats a pattern gives you a
short level you have to walk through several times.

A city building is either **gone through** -- `arcade()` cuts two rows out of it
at street level -- or **gone over**, with one drainpipe on the side you arrive
at. Coming down the far side needs nothing, which is why it is one pipe per
climb and not two. A column with a wall beside it is drawn with a gutter hopper
on top (`trunk-head`); one standing on its own gets a lamp, and is a lamppost.

**Awnings are not a staircase.** `solidPlatforms` is on in the city, so a girder
is solid on every face: an awning is something you come at from the side, and a
stack of them up a wall is a ceiling. Measured -- a full jump carries the cat
86px sideways by the time it falls back to where it took off, so it flies clean
over a three-tile awning it jumped at from underneath.

The cave is not built up from a floor; it starts as solid rock and tunnels are
cut out of it. That is what gives it an uneven floor and a roof over every
passage, and it makes dead ends free — a branch that leads nowhere is just a
tunnel nobody carved through.

Two things are worth checking with a flood fill when carving one, outside the
game: that the exit is reachable from the spawn at all, and that no carved
pocket is sealed off from everything else. A sealed pocket is invisible in the
grid and is simply wasted space.

## Three guards worth having

`parseLevel` refuses a level rather than shipping one that looks fine and plays
broken. Each of these cost a debugging session before it existed:

- **Creatures need clear space.** An `h` written over a boulder leaves a hole in
  the boulder and a hedgehog wedged in it, jittering on the spot — which reads
  as broken patrol logic.
- **Floor creatures stand on plain floor.** Never on platforms, boulders or in
  water. Carving a chamber under one silently removes its footing.
- **The spawn has footing.** A `P` one row too low replaces a floor tile and
  leaves the cat sealed under the surface, where it falls out of the world and
  respawns into the same hole, forever.
- **Thorns stand on something.** A patch hanging in mid-air over a crossing is
  an invisible wall you die on, and nudging a row sideways by one is all it
  takes to write one.
