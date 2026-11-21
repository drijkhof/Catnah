import { EARTH_GLOBE, PLANET_SIZE_KEEP, REAL_PLANET_SIZE, SPACE } from '../config';

/** A world's globe across, px, out in space: see `REAL_PLANET_SIZE`. */
export function globeOf(name: keyof typeof REAL_PLANET_SIZE): number {
  return EARTH_GLOBE * Math.pow(REAL_PLANET_SIZE[name], PLANET_SIZE_KEEP);
}

/** The Earth round the sun and the Moon round the Earth, as `SpaceScene`'s `WORLDS` has them. */
export const EARTH_ORBIT = { orbit: 820, years: 1, angle: 0.6 } as const;
export const MOON_ORBIT = { orbit: 250, angle: -0.5 } as const;

/**
 * How deep the Moon is in the Earth's shadow at `t` (the game's clock,
 * `game.loop.time`, ms), 0 to 1: none once clear of it, 1 once the whole
 * Moon is inside. Only the two angles matter -- the shadow points straight
 * away from the sun -- so space and the Moon level work it out alike, and
 * the eclipse goes on while the cat is down on the Moon. Once every
 * `1 / (1/moonMonthMs - 1/yearMs)`: every 200 s, about half a minute long.
 */
export function eclipseDepth(t: number): number {
  const earth = EARTH_ORBIT.angle + (t / (SPACE.yearMs * EARTH_ORBIT.years)) * Math.PI * 2;
  const moon = MOON_ORBIT.angle + (t / SPACE.moonMonthMs) * Math.PI * 2;
  const along = MOON_ORBIT.orbit * Math.cos(moon - earth);
  if (along <= 0) {
    return 0;
  }
  const off = MOON_ORBIT.orbit * Math.abs(Math.sin(moon - earth));
  const earthRadius = globeOf('earth') / 2;
  const moonRadius = globeOf('moon') / 2;
  return Math.min(1, Math.max(0, (earthRadius + moonRadius - off) / (2 * moonRadius)));
}
