/**
 * What this device remembers about every run ever played on it.
 *
 * Two kinds of number. **Records** are the best of a *finished* run -- the
 * fastest score (the clock plus a minute a death) and the fewest deaths --
 * and only a win sets them. They are kept **per version** of the game,
 * keyed by `__APP_VERSION__`, which carries the build number: a level that
 * changed is a different race, and a time set on it is not comparable with
 * one set before. **Totals** add up as they happen, whether or not the run
 * is ever finished, and across every version: time in a level, little
 * hearts, big hearts, deaths. Both live in `localStorage` under one key, per
 * device, with no account and no server behind them; a private window or
 * blocked storage simply remembers nothing, and the game plays the same.
 *
 * Time is counted a frame at a time by `GameScene.update`, and written out
 * every few seconds rather than every frame; everything else is written the
 * moment it happens.
 */

/** The records of one version of the game. */
export interface Records {
  /** The best score of a won run, ms; null until one is won. */
  bestMs: number | null;
  /** The fewest deaths in a won run; null until one is won. */
  fewestDeaths: number | null;
  wins: number;
}

export interface Stats {
  /** Records by version string, `__APP_VERSION__`, build number included. */
  records: Record<string, Records>;
  /** Time spent in levels, ms, over every run of every version. */
  playedMs: number;
  hearts: number;
  bigHearts: number;
  deaths: number;
}

const KEY = 'catnah:stats';

/** The version whose records this build sets and shows. */
const VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

const NO_RECORDS: Records = { bestMs: null, fewestDeaths: null, wins: 0 };

/** How much counted time may sit unsaved before it is written, ms. */
const FLUSH_EVERY_MS = 5000;

const EMPTY: Stats = {
  records: {},
  playedMs: 0,
  hearts: 0,
  bigHearts: 0,
  deaths: 0,
};

class StatsStore {
  private stats: Stats = { ...EMPTY };

  /** Counted time not yet written out, ms. */
  private unsavedMs = 0;

  constructor() {
    this.stats = StatsStore.read();
    if (typeof window !== 'undefined') {
      // The tab going away is the one write that must not wait.
      window.addEventListener('pagehide', () => this.flush());
    }
  }

  /** A copy of the numbers as they stand. */
  get snapshot(): Stats {
    return { ...this.stats, records: { ...this.stats.records } };
  }

  /** This version's records. */
  get records(): Records {
    return { ...(this.stats.records[VERSION] ?? NO_RECORDS) };
  }

  /** The version the records are kept under. */
  get version(): string {
    return VERSION;
  }

  /** Whether anything has ever been played on this device. */
  get any(): boolean {
    return this.stats.playedMs > 0 || this.stats.deaths > 0 || this.stats.hearts > 0;
  }

  addPlayed(ms: number): void {
    this.stats.playedMs += ms;
    this.unsavedMs += ms;
    if (this.unsavedMs >= FLUSH_EVERY_MS) {
      this.flush();
    }
  }

  addHeart(): void {
    this.stats.hearts += 1;
    this.flush();
  }

  addBigHeart(): void {
    this.stats.bigHearts += 1;
    this.flush();
  }

  addDeath(): void {
    this.stats.deaths += 1;
    this.flush();
  }

  /**
   * A run was won. Returns which records it set, so the victory screen can
   * say so; a first win sets both.
   */
  recordWin(scoreMs: number, deaths: number): { fastest: boolean; fewestDeaths: boolean } {
    const records = { ...(this.stats.records[VERSION] ?? NO_RECORDS) };
    const fastest = records.bestMs === null || scoreMs < records.bestMs;
    const fewestDeaths = records.fewestDeaths === null || deaths < records.fewestDeaths;
    if (fastest) {
      records.bestMs = scoreMs;
    }
    if (fewestDeaths) {
      records.fewestDeaths = deaths;
    }
    records.wins += 1;
    this.stats.records[VERSION] = records;
    this.flush();
    return { fastest, fewestDeaths };
  }

  /**
   * Forgets everything, in memory and in storage. Removing the key by hand
   * is not enough: the store keeps counting from what it has in memory and
   * writes it straight back on the next flush, which is why this exists.
   * Development: `stats.reset()` in the console.
   */
  reset(): void {
    this.stats = { ...EMPTY, records: {} };
    this.unsavedMs = 0;
    try {
      localStorage.removeItem(KEY);
    } catch {
      // Nothing to forget, then.
    }
  }

  flush(): void {
    this.unsavedMs = 0;
    try {
      localStorage.setItem(KEY, JSON.stringify(this.stats));
    } catch {
      // Not being able to remember it is not a reason to stop counting.
    }
  }

  private static read(): Stats {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        return { ...EMPTY };
      }
      const parsed = JSON.parse(raw) as Partial<Stats>;
      const number = (value: unknown, fallback: number): number =>
        typeof value === 'number' && Number.isFinite(value) ? value : fallback;
      const records: Record<string, Records> = {};
      if (parsed.records && typeof parsed.records === 'object') {
        for (const [version, entry] of Object.entries(parsed.records as Record<string, Partial<Records>>)) {
          records[version] = {
            bestMs: typeof entry.bestMs === 'number' ? entry.bestMs : null,
            fewestDeaths: typeof entry.fewestDeaths === 'number' ? entry.fewestDeaths : null,
            wins: number(entry.wins, 0),
          };
        }
      }
      return {
        records,
        playedMs: number(parsed.playedMs, 0),
        hearts: number(parsed.hearts, 0),
        bigHearts: number(parsed.bigHearts, 0),
        deaths: number(parsed.deaths, 0),
      };
    } catch {
      return { ...EMPTY };
    }
  }
}

export const stats = new StatsStore();

/** "1 heart", "2 hearts": a count with its noun. */
export function counted(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/** Milliseconds of play as "<1 min", "12 min" or "1 h 23 min". */
export function formatPlayed(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) {
    return '<1 min';
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
