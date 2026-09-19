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

## The two poses

The cat is drawn standing (22x18) and sneaking (26x9), each baked at exactly
its physics body size. The sprite origin is at the **paws**, `(0.5, 1)`, so with
body and frame identical the offset is always zero and the cat neither sinks
into the floor nor pops off it when the pose swaps. Spawn points are therefore
ground lines, not sprite centres.

Standing is 18px — taller than one 16px tile on purpose. A one-tile gap under an
overhang cannot be walked through, only sneaked through, so the level grid
alone creates a sneaking passage with no special markup.

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

Buoyancy only ever *slows a sink*; it never lifts the cat by itself. Rising is
entirely down to strokes, one per press of jump, which is what keeps a pool
somewhere you have to swim rather than something you bob out of.

Water is harmless by design — the original wish was that not every pool has a
piranha in it, which only means anything if a pool without one is safe.

## Climbing trunks

Climbing **replaces** ordinary movement rather than adding to it — no gravity,
no jumping, no wall logic — so `updateClimb` runs first in `step` and
short-circuits everything else when it returns true.

Trunks carry no physics body at all. They are meant to be walked through, so
`findTrunk` does its own rectangle test against zones handed in by the scene,
rather than going through Arcade. That also keeps it free of ordering problems:
an overlap callback would not have run yet at the point `step` needs the answer.

There is no grab button and no release button:

- **Falling onto a trunk catches it.** That is the automatic grip.
- **From the floor, up grabs instead of jumping**, the way standing at the foot
  of a ladder does.
- **Reaching out sideways lets go.**

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
