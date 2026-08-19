import Phaser from 'phaser';
import { addScanlines, button, panel, title } from '../ui/ui';
import { loadSave, writeSave } from '../game/save';
import { DIFFICULTY_CONFIG } from '../game/config';
import type { Difficulty } from '../game/types';

export class MenuScene extends Phaser.Scene {
  private settingsOverlay?: Phaser.GameObjects.Container;
  constructor() { super('Menu'); }

  create(): void {
    const save = loadSave();
    this.cameras.main.setBackgroundColor('#03090d');
    const bg = this.add.graphics();
    bg.fillStyle(0x07171b).fillRect(0, 0, 1280, 720);
    bg.fillStyle(0x0b2429).fillRect(0, 475, 1280, 245);
    for (let x = 0; x < 1280; x += 90) bg.lineStyle(1, 0x16383d, .4).lineBetween(x, 475, x + 160, 720);
    bg.fillStyle(0xb9e8df, .85).fillRect(150, 120, 980, 5);
    for (let x = 190; x < 1110; x += 118) {
      bg.fillStyle(x % 236 ? 0x25434a : 0x53333a).fillRoundedRect(x, 290, 82, 170, 5);
      bg.fillStyle(0xc2d8ca, .35).fillRect(x + 12, 310, 58, 65);
    }

    title(this, 640, 190, '深夜便利店', 54);
    this.add.text(640, 247, '异 常 巡 查', { fontFamily: 'Microsoft YaHei', fontSize: '23px', color: '#e5bd68', letterSpacing: 12 }).setOrigin(.5);
    this.add.text(640, 510, '00:00 — 06:00   ·   请记住：本店没有夜班同事', {
      fontFamily: 'Microsoft YaHei', fontSize: '16px', color: '#75969a',
    }).setOrigin(.5);

    button(this, 640, 575, '开始夜班', () => {
      save.tutorialSeen ? this.scene.start('Store') : this.scene.start('Tutorial');
    }, { width: 300, fill: 0x173a3d, stroke: 0x9be9df });
    button(this, 640, 638, `设置 · ${DIFFICULTY_CONFIG[save.settings.difficulty].label}`, () => this.openSettings(), { width: 300, height: 42, fontSize: 16, stroke: 0x65898c });

    panel(this, 1038, 610, 250, 86, .72);
    this.add.text(930, 580, `最佳评价  ${save.bestGrade}\n最高得分  ${save.bestScore}\n已收录异常  ${save.discoveredAnomalies.length}/24`, {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#91adaf', lineSpacing: 8,
    });
    this.add.text(20, 688, 'A / D 切换区域 · E 向内观察 · R 报告 · F 手电筒 · Esc 暂停', { fontSize: '13px', color: '#547075' });
    addScanlines(this);
  }

  private openSettings(): void {
    this.settingsOverlay?.destroy(true);
    const save = loadSave();
    const c = this.add.container(0, 0).setDepth(100);
    c.add(this.add.rectangle(640, 360, 1280, 720, 0x010405, .9).setInteractive());
    c.add(panel(this, 640, 350, 620, 455, .99));
    c.add(this.add.text(640, 180, '夜班设置', { fontFamily: 'Microsoft YaHei', fontSize: '30px', color: '#d8efeb', fontStyle: 'bold' }).setOrigin(.5));
    c.add(button(this, 640, 260, `难度：${DIFFICULTY_CONFIG[save.settings.difficulty].label}`, () => {
      const order: Difficulty[] = ['easy', 'normal', 'expert'];
      save.settings.difficulty = order[(order.indexOf(save.settings.difficulty) + 1) % order.length] ?? 'normal';
      writeSave(save); this.openSettings();
    }, { width: 400, align: 'left' }));
    c.add(button(this, 640, 325, `音量：${Math.round(save.settings.volume * 100)}%`, () => {
      const levels = [0, .25, .5, .75, 1];
      const current = levels.findIndex((level) => Math.abs(level - save.settings.volume) < .01);
      save.settings.volume = levels[(current + 1) % levels.length] ?? .5;
      writeSave(save); this.openSettings();
    }, { width: 400, align: 'left' }));
    c.add(button(this, 640, 390, `画面闪烁：${save.settings.flicker ? '开启' : '关闭'}`, () => {
      save.settings.flicker = !save.settings.flicker; writeSave(save); this.openSettings();
    }, { width: 400, align: 'left' }));
    c.add(button(this, 640, 490, '保存并返回', () => {
      this.settingsOverlay?.destroy(true); this.settingsOverlay = undefined; this.scene.restart();
    }, { width: 300, fill: 0x173a3d }));
    this.settingsOverlay = c;
  }
}
