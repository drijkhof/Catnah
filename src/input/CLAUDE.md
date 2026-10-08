# Input

One class, `Controls`, and one rule:

> **Gameplay code never asks whether this is a phone.**

It asks `controls.left`, `controls.right`, `controls.up`, `controls.sneak`
(down), `controls.jumpJustPressed` and `controls.jumpHeld`. `Controls` merges
keyboard and touch behind those answers. Adding a device or a key rebinding
should touch this folder only.

Bindings today: arrows / WASD on a keyboard, and `↑`/`W` is the jump; on a touch
device a **stick** under the left thumb (four directions, diagonals) and a jump
button under the right. There is no Space.

## Up and jump: two inputs, one key on a keyboard

`up` is `↑`, `W` or the stick pushed up; `jumpHeld` / `jumpJustPressed` are
`↑`, `W` or the jump button. So on a keyboard one key feeds both, and the
touch stick pushed up feeds only `up` -- or every diagonal shove on a phone
would be a jump. `Player` decides what each means from where the cat is:
`up` held climbs a rope and swims up; the jump *edge* is the ground jump,
the wall jump, the swim stroke and the leap off a rope.

What keeps one key from doing two things at once is **order and edges**:
`updateClimb` runs before the jump is considered, and grabbing wants `up`
*held* while leaping wants the jump *edge* and only listens once the cat is
already climbing. So beside a rope one press grabs, holding climbs, a
second press leaps. Space used to be the jump; it is gone at the author's
word.

## The stick is a zone, not a button

Touch in the left 40% of the screen (below `TOUCH.zoneTop`) is the stick; the
vector from the drawn stick's centre to the finger, clamped to
`TOUCH.stickRadius`, gives left/right past `stickDeadZone` and up/down past the
larger `stickVerticalDeadZone`. The right 40% is the jump button. Both zones are
much bigger than what is drawn, so a drifting thumb stays on them.

`?touch` (`TOUCH_PREVIEW` in `config.ts`) builds the touch UI on a laptop and
includes the mouse pointer in the hit-test, so the controls can be tried with
a mouse.

## `update()` must run first, once per frame

`jumpJustPressed` is edge-triggered by comparing this frame's state against last
frame's, which only works if `update()` is called exactly once, before anything
reads it. `GameScene.update` does this at the top.

## Why touch buttons hit-test pointers instead of using pointer events

The touch buttons are hit-tested against every active pointer each frame, rather
than using Phaser's per-object `pointerdown` / `pointerup` handlers.

On a small screen, fingers slide while pressed. With pointer events, sliding a
thumb a few pixels off the d-pad fires `pointerout` and silently drops the
input, so the player keeps running or stops dead. Hit-testing every frame means
the input reflects where the finger *is*, which is what the player expects.

`scene.input.addPointer(4)` is required and easy to forget: Phaser tracks a
single pointer by default, so without it a player cannot hold a direction,
steer and jump at once.

## Adding a control

1. Add the binding in the constructor and the getter in `Controls`.
2. For a touch button, push a rect in `createTouchUi()` and generate its glyph
   in `BootScene.generateButtonTextures()` under the key `ui-<name>`.
3. Touch UI is pinned with `setScrollFactor(0)` and a high `setDepth`.

Touch zones are in game-pixel coordinates, so they land in the same place
relative to the screen on every device.
