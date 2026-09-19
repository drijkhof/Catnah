# Objects

Game entities — things that exist in the world and have behaviour. Currently
just `Player`.

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

## Player movement is intentionally not "velocity = input * speed"

`Player` implements four things that separate a platformer that feels tight from
one that feels slippery and unfair. Do not simplify them away:

- **Acceleration and friction** rather than instant velocity, with reduced
  `airControl` while airborne.
- **Coyote time** — a jump still fires shortly *after* walking off a ledge.
- **Jump buffering** — a jump pressed shortly *before* landing fires on contact.
- **Jump cut** — releasing early shortens the hop, giving variable height.

All four are tuned by the `PLAYER` block in `src/config.ts`. Tune there; do not
hardcode numbers in the entity.

Both grace timers are zeroed when a jump fires, otherwise one press could
trigger a second jump the next frame while the windows are still warm.

## Body access

`declare body: Phaser.Physics.Arcade.Body;` re-types the inherited nullable
`body`, so the entity gets full typing with no casts. Reuse that pattern.

Ground checks use `body.blocked.down || body.touching.down` — `blocked` is for
world bounds and static bodies, `touching` for dynamic ones; a moving platform
would only set the latter.
