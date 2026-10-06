import { SCORE } from './config';

/**
 * The score is a clock, and lower is better: every second spent in a level,
 * plus a minute for every death. One place for the sum and for how it is
 * written, so the HUD during play and the victory screen cannot disagree.
 */
export function scoreMs(elapsedMs: number, deaths: number): number {
  return elapsedMs + deaths * SCORE.deathPenaltyMs;
}

/** Milliseconds as m:ss. */
export function formatClock(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
