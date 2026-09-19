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
- **Jump buffering** — a jump pressed shortly *before* landing fires on contact.
- **Jump cut** — releasing early shortens the hop, giving variable height.
  Measured: ~86px held, ~41px tapped.
- **Sneaking**, **wall jumping** and **climbing**, below.

All of it is tuned by the `CAT` block in `src/config.ts`. Tune there; do not
hardcode numbers in the entity.

Both grace timers are zeroed when a jump fires, otherwise one press could
trigger a second jump the next frame while the windows are still warm.

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

`lastWallJumpSide` blocks a second wall jump from the same side. A lone wall is
therefore never a climb -- it gives one jump and no more -- and a shaft of two
facing walls is. Landing clears it.

### The wall is remembered for a moment

`wallCoyoteTimer` keeps a wall jumpable briefly after contact is lost, and
`applyJump` is handed that remembered side rather than the one being touched
right now.

Without it the move demands you keep pressing *into* the wall: pressing away
breaks the very contact the jump is looking for, leaving a single frame to press
jump in. Pressing away and jumping is what players actually do, and it is how
they say where they want to go. The timer is spent on use, so one contact cannot
be cashed in twice.

### The push and the lock are a pair, and both cost height

Every pixel of push has to be paid back by steering into the wall again, and
that return takes time the cat spends falling. Tuned too high, a lone wall
becomes *unclimbable*: the first attempt used 250 px/s for 150ms and a cycle lost
more height than a wall jump gained, so the cat took exactly one jump and sank.
150 px/s for 100ms nets upward. Change either number and re-measure a climb —
the failure is silent and looks like a level problem, not a tuning one.

## Body access

`declare body: Phaser.Physics.Arcade.Body;` re-types the inherited nullable
`body`, so the entity gets full typing with no casts. Reuse that pattern.

Ground checks use `body.blocked.down || body.touching.down` — `blocked` is for
world bounds and static bodies, `touching` for dynamic ones; a moving platform
would only set the latter.
