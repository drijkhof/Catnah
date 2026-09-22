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

## The poses

The cat is drawn standing (22x18) and sneaking (26x9), each baked at exactly
its physics body size. The sprite origin is at the **paws**, `(0.5, 1)`, so with
body and frame identical the offset is always zero and the cat neither sinks
into the floor nor pops off it when the pose swaps. Spawn points are therefore
ground lines, not sprite centres.

Standing is 18px — taller than one 16px tile on purpose. A one-tile gap under an
overhang cannot be walked through, only sneaked through, so the level grid
alone creates a sneaking passage with no special markup.

**Climbing is a third picture but not a third pose.** `cat-climb` is baked at
the standing frame size and the body is left alone, so taking hold of a rope
changes nothing but the drawing. That is why `refreshTexture` is separate from
`applyPose`. The cat is drawn head-up and from behind, and is never flipped
vertically: a cat climbing *down* a rope still goes head-up, backwards, the way
a real one does. Head-down would read as falling.

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

## The beetle stands in the way

It is not a patrol that might happen to be overhead. `guard()` puts it between
the cat and the door and keeps it there, and three details are what make that
work -- each of them found by watching a bot walk straight past the version
before it:

- **It leads.** Aiming at where the cat *is* means always being behind where the
  cat will be; it trailed sixty pixels back the whole way and blocked nothing.
- **It is faster than the cat.** 215 against 190. Below that, a cat that simply
  ran at the door overtook it.
- **It will not give ground past the door.** Backing off for ever meant a cat
  that ran was escorted to the exit by a beetle politely keeping its distance.
  It retreats until its back is to the exit, and then it stands.

`guardY` puts it low -- fourteen pixels of clearance, measured to the bottom of
the body. A standing cat is 18 and does not fit; a sneaking one is 9 and does.
The floor comes from `groundLine` rather than a search for the nearest solid
underneath, because the beetle is placed low in its arena and half the floor is
*above* it: a search finds the second row down and hangs the beetle in the
ground.

The climb back after a dive is the slow part on purpose. That is the window.

## The lava lake

`LavaLake` owns everything the lava *does*; `GameScene` keeps only the
rectangles that kill. Three things, none of which is a new hazard:

- **The boil.** Four baked frames per theme, and each tile is given a phase from
  its own grid position. A shared clock makes the whole lake blink at once,
  which reads as a lighting bug rather than as boiling.
- **The heat.** One additive rectangle per surface tile, breathing on a tween,
  with a delay taken from the tile's column so the haze ripples along the lake.
- **The gobbets.** Plain images moved by hand rather than physics bodies: there
  are a lot of them, nothing may ever collide with one, and a body nothing
  touches is a body the physics step walks over for no reason.

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

### Leaping off is up plus a direction

Up and jump are one input now (see `../input/CLAUDE.md`), so "jump off the rope"
needs an answer that is not a second button. It is up *and* a direction: up
alone climbs, a direction alone moves along, and the two together throw the cat
off towards where you are pointing.

`wantsToLeap` asks for a **fresh press of one of the two**, not merely both
being held. Without that, catching a rope in mid-run — direction held, up held
for jump height — flings the cat straight back off the rope it just caught.
Measured: with both held throughout, the cat catches a liana and holds it for 23
frames before shimmying off the end, rather than bouncing off it on frame one.

`leapFromTrunk` clears the coyote window `releaseTrunk` just handed out, or the
same press would buy a second jump on the very next frame.

**Holding on is not centred on a column.** Left and right move the cat sideways
at `climbHorizontalSpeed` instead of letting go, which is what makes a bank of
ropes a wall rather than a row of poles. Climbing off the end of one drops the
cat, because `findTrunk` stops finding anything.

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
  end of a 176-tile city is heard at exactly the volume of one standing next to
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
