import Phaser from 'phaser';
import { ANOMALIES } from '../anomalies/anomalyData';
import { saveRunResult } from '../game/save';
import type { ResultData } from '../game/types';
import { addScanlines, button, panel, title } from '../ui/ui';

const ENDING = {
  normal: { title: '正常下班', copy: '06:00。卷帘门升起，第一班公交从雨里经过。\n你没有回头看休息室里多出的那把椅子。', color: '#a9e2d8' },
  excellent: { title: '优秀员工', copy: '交班记录上盖着从未见过的金色印章。\n店长发来消息：“这么多年，终于有人完整地值完一班。”', color: '#e5bd68' },
  missing: { title: '失踪员工', copy: '清晨六点，便利店照常营业。\n排班表上没有你的名字，监控里却多了一个永远值夜班的人。', color: '#e0656d' },
} as const;

export class ResultScene extends Phaser.Scene {
  private result!: ResultData;
  constructor() { super('Result'); }

  init(data: ResultData): void { this.result = data; }

  create(): void {
    const ending = ENDING[this.result.ending];
    const save = saveRunResult(this.result, ANOMALIES.map((item) => item.id));

    this.cameras.main.setBackgroundColor('#03090c');
    addScanlines(this, 90);
    this.add.text(640, 62, this.result.won ? 'SHIFT COMPLETE / 06:00' : 'SIGNAL LOST', { fontFamily: 'monospace', fontSize: '14px', color: ending.color, letterSpacing: 3 }).setOrigin(.5);
    title(this, 640, 120, ending.title, 42).setColor(ending.color);
    this.add.text(640, 185, ending.copy, { fontFamily: 'Microsoft YaHei', fontSize: '17px', color: '#809b9e', align: 'center', lineSpacing: 9 }).setOrigin(.5);
    panel(this, 640, 405, 900, 310);
    this.add.text(280, 290, '本次评价', { fontFamily: 'Microsoft YaHei', fontSize: '15px', color: '#6f8b8e' });
    this.add.text(280, 320, this.result.grade, { fontFamily: 'monospace', fontSize: '88px', color: ending.color, fontStyle: 'bold' });
    this.add.text(435, 335, `${this.result.score} 分`, { fontFamily: 'monospace', fontSize: '25px', color: '#d9e8e4' });
    const avg = this.result.stats.resolveTimes.length
      ? this.result.stats.resolveTimes.reduce((a, b) => a + b, 0) / this.result.stats.resolveTimes.length : 0;
    const left = [
      ['正确处理', `${this.result.stats.resolved} 项`],
      ['错误报告', `${this.result.stats.wrongReports} 次`],
      ['漏掉异常', `${Math.max(0, this.result.stats.spawned - this.result.stats.resolved)} 项`],
      ['报告准确率', `${Math.round(this.result.accuracy * 100)}%`],
    ];
    const right = [
      ['平均处理时间', avg ? `${avg.toFixed(1)} 秒` : '—'],
      ['特殊事件', `${this.result.stats.eventCorrect} 正确 / ${this.result.stats.eventWrong} 错误`],
      ['最终危险', this.result.danger >= 75 ? '极度危险' : this.result.danger >= 45 ? '异常活跃' : '稳定'],
    ];
    drawStats(this, 570, 305, left);
    drawStats(this, 860, 305, right);
    this.add.text(640, 520, `已解锁结局 ${save.unlockedEndings.length} / 3   ·   异常图鉴 ${save.discoveredAnomalies.length} / ${ANOMALIES.length}`, { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#658185' }).setOrigin(.5);
    button(this, 490, 625, '再次值班', () => this.scene.start('Store'), { width: 260, height: 48 });
    button(this, 790, 625, '返回主菜单', () => this.scene.start('Menu'), { width: 260, height: 48, stroke: 0x607e80 });
  }
}

function drawStats(scene: Phaser.Scene, x: number, y: number, rows: string[][]): void {
  rows.forEach((row, i) => {
    const label = row[0] ?? ''; const value = row[1] ?? '';
    scene.add.text(x, y + i * 50, label, { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#698588' });
    scene.add.text(x, y + 19 + i * 50, value, { fontFamily: 'Microsoft YaHei', fontSize: '17px', color: '#c8dcda' });
  });
}
