import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCORE } from '../config';
import { formatClock, scoreMs } from '../score';
import { stats } from '../stats';
import { crispText, type CrispText } from '../text';

/**
 * How long the screen holds before it will take an input, ms.
 *
 * The same reason as the game-over screen: the portal was entered by walking,
 * but a key may still be down, and the score wants reading.
 */
const HOLD_MS = 1200;

/**
 * The end of a run that was won: the last level's portal leads here.
 *
 * Under the words is the sunlit forest -- the same title-mode `GameScene`
 * the title screen runs, launched alongside and lifted back under -- because
 * a win wants daylight after the volcano, not another black screen. It comes
 * up out of black, since the game has just faded to black on its way out.
 * One line in gold, the time under it, and how often you died: the time is
 * the score, lower is better, every second in a level plus a minute for
 * every death. The win goes into this device's records (`stats`), and if it
 * beat the fastest time or the fewest deaths, the screen says so.
 */
export class VictoryScene extends Phaser.Scene {
  private ready = false;

  private leaving = false;

  private elapsedMs = 0;

  private deaths = 0;

  constructor() {
    super({ key: 'Victory' });
  }

  init(data: { elapsedMs?: number; deaths?: number }): void {
    this.elapsedMs = data.elapsedMs ?? 0;
    this.deaths = data.deaths ?? 0;
  }

  create(): void {
    this.ready = false;
    this.leaving = false;

    // The forest, with nobody at the controls, as on the title screen.
    // Launched scenes draw above the launcher, so this one is lifted back on
    // top, and the whole thing comes up out of the black the volcano left.
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.scene.launch('Game', { title: true });
    this.scene.bringToTop();

    // A soft dark band behind the words, so they read against the trees.
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.52, GAME_WIDTH, GAME_HEIGHT * 0.5, 0x0a1408, 0.45)
      .setOrigin(0.5);

    const black = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000)
      .setOrigin(0, 0)
      .setDepth(3000);
    this.tweens.add({ targets: black, alpha: 0, duration: 650, onComplete: () => black.destroy() });
    // The words are HTML above the black, so they fade up with it by hand.
    const fadeUp = (text: CrispText, to: number): CrispText => {
      text.setAlpha(0);
      this.tweens.add({ targets: text, alpha: to, duration: 650 });
      return text;
    };

    const title = fadeUp(crispText(
      this, GAME_WIDTH / 2, GAME_HEIGHT * 0.36, 'You actually won!', {
        fontFamily: 'monospace',
        fontSize: `${Math.round(GAME_WIDTH * 0.075)}px`,
        color: '#ffc44d',
        stroke: '#3a2a05',
        strokeThickness: 6,
      })
      .setOrigin(0.5), 1);

    const time = formatClock(scoreMs(this.elapsedMs, this.deaths));

    fadeUp(crispText(
      this, GAME_WIDTH / 2, GAME_HEIGHT * 0.56, `Time  ${time}`, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(GAME_WIDTH * 0.045)}px`,
        color: '#ffffff',
        stroke: '#1d2a18',
        strokeThickness: 4,
      })
      .setOrigin(0.5), 1);

    // How often you died, said plainly, with what it cost.
    const penalty = formatClock(this.deaths * SCORE.deathPenaltyMs);
    const died =
      this.deaths === 0
        ? 'never died!'
        : this.deaths === 1
          ? `died once (+${penalty})`
          : `died ${this.deaths} times (+${penalty})`;
    fadeUp(crispText(
      this,
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.66,
        `${formatClock(this.elapsedMs)} played  ·  ${died}`,
        {
          fontFamily: 'monospace',
          fontSize: `${Math.round(GAME_WIDTH * 0.024)}px`,
          color: '#b9b9b9',
        },
      )
      .setOrigin(0.5), 0.9);

    // The records, written before they are read: a first win sets both.
    const record = stats.recordWin(scoreMs(this.elapsedMs, this.deaths), this.deaths);
    const best = stats.records;
    const records =
      record.fastest && record.fewestDeaths
        ? 'New record: fastest time and fewest deaths!'
        : record.fastest
          ? 'New record: fastest time!'
          : record.fewestDeaths
            ? 'New record: fewest deaths!'
            : `Best  ${formatClock(best.bestMs ?? 0)}  ·  fewest deaths  ${best.fewestDeaths ?? 0}`;
    const isRecord = record.fastest || record.fewestDeaths;
    fadeUp(crispText(
      this, GAME_WIDTH / 2, GAME_HEIGHT * 0.75, records, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(GAME_WIDTH * (isRecord ? 0.03 : 0.024))}px`,
        color: isRecord ? '#ffc44d' : '#b9b9b9',
        stroke: isRecord ? '#3a2a05' : undefined,
        strokeThickness: isRecord ? 3 : 0,
      })
      .setOrigin(0.5), 0.95);

    const hint = crispText(
      this, GAME_WIDTH / 2, GAME_HEIGHT * 0.88, 'Press any key', {
        fontFamily: 'monospace',
        fontSize: `${Math.round(GAME_WIDTH * 0.026)}px`,
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // The line is readable from the first frame and only then given its
    // pulse, same as the game-over screen; the hint waits for the hold.
    this.tweens.add({
      targets: title,
      alpha: { from: 1, to: 0.78 },
      duration: 1300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.time.delayedCall(HOLD_MS, () => {
      this.ready = true;
      this.tweens.add({ targets: hint, alpha: 0.8, duration: 400 });
      this.input.keyboard?.once('keydown', () => this.leave());
      this.input.once('pointerdown', () => this.leave());
    });
  }

  /** Back to the title, where a new run starts. */
  private leave(): void {
    if (!this.ready || this.leaving) {
      return;
    }
    this.leaving = true;
    // The forest underneath is ours; the title launches its own.
    this.scene.stop('Game');
    this.scene.start('Title');
  }
}
