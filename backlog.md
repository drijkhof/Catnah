# Backlog

Future wishes, as tickets. Nothing here is built yet — this is the list we talk
about and pick from. What *is* built is described in [`work.md`](work.md).

**Statuses**: `todo` · `in progress` · `blocked` · `done` · `icebox`

When a ticket is built, set it to `done` and move what it added into `work.md`.

| # | Title | Status | Depends on |
| --- | --- | --- | --- |
| [1](#1--hazards-and-dying) | Hazards and dying | `todo` | — |
| [2](#2--boulders) | Boulders | `todo` | — |
| [3](#3--tree-trunks) | Tree trunks | `todo` | — |
| [4](#4--water) | Water | `todo` | — |
| [5](#5--piranhas) | Piranhas | `todo` | 1, 4 |
| [6](#6--hedgehogs) | Hedgehogs | `todo` | 1 |
| [7](#7--double-jump-off-a-wall-or-trunk) | Double jump off a wall or trunk | `todo` | 3 |
| [8](#8--the-view-follows-the-cat-upward) | The view follows the cat upward | `todo` | — |
| [9](#9--the-great-tree-its-nest-and-the-crow) | The great tree, its nest and the crow | `todo` | 1, 8 |

---

## 1 — Hazards and dying

`todo`

Touching a piranha or a hedgehog kills the cat. Nothing can currently hurt it,
so before either enemy can exist there has to be a way to die on contact.

**Not asked for directly** — added because tickets 5 and 6 both need it, and
building it twice inside two enemies would be the wrong shape. Say the word if
you would rather fold it into whichever enemy comes first.

Falling into a gap already respawns the cat with a screen flash. The cheapest
version of this ticket is to reuse exactly that for contact deaths too.

**Acceptance**

- Touching anything marked as a hazard respawns the cat at the level start.
- The death reads clearly — some pause or effect, not an instant teleport.
- Falling out of the world keeps working as it does now.

**Open questions**

- Lives, or infinite retries?
- Respawn at the level start, or at a checkpoint part-way through?
- Do collected berries stay collected after dying?

---

## 2 — Boulders

`todo`

Rocks in the forest.

**Open questions**

- Scenery you walk past, solid things you climb on, or both?
- Can they be pushed, or do they roll and crush?

**Notes** — as static solids these are cheap: a new tile character in
`src/level/Level.ts` plus a texture in `src/art/forest.ts`. Anything that moves
is a much bigger ticket and should be split off.

---

## 3 — Tree trunks

`todo`

Standing tree trunks as part of the level, not just as backdrop. Trees already
exist in the scenery behind the level; these are ones the cat can actually meet.

Wanted partly for their own sake and partly because ticket 7 wants something to
jump off.

**Acceptance**

- A trunk is solid and blocks movement.
- Hedgehogs turn around at one (ticket 6).

**Open questions**

- Can the cat climb or cling to a trunk, or only bump into it?
- Full tile column, or narrower than a tile?

---

## 4 — Water

`todo`

Water in the forest. Some pools hold a piranha (ticket 5), some are empty —
**not every pool has one**, so water and piranha are deliberately separate
tickets.

**Open questions**

- Is water itself dangerous, or only what lives in it?
- Can the cat swim, wade, or is it purely an obstacle to jump over?
- Does it animate?

---

## 5 — Piranhas

`todo` · needs [1](#1--hazards-and-dying), [4](#4--water)

Piranhas live in water and **jump up out of it now and then**. Touching one
kills the cat.

**Acceptance**

- A piranha is tied to a body of water; water without one stays safe.
- It leaps on a repeating cycle and falls back in.
- Contact kills, whether the cat is jumping over or standing next to it.
- The leap is telegraphed enough to be dodged — a fair jump, not a coin flip.

**Open questions**

- Fixed rhythm, or random timing?
- Does it jump higher if the cat is close?
- Can it be avoided by sneaking past?

---

## 6 — Hedgehogs

`todo` · needs [1](#1--hazards-and-dying)

Hedgehogs patrol back and forth. Touching one kills the cat.

**Acceptance**

- Walks back and forth along its platform.
- **Does not walk off the edge** — turns around at a drop.
- **Turns around at an obstacle**, for example a tree trunk (ticket 3).
- Contact kills the cat from any direction.

**Open questions**

- Can it be jumped on to defeat it, like most platformers, or never?
- Does sneaking let the cat past one unnoticed? The cat sneaking and the
  enemy being a hedgehog both hint at it, but it is a real design decision.
- Speed relative to the cat?

**Notes** — edge detection ("is there still floor ahead of me?") is the fiddly
part. A look-ahead probe below and in front of the hedgehog is the usual answer
and fits the existing arcade physics.

---

## 7 — Double jump off a wall or trunk

`todo` · needs [3](#3--tree-trunks)

A second jump in mid-air, off a wall or a tree trunk.

**Open question, needs deciding first** — "double jump (via muur of boomstam)"
reads two ways:

1. **Wall jump**: the second jump only works while touching a wall or trunk, and
   pushes the cat away from it. Climbing a gap between two trunks becomes a
   skill.
2. **Free double jump**, with walls and trunks simply being where you would
   usually use it.

These play very differently and the level is designed around whichever we pick.
Ticket written assuming **wall jump**, since "via" suggests jumping *off*
something.

**Acceptance (assuming wall jump)**

- While airborne and touching a wall or trunk, jump fires again.
- The jump pushes the cat away from the surface, not just upward.
- It resets on landing, so a wall cannot be climbed indefinitely by one press.

**Notes** — `Player` already has the structure for this: `body.blocked.left` and
`blocked.right` say which surface is being touched, and the coyote-time and
jump-buffer timers are the pattern a wall-jump grace window would follow.

---

## 8 — The view follows the cat upward

`todo`

The viewport should move up with the cat, so it can climb out of the frame it
starts in.

**The camera already follows vertically** — `startFollow` tracks both axes. The
problem is that there is nowhere to go: the level is 23 tiles (368px) tall
against a 360px viewport, which leaves **8px** of vertical travel, against a
vertical deadzone of 60px. So the view never moves.

What this ticket really needs is vertical *room*: a level taller than the
screen, and the camera framing tuned for climbing rather than for running
left to right.

This blocks ticket 9 — a tall tree is pointless if the top of it cannot be seen.

**Acceptance**

- The level is meaningfully taller than the viewport.
- Climbing moves the view up, and it settles back down on the way down, without
  snapping or jitter.
- The cat stays comfortably in frame while jumping — a jump should not shove the
  view around.

**Open questions**

- Should the view follow upward *faster* than it comes back down? Platformers
  usually do, so that a jump does not make the screen bob.
- Should it stay locked while the cat is airborne and only catch up on landing?
  That is the usual answer to bobbing, at the cost of feeling stiff.

**Notes** — the two knobs are already in `GameScene`: `setDeadzone(120, 60)` and
the lerp in `startFollow(player, true, 0.12, 0.12)`.

Two things will need checking once the camera actually moves vertically. The
backdrop in `src/world` plants trees relative to the ground line and has only
ever been seen with a fixed vertical view, so parallax ranks may show gaps above
or below. And the fall-out threshold in `GameScene` is derived from the level
height, which this ticket changes.

---

## 9 — The great tree, its nest and the crow

`todo` · needs [1](#1--hazards-and-dying), [8](#8--the-view-follows-the-cat-upward)

A single great tree standing in the middle of the field, far taller than the
rest of the forest, with a **nest at the top** — and a **crow** that lives in it
and attacks.

**The crow**

- Circles its nest, and goes for the cat specifically once the cat comes near.
- Moves **horizontally and vertically at once**, so it flies in curves and comes
  in on attack runs rather than sliding along a straight line.
- Contact kills the cat.

**How the crow looks**

- Black feathers with a slight grey sheen.
- Red eyes.
- Almost as big as the cat — so roughly 20x16 game pixels, against the cat's
  22x18. Big enough to be a real threat on screen, not a bird-shaped dot.

**Buildable in two stages**, and worth doing that way: the tree and its nest are
level geometry and stand on their own as somewhere to climb, while the crow is
the most complex enemy on this list. Kept as one ticket because it is one idea.

**Acceptance**

- The tree is climbable to the top, and the nest is a place you can reach.
- The crow patrols near the nest while the cat is far away.
- It breaks off and attacks when the cat comes within some range, then returns.
- Attack runs curve; the crow never just slides horizontally.
- Contact kills the cat, from any direction.
- An attack can be dodged by a player who sees it coming.

**Open questions**

- Is the nest the goal of the level, or just a place with something in it?
- Does the crow ever give up and go home, or keep coming while the cat is close?
- Can it be defeated, or only avoided?
- Does it attack while the cat is on the ground far below, or only up in the
  tree?
- Does sneaking hide the cat from it? Same question as the hedgehog, and the two
  answers should probably match.

**Notes** — curved flight wants steering (a velocity turned gradually toward the
target) rather than arcade physics collision. `Phaser.Math.Vector2` rotation or
a simple seek-and-turn is enough; gravity should be off for this body.

This is the first enemy that needs to know where the cat *is*, rather than just
walking a fixed path, so it is a step up from ticket 6 in every respect.
