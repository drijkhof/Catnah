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
