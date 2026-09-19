# Backlog

Future wishes, as tickets. Nothing here is built yet — this is the list we talk
about and pick from. What *is* built is described in [`work.md`](work.md), and
the decisions taken along the way are in [`questions.md`](questions.md).

**Statuses**: `todo` · `in progress` · `blocked` · `icebox`

When a ticket is built, what it changed is written up in `work.md` and **the
ticket is deleted from here**. So this file is only ever what is still wanted.
Numbers are not reused, which is why there will be gaps.

---

## 34 — Something a cat would actually chase

`todo`

Berries are what the cat collects, and a cat does not pick fruit. Nor would it
collect fish, which would also be strange up a tree. The collectible needs to be
something a cat wants, that can plausibly be in a treetop, a cave, a city street,
a swamp, a canopy and a volcano.

Options, best first:

1. **A butterfly, and one per place.** A cat chasing a butterfly is the whole
   fantasy of the game in one image, and it explains why the things worth having
   are in awkward places: they went there. It reuses the theme palette exactly as
   the tiles do — butterfly in the forest and the canopy, **glow-worm** in the
   cave, **moth round a lamp** in the city, **dragonfly** over the swamp,
   **ember-moth** in the volcano. It also gives them a reason to hover and drift
   rather than sit still.
2. **A feather.** Ties straight into the crows: you take their nest's spare heart
   and their feathers. Works anywhere, needs no animation, but is a quieter idea.
3. **A ball of yarn.** Very cat, and completely absurd in a swamp or a volcano.

Picking one settles what `generateBerry` draws and what the HUD icon is; nothing
else in the game changes, because everything refers to it by texture key.

---

Nothing else is outstanding. The nearest thing to a list of what could come next
is the *Still open* notes in [`questions.md`](questions.md) — they are questions
rather than tickets, and answering them is what would turn them into tickets.
