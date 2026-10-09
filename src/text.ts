import Phaser from 'phaser';

/**
 * Text the browser draws, not the canvas.
 *
 * The game is a 640×360 canvas (less on a phone) stretched to the screen,
 * and everything on it is scaled up as blocks -- which is the look for the
 * cat and the trees and wrong for a word. So text lives in Phaser's DOM
 * layer instead: a `<div>` per text, in a container the Scale Manager keeps
 * exactly over the canvas, positioned in game pixels like anything else and
 * rendered by the browser at the screen's own resolution. Crisp at any
 * size, on any phone, with no change to how the canvas is drawn.
 *
 * It takes the same style the canvas text took (`fontFamily`, `fontSize`,
 * `color`, `stroke`, `strokeThickness`, `align`), so a call site reads the
 * same, and offers the handful of `Text` methods the game used: `setText`,
 * `setColor`, `setFontSize`, and `width`. A stroke is CSS `text-stroke`
 * painted *under* the fill (`paint-order`), which is what a canvas stroke
 * looked like.
 *
 * Two things follow from being HTML:
 *
 * - **Pointer events are off** unless `setInteractive` is called. The layer
 *   sits over the canvas, and a word that caught touches would steal them
 *   from the stick and the jump button underneath.
 * - **It is above everything on the canvas**, fades included. A screen that
 *   fades text in or out tweens the text's own alpha alongside.
 *
 * Interactive text emits the browser's own `pointerdown`, `pointerup` and
 * `pointerleave` events, with the native `PointerEvent` (for `altKey`,
 * `metaKey` and friends), not a Phaser pointer.
 */
export interface CrispTextStyle {
  fontFamily?: string;
  fontSize?: string;
  color?: string;
  stroke?: string;
  strokeThickness?: number;
  align?: 'left' | 'center' | 'right';
}

export class CrispText extends Phaser.GameObjects.DOMElement {
  private readonly div: HTMLDivElement;

  private content: string;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, style: CrispTextStyle = {}) {
    const div = document.createElement('div');
    super(scene, x, y, div);
    this.div = div;
    this.content = text;

    const s = div.style;
    s.fontFamily = style.fontFamily ?? 'monospace';
    s.fontSize = style.fontSize ?? '12px';
    s.color = style.color ?? '#ffffff';
    s.lineHeight = '1.15';
    s.whiteSpace = 'pre';
    s.textAlign = style.align ?? 'left';
    s.userSelect = 'none';
    s.pointerEvents = 'none';
    if (style.stroke && style.strokeThickness) {
      s.webkitTextStroke = `${style.strokeThickness}px ${style.stroke}`;
      s.setProperty('paint-order', 'stroke fill');
      s.setProperty('-webkit-text-stroke', `${style.strokeThickness}px ${style.stroke}`);
    }
    div.textContent = text;

    this.pointerEvents = 'none';
    scene.add.existing(this);
    this.updateSize();
  }

  get text(): string {
    return this.content;
  }

  setText(text: string): this {
    if (text !== this.content) {
      this.content = text;
      this.div.textContent = text;
      this.updateSize();
    }
    return this;
  }

  setColor(color: string): this {
    this.div.style.color = color;
    return this;
  }

  setFontSize(px: number): this {
    this.div.style.fontSize = `${px}px`;
    this.updateSize();
    return this;
  }

  /** Lets the text take pointer events, and makes it look clickable. */
  setInteractive(): this {
    this.pointerEvents = 'auto';
    this.div.style.pointerEvents = 'auto';
    this.div.style.cursor = 'pointer';
    this.addListener('pointerdown');
    this.addListener('pointerup');
    this.addListener('pointerleave');
    return this;
  }
}

/** The `this.add.text(...)` of this game. */
export function crispText(scene: Phaser.Scene, x: number, y: number, text: string, style: CrispTextStyle = {}): CrispText {
  return new CrispText(scene, x, y, text, style);
}
