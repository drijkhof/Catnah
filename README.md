# Catnah

A 2D platformer about a cat, built to be played in a browser on a phone or a
laptop. Six levels: forest, cave, city, swamp, canopy, volcano — and an evil
lord beetle at the end of the last one.

**Play it:** https://drijkhof.github.io/Catnah/

## Running it here

```sh
npm install
npm run dev        # http://localhost:5180
```

`npm run build` typechecks and builds; `npm run preview` serves the build on the
same port.

## Where things are

- [`work.md`](work.md) — what the game *is*: every rule of how it plays.
- [`backlog.md`](backlog.md) — what it is not yet.
- [`questions.md`](questions.md) — judgement calls made along the way, and what
  is still open.
- [`CLAUDE.md`](CLAUDE.md) — how the code is built, and why. Each folder under
  `src/` has one of its own.

## Deploying

Every push to `main` builds the game and publishes it to GitHub Pages
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). Nothing built
is ever committed.
