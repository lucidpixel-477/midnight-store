import Phaser from 'phaser';
import { addScanlines, button, panel, title } from '../ui/ui';
import { loadSave, writeSave } from '../game/save';
import { DIFFICULTY_CONFIG } from '../game/config';
import type { Difficulty, RunRecord, RunStatus } from '../game/types';

const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  in_progress: '中断', completed: '完成', failed: '失踪', abandoned: '主动结束',
};

export class MenuScene extends Phaser.Scene {
  private settingsOverlay?: Phaser.GameObjects.Container;
  private historyOverlay?: Phaser.GameObjects.Container;
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

    button(this, 640, 570, '开始夜班', () => {
      save.tutorialSeen ? this.scene.start('Store') : this.scene.start('Tutorial');
    }, { width: 300, fill: 0x173a3d, stroke: 0x9be9df });
    button(this, 525, 635, `设置 · ${DIFFICULTY_CONFIG[save.settings.difficulty].label}`, () => this.openSettings(), { width: 210, height: 42, fontSize: 15, stroke: 0x65898c });
    button(this, 755, 635, `值班记录 · ${save.runHistory.length}`, () => this.openHistory(), { width: 210, height: 42, fontSize: 15, stroke: 0x65898c });

    panel(this, 1038, 598, 250, 112, .72);
    const finishedRuns = save.runHistory.filter((item) => item.status === 'completed' || item.status === 'failed').length;
    this.add.text(930, 553, `最佳评价  ${save.bestGrade}\n最高得分  ${save.bestScore}\n完成结算  ${finishedRuns} 次\n已收录异常  ${save.discoveredAnomalies.length}/24`, {
      fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#91adaf', lineSpacing: 8,
    });
    this.add.text(20, 688, 'A / D 切换区域 · E 向内观察 · R 报告 · F 手电筒 · P / Esc 暂停', { fontSize: '13px', color: '#547075' });
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

  private openHistory(): void {
    this.historyOverlay?.destroy(true);
    const save = loadSave();
    const c = this.add.container(0, 0).setDepth(110);
    c.add(this.add.rectangle(640, 360, 1280, 720, 0x010405, .92).setInteractive());
    c.add(panel(this, 640, 355, 980, 570, .99));
    c.add(this.add.text(640, 105, '值班记录', { fontFamily: 'Microsoft YaHei', fontSize: '32px', color: '#d8efeb', fontStyle: 'bold' }).setOrigin(.5));
    c.add(this.add.text(640, 145, '记录保存在当前浏览器中 · 最多保留最近 20 次', { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#708e91' }).setOrigin(.5));

    if (!save.runHistory.length) {
      c.add(this.add.text(640, 350, '暂时没有值班记录', { fontFamily: 'Microsoft YaHei', fontSize: '20px', color: '#668689' }).setOrigin(.5));
    } else {
      save.runHistory.slice(0, 8).forEach((record, index) => this.drawHistoryRow(c, record, index));
    }

    c.add(button(this, 640, 602, '返回主菜单', () => {
      this.historyOverlay?.destroy(true);
      this.historyOverlay = undefined;
    }, { width: 280, height: 44 }));
    this.historyOverlay = c;
  }

  private drawHistoryRow(c: Phaser.GameObjects.Container, record: RunRecord, index: number): void {
    const y = 185 + index * 48;
    const date = new Date(record.updatedAt);
    const dateLabel = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const minutes = Math.floor(record.elapsedSeconds / 60);
    const seconds = Math.floor(record.elapsedSeconds % 60);
    c.add(this.add.rectangle(640, y + 17, 900, 40, index % 2 ? 0x0b1a1e : 0x10252a, .72));
    c.add(this.add.text(215, y + 6, dateLabel, { fontFamily: 'monospace', fontSize: '14px', color: '#77989b' }));
    c.add(this.add.text(365, y + 6, RUN_STATUS_LABEL[record.status], { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: record.status === 'completed' ? '#76d5a7' : record.status === 'failed' ? '#df7178' : '#d2aa65' }));
    c.add(this.add.text(475, y + 6, DIFFICULTY_CONFIG[record.difficulty].label, { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#87a7aa' }));
    c.add(this.add.text(575, y + 6, `评价 ${record.grade}  ·  ${record.score} 分`, { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#c9dcda' }));
    c.add(this.add.text(805, y + 6, `处理 ${record.resolved}  ·  ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`, { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#87a7aa' }));
  }
}
