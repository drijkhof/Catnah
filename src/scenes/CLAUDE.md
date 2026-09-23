# Scenes

Phaser scenes. Registered in order in `src/main.ts`; the first one starts.

- **`BootScene`** — generates placeholder textures, then hands off.
- **`TitleScene`** — the title screen, and where a finished run ends up.
- **`GameScene`** — builds the level, owns the player, camera, HUD and the
  update loop.
- **`GameOverScene`** — black, one line of red, and back to the title.

`BootScene` starts `Title`, **except on a hot reload**, which carries a game in
progress: dropping the player back on the title screen would throw away the
place `src/dev/hot.ts` went to such trouble to keep. It tests for the snapshot
in the registry to tell the two apart.

Losing the last heart does not switch scenes. `GameScene.endRun` drains the
colour out of its **own camera** with a `ColorMatrix` filter, pauses itself, and
*launches* `GameOver` over the top — so what is underneath is the exact frame
the cat died on, still and colourless, with one red word on it.

Two things that follow from it being an overlay:

- `GameOverScene` **stops** the `Game` scene when it leaves. A paused scene
  stays paused for ever otherwise, sitting behind the title screen.
- `GameScene.create` **clears the camera's filters**. Nothing else does, and a
  new run starting in black and white is a haunting little bug.

`GameOverScene` ignores input for its first 900ms. A death is usually a keypress
or a tap, and without the pause the same press that killed you also dismisses
the message. Its text is at full alpha from the first frame and only *then*
given a pulse -- fading it up was prettier and made the one thing that screen
exists to say depend on a tween having run.

## The title screen is the game, not a picture of it

`TitleScene` uses the first level's own backdrop and the real cat, crow,
hedgehog and piranha textures, all of them moving. It costs a handful of tweens
and says more about what this is than an arrangement of static sprites would.

Nothing in it has a physics body and it has no `update` at all -- everything is
on a tween -- so it cannot drift out of step with the game it advertises.

## Checkpoints move the respawn point, nothing else

`respawnPoint` starts each level as `level.spawn`. The level's own start is
therefore a checkpoint too, without needing to be one -- there was nothing to
build for it.

Touching a `*` calls `activateCheckpoint`, which is **idempotent**: it checks
whether this is already the active one before doing anything, so standing on
one does not replay the sound or the flash every frame. The body is never
disabled the way a charm's is -- a checkpoint stays exactly what it looks like,
always touchable, and touching an old one again after passing a newer one
simply moves the respawn point backwards, which is the correct behaviour for
going back to fetch something.

Both places that call `player.respawnAt` -- dying, and god mode's save from
falling out of the world -- read `this.respawnPoint`, never `this.level.spawn`
directly. Adding a third respawn site later has to do the same.

It survives a hot reload the same way collected charms do: `captureState`
records the active checkpoint's `levelPosition`, not the sprite or an index,
and `restoreState` looks it up by position in the new build. It is `optional`
on `GameSnapshot` so an old snapshot without one still restores everything
else.

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
