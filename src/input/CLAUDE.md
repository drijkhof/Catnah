# Input

One class, `Controls`, and one rule:

> **Gameplay code never asks whether this is a phone.**

It asks `controls.left`, `controls.right`, `controls.jumpJustPressed` and
`controls.jumpHeld`. `Controls` merges keyboard and touch behind those four
answers. Adding a device or a key rebinding should touch this folder only.

Bindings today: arrows / WASD / Space on a keyboard, and three on-screen buttons
on a touch device.

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

`scene.input.addPointer(2)` is required and easy to forget: Phaser tracks a
single pointer by default, so without it a player cannot hold a direction and
jump at the same time.

## Adding a control

1. Add the binding in the constructor and the getter in `Controls`.
2. For a touch button, push a rect in `createTouchUi()` and generate its glyph
   in `BootScene.generateButtonTextures()` under the key `ui-<name>`.
3. Touch UI is pinned with `setScrollFactor(0)` and a high `setDepth`.

Button rects are in game-pixel coordinates (the fixed 640x360 space), so they
land in the same place on every screen.
