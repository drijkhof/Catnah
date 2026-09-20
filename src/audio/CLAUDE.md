# Audio

One file, `Sound.ts`, and one rule:

> **No audio assets.** Every sound is synthesised, for the same reason every
> texture is drawn: the project has no binary files and runs the moment it is
> cloned.

Each voice is a few oscillators and an envelope. That is plenty for a bubble, a
caw, or a cat's feet leaving the ground, and it means a new sound costs six
lines rather than a trip to a sample library and a licence.

## It has to be started from a user gesture

`sound.unlock()` creates the `AudioContext`, and it **must** be called from
inside a real click or keypress handler. A context created any other way sits in
`suspended` for ever — silently, with no error anywhere, which is a horrible
thing to debug.

Two places call it: the keypress or tap that starts the game from the title
screen, and every press of the mute button. Both are genuine gestures, and the
second matters because unmuting before the context exists would look broken.

## Everything is quiet

The master gain is a fifth of full and no voice except the beetle's growl runs
longer than a fifth of a second. These sit *under* the game. If you can pick one
out while playing, it is too loud.

## Muted is checked twice

Once on the master gain, so anything already sounding fades out, and once at the
top of `play`, so a muted game is not building and tearing down dozens of
oscillators a second for nothing.

The setting lives in `localStorage` and every read and write is wrapped: private
windows and blocked storage both throw, and not being able to *remember* the
mute is not a reason to refuse to do it.

## The bed under each level

`setAmbience(kind)` puts one continuous layer under everything: filtered noise
with a slow oscillator on the gain, which is what wind and rain actually are.
The swell is what gives it a pulse without ever being a rhythm you could tap to.

Four kinds -- `wind`, `rain`, `rumble`, `hush` -- picked in `GameScene` off the
**theme**, not the level, because it is what the *place* sounds like. Asking for
the bed you already have does nothing, so two swamp levels do not restart the
wind between them.

**A bed is never broadband.** The city's rain was white noise through a highpass
at 1900Hz, which is not the sound of rain, it is the sound of sweeping a floor --
and at any level you could hear it at all, it was the loudest thing in the city.
Rain is *drops*: the bed is now a very soft low wash for them to land in, and
the rain itself is `patter`, scheduled five to fourteen times a second with the
pitch thrown all over the place, because drops hit slate, brick, a car roof and
a puddle and they do not agree.

**The sparse noises on top are scheduled by the scene**, not here. Birds and
drips are a decision about a level's pacing, and the audio has no business
holding timers. Every gap is randomised: birds on a fixed beat are a smoke
alarm.

## Adding a voice

1. Add the name to `Voice`.
2. Add a case to `play`, using `blip`, `hiss`, `thud` or a bespoke one.
3. Call `sound.play('name')` from the entity that makes the noise, not from the
   scene. The crow knows when it breaks off to attack; `GameScene` does not.

Tie a repeating sound to **distance covered** rather than to a timer where you
can — the rat's footfalls are every 11px, so they keep step with the thing
making them instead of ticking along beside it. And gate it on actually moving:
a rat pinned against a wall was still ticking away at nothing.

One voice breaks the quiet rule on purpose. `ratLeap` is the loudest thing in
the game by some way, because everything else is meant to sit *under* the game
and that one is meant to come out of it.

## Walking away has to stop it

`suspend()` and `wake()` are called from `main.ts` on `blur` and `hidden`. The
browser takes the *frames* away by itself, so the game stops without being
asked; an `AudioContext` keeps going regardless, which on a phone means a bed of
wind playing out of a pocket.

The context is only ever suspended, never closed. A closed one cannot be
reopened without another user gesture, and coming back to a game that is silent
until you tap the speaker would be worse than the noise.

Note that `game.loop.pause()` is **not** how you stop the game — it only records
what time it was, and the loop runs on. `game.pause()` is the one that sets the
flag `step` returns on.
