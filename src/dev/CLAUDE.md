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

Ctrl- or Cmd-click the level name in the HUD to jump to the next level. It
ignores any star the level requires, because skipping past a level you have not
finished is the point of it.

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

Berries are remembered by their **level position**, not their index, so adding
or removing berries elsewhere does not un-collect the wrong ones. Their sprites
carry that position in `levelPosition` data, because the bob tween means a
sprite's own `y` is no longer where the level put it.
