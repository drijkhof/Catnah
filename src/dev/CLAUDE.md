# Dev

Development-only code. None of it ships: every entry point is behind
`import.meta.hot` or `import.meta.env.DEV`, both of which Vite resolves away in
a production build.

## Hot reloading keeps the player in place

A code change swaps the game in place instead of reloading the page. Without it
every tweak drops the player back at the spawn point, so looking at a change
made near the end of the level costs the walk back each time.

The game is genuinely **rebuilt**, not patched. A module change gives new class
definitions while the running scenes hold instances of the old ones, so the only
honest option is to stand up a new game and carry the state across:

1. `import.meta.hot.dispose` asks the outgoing `GameScene` for a snapshot and
   destroys the game.
2. The snapshot rides across in `import.meta.hot.data`.
3. `preBoot` puts it in the registry, where the incoming `GameScene` finds it at
   the end of `create`.

The snapshot is deliberately small — where the cat is and what it has collected.
Everything else is rebuilt from the new source, which is the entire point.

## Three things that will bite

**`import.meta.hot` is per module, and Vite reads the calls statically.** An
`accept()` written in this folder makes *this file* self-accepting and nothing
else, and one reached through a helper function is not detected at all. Either
mistake leaves the entry module unaccepting and every change quietly falls back
to a full page reload. That is why `accept()` and `dispose()` are written out
literally in `src/main.ts` while only the helpers live here.

**Capturing can come up empty.** A game replaced again before it has drawn its
first frame has no `Game` scene to ask, so `dispose` falls back to the snapshot
it was carrying. Without that, the second of two quick edits loses the player's
place.

**Phaser's teardown is deferred.** `game.destroy()` waits for the next tick of a
loop that has just been stopped, so the old canvas is orphaned rather than
removed, and they stack up one per edit. `dispose` clears the container itself.

## The level-skip shortcut

Cmd-click the level name in the HUD to jump to the next level, Ctrl-click to go
back one. Skipping past a level you have not finished is the point of it.

**It lives in its own module on purpose.** Guarding the code with
`import.meta.env.DEV` stops it *running* in a production build, but a class
method guarded from the inside is still in the bundle: Rollup will not drop a
method, since anything could call it by name. A standalone function whose only
call sits inside a dead branch does get dropped. Checked after building:
`installLevelSkip` appears zero times in `dist`.

Mac needs `disableContextMenu()`, or Ctrl-click opens the browser's own menu
instead.

## Restoring is allowed to refuse

The level can change between builds. `GameScene.restoreState` checks the saved
position is not inside something solid and falls back to the spawn if it is,
rather than wedging the cat inside a rock that was not there a second ago.

Little hearts are remembered by their **level position**, not their index, so adding
or removing little hearts elsewhere does not un-collect the wrong ones. Their sprites
carry that position in `levelPosition` data, because the bob tween means a
sprite's own `y` is no longer where the level put it.

## God mode, and why this one ships

`installGodMode` is the one thing in this folder that is **not** wrapped in
`import.meta.env.DEV`. The game is played and tested on a phone, against the
copy deployed to Pages, so a cheat that only exists on the machine it was
written on would never be where it is needed.

It is **option-click** on the level name, or **press and hold** it. The second
is not a nicety: there is no option key on a phone, and the phone is the point.
The long press is started on every press and thrown away the instant the finger
lifts or leaves, so an ordinary tap — and a Cmd- or Ctrl-click on the same
label — never trips it.

While it is on, **the level name is gold**. A cheat you cannot tell is running
is a cheat that will one day explain a bug that was never there.

**It is deliberately not silent.** You still hear the hit, feel the shake and
see the cat flush red; the only thing that does not happen is losing a life. A
cheat that hides your mistakes hides exactly the thing you turned it on to
judge.

Two details that are easy to get wrong:

- **It needs a cooldown.** The lava and thorn checks run every frame for as
  long as the cat overlaps them, so standing in lava replayed the hurt sound
  sixty times a second. `godCooldown` is 700ms.
- **Falling out of the world is different.** There is no floor down there to
  carry on standing on, so god mode puts the cat back at the spawn and charges
  nothing for it, rather than shrugging.

The flag lives in the scene registry, so it survives changing level — which
builds a whole new `GameScene` — and dies with the tab, which is where a cheat
should die.

## A hot reload can land on a pending death

`kill()` waits 650ms (`this.time.delayedCall`) before respawning the cat, and a
code edit saved during that window destroys the old game -- bodies and all --
out from under the timer that is still waiting to fire. It fired anyway, and
crashed reaching into a spare heart's body that the teardown had already taken
away: `Cannot read properties of undefined (reading 'gameObject')`, from deep
inside Phaser's `enableBody`.

The delayed callback now checks `this.sys.isActive()` first and bails out if
the scene it belongs to is no longer running. Not reachable in the built game
-- `import.meta.hot` does not exist there -- only from editing code while a
death is mid-flight, which is exactly what real playtesting during development
does all the time.
