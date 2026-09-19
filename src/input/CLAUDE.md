# Input

One class, `Controls`, and one rule:

> **Gameplay code never asks whether this is a phone.**

It asks `controls.left`, `controls.right`, `controls.up`, `controls.sneak`,
`controls.jumpJustPressed`, `controls.jumpHeld` and
`controls.directionJustPressed`. `Controls` merges keyboard and touch behind
those answers. Adding a device or a key rebinding should touch this folder only.

Bindings today: arrows / WASD / Space on a keyboard, and four on-screen buttons
on a touch device — back, forward, sneak, jump. Movement sits under the left
thumb, actions under the right.

## Up and jump are one input

`Space`, `↑` and `W` all do the same thing, and there is one button for it on a
phone. `controls.up` and `controls.jumpHeld` return the same boolean; read
whichever name says what you mean.

They were split once, because both are things you do upwards and sharing a
button appeared to mean you could **never jump off the thing you are climbing**.
Two buttons for one intention turned out to cost more than that bought —
especially for a thumb — so the conflict is resolved further down instead:
`Player` decides what "up" means from where the cat is (ground: jump; rope:
climb; water: swim up), and leaping off a rope is **up plus a direction**.

`directionJustPressed` exists only for that leap. It has to fire whichever of
the two the hand happens to press second, so both edges are watched.

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
sneak and jump at once.

## Adding a control

1. Add the binding in the constructor and the getter in `Controls`.
2. For a touch button, push a rect in `createTouchUi()` and generate its glyph
   in `BootScene.generateButtonTextures()` under the key `ui-<name>`.
3. Touch UI is pinned with `setScrollFactor(0)` and a high `setDepth`.

Button rects are in game-pixel coordinates (the fixed 640x360 space), so they
land in the same place on every screen.
