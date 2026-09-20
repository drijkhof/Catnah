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

## Adding a voice

1. Add the name to `Voice`.
2. Add a case to `play`, using `blip`, `hiss`, `thud` or a bespoke one.
3. Call `sound.play('name')` from the entity that makes the noise, not from the
   scene. The crow knows when it breaks off to attack; `GameScene` does not.

Tie a repeating sound to **distance covered** rather than to a timer where you
can — the rat's footfalls are every 9px, so they keep step with the thing making
them instead of ticking along beside it.
