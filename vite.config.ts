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

export default defineConfig({
  // GitHub Pages serves this as a project site at /Catnah/, not at the root of
  // a domain, so every built asset URL has to be prefixed. It has to be a
  // literal here rather than derived from the repository name, because that is
  // only known to the workflow.
  base: '/Catnah/',

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
