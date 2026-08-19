import Phaser from 'phaser';
import { COLORS } from '../game/config';

export interface ButtonOptions {
  width?: number;
  height?: number;
  fill?: number;
  stroke?: number;
  fontSize?: number;
  align?: 'left' | 'center';
}

export function button(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  options: ButtonOptions = {},
): Phaser.GameObjects.Container {
  const width = options.width ?? 260;
  const height = options.height ?? 52;
  const fill = options.fill ?? COLORS.panel2;
  const stroke = options.stroke ?? COLORS.teal;
  const bg = scene.add.rectangle(0, 0, width, height, fill, .96).setStrokeStyle(1, stroke, .8);
  const text = scene.add.text(options.align === 'left' ? -width / 2 + 18 : 0, 0, label, {
    fontFamily: 'Microsoft YaHei, sans-serif',
    fontSize: `${options.fontSize ?? 19}px`, color: '#dff7f4',
  }).setOrigin(options.align === 'left' ? 0 : .5, .5);
  const container = scene.add.container(x, y, [bg, text]).setSize(width, height).setInteractive({ useHandCursor: true });
  container.on('pointerover', () => { bg.setFillStyle(stroke, .24); bg.setStrokeStyle(2, stroke, 1); });
  container.on('pointerout', () => { bg.setFillStyle(fill, .96); bg.setStrokeStyle(1, stroke, .8); });
  container.on('pointerdown', () => { container.setScale(.98); });
  container.on('pointerup', () => { container.setScale(1); onClick(); });
  return container;
}

export function panel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, alpha = .94): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(x, y, width, height, COLORS.panel, alpha).setStrokeStyle(1, COLORS.teal, .35);
}

export function title(scene: Phaser.Scene, x: number, y: number, label: string, size = 42): Phaser.GameObjects.Text {
  return scene.add.text(x, y, label, {
    fontFamily: 'Microsoft YaHei, sans-serif', fontSize: `${size}px`, color: '#bff5ef',
    fontStyle: 'bold', letterSpacing: 4,
  }).setOrigin(.5);
}

export function addScanlines(scene: Phaser.Scene, depth = 90): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(depth).setAlpha(.12);
  for (let y = 0; y < 720; y += 4) g.fillStyle(0x000000).fillRect(0, y, 1280, 1);
  return g;
}
