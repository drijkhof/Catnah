import Phaser from 'phaser';
import { BAR } from './config';
import { FUEL_CAN_SIZE } from './art';

/**
 * The rocket fuel left from the bar on Pluto: a red can and a bar that
 * empties as it burns, beside the hearts, in the HUD of a level and of
 * space alike. Hidden when the tank is empty.
 */
export class FuelMeter {
  private readonly can: Phaser.GameObjects.Image;
  private readonly bar: Phaser.GameObjects.Graphics;

  static readonly width = 34;

  constructor(scene: Phaser.Scene) {
    this.can = scene.add.image(0, 0, 'fuel-can').setScrollFactor(0).setDepth(1000);
    this.bar = scene.add.graphics().setScrollFactor(0).setDepth(1000);
  }

  /** Draws it with its right-hand end at `right`, centred on `y`, for `fuel` ms left. */
  show(right: number, y: number, fuel: number): void {
    const visible = fuel > 0;
    this.can.setVisible(visible);
    this.bar.setVisible(visible);
    if (!visible) {
      return;
    }
    const length = FuelMeter.width - FUEL_CAN_SIZE.width - 3;
    const left = right - length;
    this.can.setPosition(left - 3 - FUEL_CAN_SIZE.width / 2, y);
    const full = Phaser.Math.Clamp(fuel / BAR.fuelMs, 0, 1);
    this.bar.clear();
    this.bar.fillStyle(0x1a0a05, 0.8);
    this.bar.fillRect(left, y - 3, length, 6);
    this.bar.fillStyle(full > 0.25 ? 0xffa030 : 0xff4a3a, 1);
    this.bar.fillRect(left + 1, y - 2, Math.max(1, Math.round((length - 2) * full)), 4);
  }
}
