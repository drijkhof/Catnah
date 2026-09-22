import Phaser from 'phaser';

/**
 * God mode: you still hear and feel every hit, you simply do not lose anything.
 *
 * It is for getting to the part of a level that is actually being worked on
 * without playing the first two minutes again, and for finding out whether a
 * jump is possible at all before deciding whether it is fair. Hearing the hit
 * matters -- a cheat that makes the game *silent* about mistakes hides exactly
 * the thing you were trying to judge.
 *
 * **This one ships.** Everything else in this folder is wrapped in
 * `import.meta.env.DEV` and dropped from the build, but the game is played and
 * tested on a phone, against the deployed copy, and a cheat that only exists on
 * the machine it was written on is no use there. The gesture is obscure enough
 * that nobody finds it by accident.
 *
 * It lives in the registry rather than in a module variable, so it survives
 * changing level -- which builds a whole new `GameScene` -- and dies with the
 * tab, which is where you want a cheat to die.
 */
const KEY = 'catnah:god-mode';

/** How long a touch has to be held to count, ms. */
const LONG_PRESS = 550;

export function isGodMode(scene: Phaser.Scene): boolean {
  return scene.registry.get(KEY) === true;
}

/**
 * Hangs the toggle off the level name in the HUD.
 *
 * **Option-click** on a laptop, **press and hold** on a phone. The second is
 * not a nicety: there is no option key on a phone, and the phone is where this
 * game is played.
 *
 * @param label The level name in the HUD, which becomes the target.
 */
export function installGodMode(scene: Phaser.Scene, label: Phaser.GameObjects.Text): void {
  // Harmless if the level-skip shortcut has already done this.
  label.setInteractive({ useHandCursor: true });

  paint(scene, label);

  let held: Phaser.Time.TimerEvent | undefined;

  const stopHolding = (): void => {
    held?.remove();
    held = undefined;
  };

  label.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if ((pointer.event as MouseEvent).altKey) {
      toggle(scene, label);
      return;
    }

    // A press that is *held* rather than clicked. Started on every press and
    // thrown away the moment the finger lifts or leaves, so an ordinary tap --
    // and a ctrl- or cmd-click on the same label -- never trips it.
    stopHolding();
    held = scene.time.delayedCall(LONG_PRESS, () => toggle(scene, label));
  });

  label.on('pointerup', stopHolding);
  label.on('pointerout', stopHolding);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, stopHolding);
}

function toggle(scene: Phaser.Scene, label: Phaser.GameObjects.Text): void {
  const now = !isGodMode(scene);

  scene.registry.set(KEY, now);
  paint(scene, label);
  announce(scene, label, now ? 'god mode on' : 'god mode off');
}

/** The level name is gold while it is on, so it is never on without you knowing. */
function paint(scene: Phaser.Scene, label: Phaser.GameObjects.Text): void {
  const on = isGodMode(scene);

  label.setColor(on ? '#ffd34d' : '#ffffff');
  label.setAlpha(on ? 1 : 0.75);
}

function announce(scene: Phaser.Scene, label: Phaser.GameObjects.Text, text: string): void {
  const note = scene.add
    .text(label.x, label.y + 12, text, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffd34d',
      stroke: '#1d2a18',
      strokeThickness: 3,
    })
    .setScrollFactor(0)
    .setDepth(1000);

  scene.tweens.add({
    targets: note,
    alpha: 0,
    y: note.y - 6,
    delay: 900,
    duration: 500,
    onComplete: () => note.destroy(),
  });
}
