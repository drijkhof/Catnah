# Objects

Game entities — things that exist in the world and have behaviour. Currently
just `Player`, the cat.

## Entities are stepped, not auto-updated

Entities expose a `step(controls, delta)` method that `GameScene` calls
explicitly, instead of relying on Phaser's scene update list. This guarantees
input has been sampled for the frame first (see `../scenes/CLAUDE.md`).

`delta` arrives in **milliseconds** (that is what Phaser hands `Scene.update`).
Convert once at the top of `step` and work in seconds:

```ts
const dt = delta / 1000;
```

Never move by a fixed amount per frame — always multiply by `dt`, or the game
runs at different speeds on a 60Hz laptop and a 120Hz phone.

## Movement is intentionally not "velocity = input * speed"

`Player` implements five things that separate a platformer that feels tight
from one that feels slippery and unfair. Do not simplify them away:

- **Acceleration and friction** rather than instant velocity, with reduced
  `airControl` in the air — the cat steers while airborne, but less sharply
  than on the ground.
- **Coyote time** — a jump still fires shortly *after* walking off a ledge.
- **Variable height** — releasing early makes the cat heavier rather than
  cutting its velocity, so it eases off instead of stopping dead. Measured:
  86px held, 39px on a one-frame tap, and about 30px of that still gained after
  the button came up.
- **Sneaking**, **wall jumping** and **climbing**, below.

All of it is tuned by the `CAT` block in `src/config.ts`. Tune there; do not
hardcode numbers in the entity.

### The queued jump has no timer

`jumpQueued` is a flag, not a countdown. It is held until something spends it,
or until the cat tips from rising into falling, which `wasRising` watches for.

That turn is the right moment to drop it: a press made on the way up was meant
for something on the way up -- a wall, most likely -- and keeping it past the
apex would hand the player a jump they asked for seconds ago. A press made on
the way down is never near that turn, so it simply waits for the landing.

One consequence worth knowing: a press made while falling has no expiry at all.
Press at the top of a long drop and the cat jumps the moment it lands.

The coyote timer is still a timer, and both it and the queue are cleared when a
jump fires -- otherwise one press could trigger a second jump the next frame
while the window is still warm.

## The drawing

One picture per pose family, parameterised: `drawStandingFrame(stride)` gives
standing and both walk strides, `drawSneakFrame(stride)` the stalk,
`drawClimbFrame(reaching)` the climb and its shuffle. The shared tones
(`TONES` in `art/cat.ts`) -- a lit edge along the back, a shaded haunch, the
green eye with its slit pupil -- are what make the four poses read as one cat.

## The poses

The cat is drawn standing (22x18) and sneaking (26x9), each baked at exactly
its physics body size. The sprite origin is at the **paws**, `(0.5, 1)`, so with
body and frame identical the offset is always zero and the cat neither sinks
into the floor nor pops off it when the pose swaps. Spawn points are therefore
ground lines, not sprite centres.

**A pose is a still picture, and an animation can overwrite it.** `setTexture`
does not stop a running animation, so the walk cycle, still ticking after the
cat ducked, could put a standing-height frame back on the flattened body. With
the origin at the paws that lifts the body's top by the height difference: the
9px body hung 9px above the floor, fell, and took the drawing 9px into the
ground with it; standing up from there put the full body inside the floor,
beyond what Arcade will separate, and the cat dropped through. It only
happened when a walk-cycle tick fell inside the tap, which is why it looked
random. `refreshTexture` stops any animation before it swaps the picture, and
every frame of a cycle is baked at its pose's body size: the walk's at 22x18,
the stalk's (`cat-sneak-walk`) at 26x9. Anything that plays an animation on
the cat must go through `setMoving`, and a new cycle must keep to its pose's
frame size.

Standing is 18px — taller than one 16px tile on purpose. A one-tile gap under an
overhang cannot be walked through, only sneaked through, so the level grid
alone creates a sneaking passage with no special markup.

**Climbing is a third picture but not a third pose.** `cat-climb` is baked at
the standing frame size and the body is left alone, so taking hold of a rope
changes nothing but the drawing. That is why `refreshTexture` is separate from
`applyPose`. The cat is drawn head-up and from behind, and is never flipped
vertically: a cat climbing *down* a rope still goes head-up, backwards, the way
a real one does. Head-down would read as falling.

### Walking, climbing and swimming loop; standing and sneaking do not

`setMoving(animKey, restKey, moving)` is called every frame from all three of
`step`, `updateClimb` and `swim` -- not only on the moments something changes,
the way `refreshTexture` is -- and plays a looping `Phaser.Animations` cycle
while `moving` is true, or holds a single still frame otherwise. Each frame of
a cycle is a whole separate baked texture rather than a slice of a spritesheet
(`{ key: 'cat-walk-a' }`, not a frame index into one image); Phaser is happy to
animate that way, and it fits how every other texture here already gets baked
one at a time.

Passing `true` for `ignoreIfPlaying` on the `play()` call inside `setMoving` is
not optional: without it, calling `play` again with the same key while it is
already playing restarts the animation from frame zero, and a cycle
re-triggered sixty times a second never gets past its first frame.

Sneaking has no cycle of its own and is never touched by `setMoving` -- `step`
only calls it `if (!this.isSneaking)`, so the single sneaking frame set by
`applyPose` survives untouched for as long as sneaking holds.

Swimming's cycle runs unconditionally rather than only while actually moving,
unlike walking and climbing: treading water is still paddling, so there is no
"still" swimming frame to fall back to.

**Standing up is conditional.** `hasHeadroom()` tests the space a standing cat
would occupy with `physics.overlapRect` before standing up; without it the cat
would be shoved through the ceiling it is sneaking under. The same flag blocks
jumping, which is what stops a player escaping upward through the log.

A queued jump beats a held sneak, so a player holding the button is never stuck —
under a low overhang it is the missing headroom, not the input, that stops them.

## Swimming

Water replaces ordinary movement the way climbing does, and is checked first: a
pool has no walls to kick off and no trunks in it, so nothing after it needs to
run.

**The cat sinks until it is under.** Holding depth from the moment the paws
touch meant floating with the whole cat above the water, skating across the top
of it. `applyBuoyancy` sinks at `sinkSpeed` while the cat still breaks the
surface and nothing is pressed, and holds depth only once it is under.

**It is not perfectly neutrally buoyant, either.** Holding an exact depth
forever with nothing pressed read as a lift shaft, not a pool. `swim` gives the
body `swimGravity` (a tenth of ordinary `gravity`, added as `swimGravity -
gravity` since Arcade's body gravity is additive on top of the world's) instead
of turning gravity off outright, and `applyBuoyancy` clamps how fast that pull
is allowed to sink the cat at `sinkSpeed` -- so it drifts towards the bed rather
than free-falling, and stops there rather than pressing into it. Leaving the
water resets the body's gravity back to zero, or the cancelling offset would go
on cancelling nine tenths of ordinary gravity on dry land too.

`SUBMERGED_MARGIN` puts it two pixels lower than the arithmetic needs, because
the surface tiles swell on a slow tween and a cat resting exactly on the line
pokes out of the trough.

The sink is skipped when there is no water left to sink into, or a puddle
shallower than the cat would press it into the bed forever.

A stroke is allowed to **carry**: an upward velocity stronger than what is being
asked for bleeds off at `swimDrag` rather than being written over. Without that
a stroke lasts exactly one frame and never lifts the cat out of anything.

`waterSurfaceY` and `waterBedY` scan every water tile standing over the cat's
own x, because pools are stored tile by tile and what is wanted is the surface
of the pool rather than of the nearest tile.

Water is harmless by design — the original wish was that not every pool has a
piranha in it, which only means anything if a pool without one is safe.

## The beetle hunts

It is not a patrol and not a gatekeeper. `Boss.step` runs four phases:

- **idle** -- nobody within `engageRange` of its lair: it drifts back to the
  lair. Arriving restarts its patience with `approachGraceMs` on top, so the
  first charge is never half wound up when you walk in.
- **stalk** -- it takes station `standoff` to the side of the cat it is
  already on and `hoverAbove` over the cat's head, eased (`stalkSpeed`,
  `stalkRate`), never lower than `lowestY` and never outside `reach` of its
  lair. Its wings are heard every `wingBuzzMs` from here on.
- **charge** -- when the rest runs out it **locks where the cat is at that
  instant** and accelerates along that line (`chargeStartSpeed`,
  `chargeAccel`, up to `chargeSpeed`). The line is fixed: a cat that moves
  early is missed, one that stands still is hit. It carries on `overshoot`
  past the point; hitting rock (any `blocked` side, from the collider the
  scene gives it against the level's blocks) or `chargeTimeoutMs` ends it
  sooner. Every charge shortens the next rest by `furyStep`, down to
  `minRestMs`.
- **recover** -- it sheds the speed over `recoverMs`, lifting a little, and
  stalks again.
- **dying** -- out of spots: body off, and `fall` steps it down by hand
  every frame -- gravity, a slow turn, a fade -- then `destroy()`. Stepped,
  not tweened: a tween that did not run left a dead beetle hanging in the
  air. The scene forgets a boss that is no longer `active` and opens the level's
  portals (`openExits`: hidden and not enterable in any level with an `X`
  until then; `respawnBoss` closes them again), and
  `respawnBoss` (shift-click the level name, dev only) puts a fresh one back
  through the same `spawnBoss` the level build uses, and the cat back at its
  respawn point.

**Its spots are its lives.** `GameScene` checks its body against the thorn
rectangles every stepped frame and calls `sting()`: one spot off (`spots`,
four to start), the texture swapped to `bossKey(left)` -- `creatures.ts`
bakes `boss-4` down to `boss-0` -- a red flash, the `bossHurt` squeal, and a
knockback along the reverse of its charge into `recover`. `stingCooldownMs`
after a sting it cannot be stung, so one patch of thorns costs one spot, not
one a frame. The last spot calls `die()`. The scene's `overlap` that kills the
cat on touch does nothing to a dying beetle because its body is disabled.

`lowestY` comes from the floor the scene finds as the first solid straight
below the `X` -- not the level's `groundLine`, because an arena's floor need
not be the level's. `keepToItsLair` is the hard stop at the ends of its beat
and at that height, outside a charge; a charge is allowed down to the floor
and the collider stops it there.

The old gatekeeper -- station between the cat and the door, line up, drop,
climb back slowly -- is gone; it was tame as a lamb in the rebuilt arena.

## Camels are walkers you stand on

A camel is a `GroundEnemy` of kind `camel`: it ambles slowly (`pace`, like a
hedgehog -- walls, edges and the end of the world turn it), never grazes, and
is **not pushable**, so the cat walking into it moves the cat and never the
camel. Not *immovable*: an immovable body is not separated from the static
ground either, and fell straight through the floor. Its body is its back only
(`CAMEL_BACK`), from the hump tops down and without the head, so the cat
stands on the humps. And it treats the cacti as **fences** (`setFences`, from
`GameScene`), turning two tiles short of one rather than carrying its rider
into it.

**The cat has no collider with a camel at all** (`rideable` skips the kill
overlap and adds nothing in its place). Standing on one is `GameScene.
rideCamels`, geometry run every frame *before* the cat's own step: a cat over
the back, not rising, whose feet are at the back -- or will cross it this
frame, at its fall speed -- is stood on it: feet put on the top, fall stopped,
`touching.down` raised so the cat can jump from there, and carried by the
camel's *movement* (its change in x since last frame, not its velocity: a
camel against a fence has a velocity and goes nowhere, and a cat carried by
that slid off). Two things it learned the hard way:

- Arcade's collision between two moving bodies made landing a coin toss: it
  chose the sideways separation whenever the cat came down near an edge of
  the back, and the `touching` flags flickered every other frame as gravity
  dropped the cat a hair and the collision lifted it back, so a rider carried
  on half the frames fell behind and off. Hence no collider.
- `update` runs between the physics step and Arcade's `postUpdate`, which
  moves the *sprite* by however far the *body* travelled this frame. A snap
  that set only the sprite was carried below the back again before it was
  drawn, and the cat fell through. The snap sets the body too and zeroes its
  `prevFrame` delta.

Measured under the console harness: 64 of 64 drops onto the back land, and
every jump that reaches the back lands.

## Worms hunt under the sand

`Worm` is not a sprite with a body: it is a clock (hidden, shivering, rising,
standing, sinking; `WORM`), a position under the sand, and a cropped picture.
Now and then, on its own clock (`hiddenMinMs`..`hiddenMaxMs`, each worm
started at its own point in the wait), it comes up out of its hole to **look
about** for `lookMs` -- without warning, which is the point -- straight up
with nobody there. A cat on the sand within `huntRange` when it looks is
**seen**: the worm leans up to `lookLean` toward it and turns with it, and
`spotted` is set as it sinks. Then the cat is
**hunted**: the worm travels toward it under the sand at `travelSpeed`, hole
and all -- the mound sprite moves with it as the ripple -- as far as the
sand goes: `Mound.from`/`to` from the parser, the run of open cells on plain
`#` floor either side of the `u`; a rock, a wall, a cactus or a drop ends
it, and a mound in a one-tile pocket never moves. Within `senseRange`
the ground **churns** for `shiverMs`: the mound jolts, and sand grains are
thrown up around the spot the worm will come out of, more of them the nearer
the lunge (a `Graphics` redrawn each frame, placed by a hash of the tick so
they jump rather than drift, nothing random); sneaking along, a few grains
kick up behind it. That is the warning, it marks *where*, and it is sized so
a cat right on top can see it, turn and run clear -- and then
it **lunges**: out fast to `lungeHeight`, leaning toward the cat by up to
`maxLean` and re-aimed every frame of the rise, a `snapMs` hold, and back
in wherever it is. A cat that steps away during the shiver is let go. After
a lunge it needs `lungeCooldownMs` under the sand, which is the gap to run
through; it is slower than the cat, so it can be outrun, and it closes on a
cat that stops. With nobody about it drifts home, and home again it forgets,
so the next cat gets the look. A cat that drops in right beside the hole gets
no look, only the churn; a worm that is up when the cat walks up to it
lunges from where it is. `senseRange` is set to what the lunge can
actually reach (44px at 70° is 41px sideways); set it further and the worm
lunges at air.

The deadly part is a **segment**, not a column: `touches(body)` walks the
part that is out in 2px steps against the body grown by the worm's
half-width, and `GameScene.touchingSomethingDeadly` asks every worm every
frame, the way it reads the lava's rectangles. Drawing: the worm texture is
the whole animal, head at the top; the top `out` pixels are cropped, the
origin put at the bottom of the shown part so the picture grows out of the
sand and turns about it, rotated to the lean, and stretched when the lunge
reaches further than the picture is tall. The mound is drawn in front so the
worm comes *out* of it, and is marked `KEEP_LIVE`: the scenery bake would
otherwise flatten it into the static textures at its home and destroy the
original, leaving a painted mound that never moved while the worm came up
elsewhere -- which is exactly what happened first. **Worms are afraid of camels**: the scene hands `step`
the camels, and with one within `WORM.fearRange` a hidden worm stays hidden
and does not travel, and a worm that is up sinks at once -- so a camel is the
safe way over the sand.

## The lava lake

`LavaLake` owns everything the lava *does*; `GameScene` keeps only the
rectangles that kill. The surface stands `LAVA.rise` above its cell -- lava
heaps up over its basin rather than sitting in it -- so the surface textures
are that much taller than a tile and drawn that much higher, the vents and the
haze sit on the raised crust, and `GameScene.buildLava` raises the kill
rectangle of every surface tile to match. Where the surface meets a whole tile
of ground on the same row, a `lava-lip` is laid over that tile's edge; the lake
is handed a `groundAt` lookup for exactly that. Then three things, none of
which is a new hazard:

- **The boil.** Each connected pool is one picture, baked whole in eight
  frames by `art/lava.ts` the first time a level needs it (keyed by theme and
  position), and cycled by `boil`. Drawn per tile, lava was a repeat of the
  same sixteen pixels and read as a grid of orange blocks; drawn per pool it
  has a crust that heaps up across the whole width, plates and lumps
  scattered rather than striped, veins that wander its length, and bubbles
  where the lake decides. Pools start at different points in the cycle so two
  on one screen do not blink in step.
- **The heat.** One additive `heat` column per surface tile -- brightest at
  the foot, ragged at the top -- breathing and swaying on two tweens, with a
  delay taken from the tile's column so the haze ripples along the lake. And
  **wisps**: `drift` lifts one off a random vent every `wispEveryMs`, rising,
  swelling and thinning, moved by hand like the gobbets and capped at 18.
- **The gobbets.** Plain images moved by hand rather than physics bodies: there
  are a lot of them, nothing may ever collide with one, and a body nothing
  touches is a body the physics step walks over for no reason.

## Crows

A crow has a **behaviour**, set per level by `LevelDefinition.crowBehaviour`:
`'attack'` (the default, everything below) or `'flyby'`, used by the title
level. A fly-by crow never looks for the cat: it crosses the level from edge to
edge, `flybyOvershoot` past each end, and turns round, bobbing gently. It is
still a `Crow`, so it flips, sleeps and wakes like the rest, but its `step`
returns before any of the attack code.

`step` also takes what the crow can tell about the cat, worked out by the
scene (`CatCover`): a **sneaking** cat is never the start of an attack, and a
**hidden** one -- sneaking with the middle of its body inside the rectangle of
a bush, a reed or a `foliage-near` clump -- ends one. `GameScene.gatherCover`
collects those rectangles once the level is built; all three kinds are live
objects (the foliage is in front of the cat, bushes and reeds are `KEEP_LIVE`),
so they survive the scenery bake and can be asked.

Every crow used to share one starting angle and one circling speed, both
literally zero and a constant. Two of them awake at once -- easy, in a level
with eight -- traced the exact same circle in perfect lockstep from the moment
they woke, because nothing about them ever differed. It reads as a fairground
ride, not as birds.

Each one now gets its own **angle, speed, radius and direction**, seeded from
its nest position with `createRandom` -- not `Math.random`, for the same reason
scenery scatter never is: the same eight birds on every device and every hot
reload. All four have to vary together. A phase offset alone still leaves them
on identical circles at identical speed, so two that happened to wake close
together drift back into sync soon after; different speeds are what make them
pull apart and never realign.

## Spiders

The mirror of a `GroundEnemy`: it walks a ceiling rather than a floor, and
`ceilingAhead` probes the `down` face of whatever is above it exactly as
`groundAhead` probes the `up` face of whatever is below. A one-way ledge has no
underside to hang from and correctly does not count as a ceiling.

It only drops on a cat that is genuinely **below** it. A cat level with the
spider is not something on a thread can reach, and dropping at one reads as the
spider missing rather than as the player dodging.

The thread is a `Graphics` redrawn each frame from the anchor down to wherever
it has got to, and is destroyed with the sprite -- a `Graphics` is not a child
of the sprite and will otherwise outlive it as a line hanging in an empty cave.

Nothing collides with it and it has no gravity: where it is, is decided entirely
in `step`. `parseLevel` refuses a spider with no rock over it, because its
thread would be anchored to nothing and it would walk a ceiling that is not
there.

## Crocodiles

A crocodile is a platform with a temper, and the only thing in the game the cat
is meant to land on.

- **Its body is only the back**, so the snout is scenery and walking into one
  from a bank does not stop the cat dead against a nose.
- **The collider is one-way**, exactly like a branch, and the callback that
  lets the cat land is also what tells the crocodile it has been stepped on.
- **It rides well clear of the waterline** (`FLOAT_LIFT`). Not for looks: a cat
  standing on a back that dipped under would count as being in the water, switch
  to swimming and sink off its own platform. It also has to read as a platform
  at this size, and a correct crocodile — scutes and eyes only — does not.
- **The mouth is shut until there is a cat in its own water**, and then it opens
  and the crocodile *hunts*: it turns and swims at the cat at `chaseSpeed`,
  turning rather than snapping round, and it is fenced into its own pool exactly
  as a piranha is. Waiting in place made the bite a rectangle you swam into;
  swimming at you makes it something that reached you.
- **It has to be able to get home.** `keepInPool` clamps its top to `floatY`,
  which is above the waterline. It clamped two pixels short of that once, and
  `goHome` waits to be within two pixels of home -- so a crocodile that had
  chased you never settled again. It circled its pool with its mouth open for
  the rest of the run and the crossing was gone.
- **`settle()` puts one straight back**, and `GameScene` calls it on every
  crocodile when the cat respawns. While the cat is dying it is not stepped, so
  whatever `swimming` said at the moment of death goes on being true: a cat that
  drowned otherwise leaves the whole pool hunting something that is not there.
- **While hunting its body is off.** A crocodile in the water is in the water
  like everything else there, so there is nothing to stand on until it has swum
  home and settled.
- **It turns round, and the collider turns with it.** Each crocodile lies
  facing a way picked from its home x (`homeFlip`), and `face` moves the back
  to the tail end of the picture, since `flipX` does not mirror body offsets.
  Chasing and swimming home use `faceToward`, which ignores a target within
  4px of its own x: a cat straight above otherwise flips it every frame.
- **The last stretch home is a straight glide.** The turn limit gives a
  turning circle of about 18px, wider than any arrival tolerance, so steering
  onto the spot orbited it for ever, flipping and shaking. `goHome` glides once
  within two turning diameters and snaps on arrival.
- **The back stops short of the head**, because being able to stand in an open
  mouth would undo what the drawing is saying.
- **`jaws` is a separate, larger rectangle**, tested from `GameScene.update`
  only while the cat is swimming. Landing on the back is safe; being in the
  water beside one is fatal, floating or sunk. The submerged ones still bite,
  which is what makes dawdling on a sinking back cost something.
- It moves by position rather than velocity and calls
  `body.updateFromGameObject()` afterwards, because its whole behaviour is about
  being in an exact place: level with the water, or a fixed depth under it.

## Climbing trunks

Climbing **replaces** ordinary movement rather than adding to it — no gravity,
no jumping, no wall logic — so `updateClimb` runs first in `step` and
short-circuits everything else when it returns true.

Trunks carry no physics body at all. They are meant to be walked through, so
`findTrunk` does its own rectangle test against zones handed in by the scene,
rather than going through Arcade. That also keeps it free of ordering problems:
an overlap callback would not have run yet at the point `step` needs the answer.

**Not every column is climbable.** A level can turn it off
(`climbableColumns: false`, which the forest does): the zones are still parsed
and still drawn, and `GameScene` simply hands the player an empty list. Walking
through, standing on a crown and everything else stays exactly as it was; only
the climb goes. You cannot climb a tree.

There is no grab button and no release button:

- **Falling onto a trunk catches it.** That is the automatic grip.
- **From the floor, up grabs instead of jumping**, the way standing at the foot
  of a ladder does. Measured on the great tree: standing at its foot and holding
  up climbs, it does not hop.
- **Reaching out sideways lets go.**

### Leaping off is the jump input

Up and down only climb. Jump (a fresh press) throws the cat off the rope,
straight up or towards a held direction, so a player can climb without leaping
and leap without steering.

`wantsToLeap` asks for the *press*, not the button being held, so catching a
rope in mid-air with jump still down does not fling the cat straight back off.

`leapFromTrunk` clears the coyote window `releaseTrunk` just handed out, or the
same press would buy a second jump on the very next frame.

**Holding on is not centred on a column.** Left and right move the cat sideways
at `climbHorizontalSpeed` instead of letting go, which is what makes a bank of
ropes a wall rather than a row of poles. Climbing off the end of one drops the
cat, because `findTrunk` stops finding anything.

`findTrunk` has no side margin: the body has to be over the column's tile,
and the same test decides taking hold and keeping it. It had a 10px margin
for a while, so a climbing cat could lean for a heart placed one tile beside
the column. On the catch, that made a chain drawn 6px wide take hold of the
cat from three tiles of air; kept for the hold only, it left the cat hanging
where it could never have caught on. Neither is worth it: with the body over
the tile the cat can still lean 14px, which reaches a heart in the next
column (measured in the volcano: collected, still climbing).

**Climbing down lets go on `blocked.down`, never on `touching.down`.** Arcade
raises `touching.down` on any overlap entered while moving down, and a heart
is an overlap. Reaching for one on the way down read as touching the floor
and dropped the cat; on the way up it raised `touching.up`, which nothing
reads, so the same reach was fine. `blocked` is level geometry only.

**Taking a heart in the air gives the cat a jump** -- the same `touching.down`
raised by the overlap makes that frame count as grounded, and the coyote
window follows. It began as a side effect and is now a rule of the game
(`work.md`): it must survive any change to `onGround`. The climb release
above deliberately bypasses `onGround` rather than changing it, for that
reason.

**Letting go hands back a coyote window**, and that is not a nicety either.
Without it only a jump pressed on the *exact* frame worked: pressing a direction
first -- which is what hands actually do -- dropped the cat off the rope, and
the jump that followed had nothing to push off. It read as being stuck to the
thing. The window is wider than the ledge one, because a ledge is something you
see coming and a rope is not.

`climbCooldownTimer` is not optional. Letting go leaves the cat falling while
still inside the trunk, and falling into a trunk is exactly what the automatic
grip catches — so without the pause, stepping off re-grabs on the next frame and
the cat can never leave.

`climbing` is read by `GameScene` as well: a climbing cat passes through
branches in both directions, or the branches growing out of a trunk would block
the climb up it.

The climb stops at `trunkTops` rather than running off the end into thin air,
which would drop the cat straight back down past the trunk it just climbed. A
few pixels of overlap are kept at the top (`CLIMB_TOP_MARGIN`), because a cat
whose body cleared the trunk entirely would have let go of it.

## Wall jumping

`findWall` reports which side a wall is on, and only in mid-air — standing on
the floor beside a rock is not clinging to it. From there:

- **Wall slide** caps the fall at `wallSlideSpeed` while the player presses
  *into* the wall. Pressing in is required rather than merely touching, so
  brushing a rock in mid-air does not silently brake the cat.
- **Wall jump** fires from the same jump buffer a ground jump uses, so each one
  needs a fresh press and a held button cannot climb a face on its own.
- `wallJumpLockTimer` ignores horizontal input briefly afterwards, and
  `applyHorizontal` and `updateFacing` both bail out while it runs.

**Jumping is resolved before movement** in `step`, so the shove a wall jump
gives is the velocity the frame ends with rather than something input overwrites
on the same frame.

### Sides must alternate

`lastWallJumpSide` blocks a second wall jump from the same side, so one wall is
worth exactly one jump. Landing clears it.

### A wall jump is only a jump

`applyWallJump` sets the vertical velocity and nothing else. No sideways shove,
so it leaves direction and speed alone, and the player keeps full control of
where they go. It is an ordinary jump with ordinary variable height that happens
to have been taken off a wall.

Because there is no shove to protect, there is no input lock either.

### Walls are found by probe, not by collision flags

`solidBeside` asks the physics world what is a couple of pixels to either side.
The collision flags (`blocked`, `touching`) only light up when there was an
overlap to separate, which in practice means pressing into the wall -- and
resting against one with no horizontal movement at all has to count.

The probe filters on the obstacle's own `checkCollision` face, which is what
keeps one-way branches from reading as walls.

### The wall is remembered for a moment

`wallCoyoteTimer` keeps a wall jumpable briefly after contact is lost, so
steering away and jumping works. It is spent on use, so one contact cannot be
cashed in twice.

### No buffer

A jump happens on the press or not at all. `coyoteTimer` is the only grace left.


## Body access

`declare body: Phaser.Physics.Arcade.Body;` re-types the inherited nullable
`body`, so the entity gets full typing with no casts. Reuse that pattern.

Ground checks use `body.blocked.down || body.touching.down` — `blocked` is for
world bounds and static bodies, `touching` for dynamic ones; a moving platform
would only set the latter.

## Nothing runs when nobody is near

`GameScene` steps a creature only while the cat is within `AWAKE_RANGE`, and
calls `doze()` on it otherwise. Two separate reasons, and they pull in opposite
directions:

- **Sound.** Nothing in this game is positional, so a rat scurrying at the far
  end of a long level is heard at exactly the volume of one standing next to
  you. A level full of rats was every rat in it at once.
- **Seeing something start.** A creature caught standing still and *then*
  beginning to walk is worse than one that was never moving, so the range is a
  screen and a half — half of which is the screen itself. Everything wakes a
  full screen before it can be seen.

Because those two pull apart, they are two numbers: `AWAKE_RANGE` is generous
and `EARSHOT`, in `Sound.playAt`, is one screen.

**`doze()` is not the same as skipping `step`.** Arcade goes on integrating
whatever velocity was last set, so anything velocity-driven left mid-stride
walks off on its own with nothing deciding where it is going. Hence a method
rather than a `continue`: `GroundEnemy`, `Crow`, `Piranha` and `Boss` all have
one. The crocodiles and the spiders write their own position instead of setting
a velocity, so for those not being stepped really is all the stopping needed.

**A dozing piranha has to have its leap cancelled**, not merely stopped.
Gravity is on during a leap, so one frozen in mid-air goes on falling — out of
its pool and out of the level, with nothing steering it.

The weather and the lava are not creatures. They are the place, and they carry
on whether or not anybody is looking; what the lava does *not* do off screen is
get heard, and that is handled where it spits.

## `hasHeadroom` filters by `isSolidTile`, same as `solidBeside`

Standing up used to check for *any* static body in the space above a crouched
cat, and charms, checkpoints and invisible ledges (a nest, a tree's crown) are
all static bodies too. A heart floating at head height over a branch left the
cat stuck crouched under nothing anyone could see -- the same class of bug
`isSolidTile` already exists to rule out for `solidBeside`, just not applied
here. Measured: a fake charm placed exactly in the headroom rectangle blocked
standing before the fix and does not after; a real tile in the same spot still
blocks it correctly.
