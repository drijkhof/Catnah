import { execSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/** This project's port. Dev and preview both use it -- see CLAUDE.md. */
const PORT = 5180;

/**
 * Everything in `public/` is copied verbatim into the build, which would ship
 * the CLAUDE.md files that document those folders to the live site. They are
 * internal notes, so strip them from the output.
 */
function stripInternalDocs(): Plugin {
  return {
    name: 'strip-internal-docs',
    apply: 'build',
    async closeBundle() {
      const outDir = path.resolve(import.meta.dirname, 'dist');

      for await (const file of glob('**/*.md', { cwd: outDir })) {
        await rm(path.join(outDir, file));
      }
    },
  };
}

/**
 * The build number is the GitHub Actions run number when the deploy builds
 * it: a small integer that goes up by one per deploy, so "it broke in 42" is
 * easy to say and 43 is plainly newer. A laptop build has no run number and
 * uses the short commit hash instead, so it can never be mistaken for a
 * deploy. `unknown` when there is no git to ask either.
 */
function build(): string {
  const run = process.env.GITHUB_RUN_NUMBER;

  if (run) {
    return run;
  }

  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'unknown';
  }
}

/** Shown on the title screen. The `0.2` is by hand; the rest is the build. v0.1 is a git tag. */
const VERSION = `v0.2.${build()}`;

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(VERSION),
  },

  // Relative, so one build serves from anywhere: GitHub Pages at /Catnah/
  // and a custom domain at /. With an absolute base the built index wrote
  // `/Catnah/assets/...` into every script tag, and the same build broke the
  // moment it was served from any other path. The manifest, the icons and the
  // service worker (registered at `${BASE_URL}sw.js`, scope `BASE_URL`) are
  // relative too, so nothing in the shipped page names its own path.
  base: './',

  plugins: [stripInternalDocs()],

  server: {
    // Bind to 0.0.0.0 so the dev server is reachable from a phone on the same
    // Wi-Fi, not just from localhost on this laptop.
    host: true,

    // Deliberately not Vite's default 5173: another project on this machine
    // already listens there. Because that one binds [::1] while Vite here binds
    // the wildcard address, both servers can start "successfully" at once while
    // `localhost` silently serves the other project's app.
    port: PORT,

    // Fail loudly if the port is taken, rather than drifting to another one.
    strictPort: true,
  },

  preview: {
    host: true,
    port: PORT,
    strictPort: true,
  },

  build: {
    target: 'es2022',

    // Phaser is ~360 kB gzipped and ships as one chunk by design; splitting it
    // would only delay the point at which the game can start. Raised so the
    // warning stays meaningful for code we actually write.
    chunkSizeWarningLimit: 1600,
  },
});
