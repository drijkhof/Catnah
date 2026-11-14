/**
 * Named moments in the browser's performance timeline, for measuring how
 * long the game takes to load and to build a level -- on a real phone, or in
 * the throttled runs described in `CLAUDE.md`. Free when nobody reads them,
 * so they stay in the build.
 *
 * - `catnah:boot` -- the boot scene has started loading files
 * - `catnah:art` -- every picture is drawn
 * - `catnah:title` -- the title screen's level is built: the game is playable
 * - `catnah:level:<name>` -- a measure, how long building that level took
 * - `catnah:space` -- a measure, how long building space took
 */
export function mark(name: string): void {
  performance.mark(`catnah:${name}`);
}

/** Times `build` as the measure `catnah:<name>`. */
export function timed<T>(name: string, build: () => T): T {
  const start = performance.now();
  const result = build();
  performance.measure(`catnah:${name}`, { start, end: performance.now() });
  return result;
}
