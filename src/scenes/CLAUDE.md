# Scenes

Phaser scenes. Registered in order in `src/main.ts`; the first one starts.

- **`BootScene`** — generates placeholder textures, then `start('Game')`.
- **`GameScene`** — builds the level, owns the player, camera, HUD and the
  update loop.

## Update order is deliberate

`GameScene.update` samples input first, then steps the player:

```ts
this.controls.update();          // latch edge-triggered state for this frame
this.player.step(this.controls, delta);
```

`Controls.update()` is what makes `jumpJustPressed` true for exactly one frame.
Anything reading input must run after it, so entities are stepped explicitly
from the scene rather than through Phaser's automatic update list — that list
gives no ordering guarantee relative to the input sample.

## Placeholder art

`BootScene` calls `generatePlaceholderArt` from `src/art` and then starts the
game. The drawing itself lives in `src/art`, not here — see its CLAUDE.md.

When real art arrives, load it in `preload()` under the same texture keys and
delete the matching generator. Nothing else in the game changes, because
everything refers to art by key alone.

## Adding a scene

1. Create it here, `super('SomeKey')` in the constructor.
2. Add it to the `scene` array in `src/main.ts`.
3. Switch with `this.scene.start('SomeKey')`.

A menu, a pause overlay and a game-over screen all belong here rather than as
branches inside `GameScene`.
