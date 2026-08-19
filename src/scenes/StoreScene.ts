import Phaser from 'phaser';
import { AnomalyManager } from '../anomalies/anomalyManager';
import { AudioBus } from '../game/AudioBus';
import { renderArea, updateAreaParallax } from '../game/AreaRenderer';
import { COLORS, DIFFICULTY_CONFIG, MEMORY_SECONDS } from '../game/config';
import { GameSession } from '../game/GameSession';
import { loadSave } from '../game/save';
import {
  AREA_IDS, AREA_NAMES, CATEGORY_IDS, CATEGORY_NAMES,
  type AnomalyCategory, type AreaId, type ResultData,
} from '../game/types';
import { addScanlines, button, panel } from '../ui/ui';

interface NightEvent {
  id: string;
  title: string;
  body: string;
  choices: string[];
  correct: number;
  success: string;
  failure: string;
}

const NIGHT_EVENTS: NightEvent[] = [
  {
    id: 'outage', title: '便利店停电',
    body: '荧光灯发出爆裂声，整间店陷入黑暗。\n备用电源将在短时间后恢复。黑暗里有什么东西碰倒了一排商品。',
    choices: ['打开手电筒，留在原地观察', '摸黑前往仓库配电箱', '立刻打开仓库门'], correct: 0,
    success: '手电光照亮面前有限的区域。你决定等待备用电源。', failure: '黑暗中，你的脚步声后面多出了一组脚步声。',
  },
  {
    id: 'phone', title: '来电：店长？',
    body: '电话那头的人说：“我是店长。把收银台下面那张写着你名字的小票念给我听。”\n背景里传来和店内完全同步的冰柜噪声。',
    choices: ['照做并念出名字', '保持沉默，挂断电话', '告诉他仓库密码'], correct: 1,
    success: '你挂断了电话。另一个听筒里传来失望的叹息。', failure: '对方轻声重复了你的名字。危险正在靠近。',
  },
  {
    id: 'knock', title: '仓库敲门声',
    body: '凌晨三点后，仓库门后响起三长两短的敲击。\n一个熟悉的声音说：“开门，是上一班员工，我被锁在里面了。”',
    choices: ['立刻打开仓库门', '无视声音并检查监控', '隔门回应对方'], correct: 1,
    success: '监控画面里，仓库门后只有一堵墙。敲击停止了。', failure: '门把手从另一侧缓缓转动。你违反了一条关键守则。',
  },
  {
    id: 'customer', title: '可疑顾客',
    body: '穿红衣的顾客把一张空白包装放上柜台：\n“我要买这个。货架没有，去仓库替我拿一件。”',
    choices: ['前往仓库寻找', '告诉对方没有并按下警报', '让顾客自己去仓库'], correct: 1,
    success: '警报灯闪过，再抬头时柜台前空无一人。', failure: '顾客笑了。你意识到红色并不是衣服的颜色。',
  },
];

export class StoreScene extends Phaser.Scene {
  private areaIndex = 0;
  private session!: GameSession;
  private anomalyManager!: AnomalyManager;
  private audio!: AudioBus;
  private areaView?: Phaser.GameObjects.Container;
  private areaName!: Phaser.GameObjects.Text;
  private clockText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private dangerFill!: Phaser.GameObjects.Rectangle;
  private dangerLabel!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private cooldownText!: Phaser.GameObjects.Text;
  private blackoutOverlay!: Phaser.GameObjects.Rectangle;
  private reportOverlay?: Phaser.GameObjects.Container;
  private modalOverlay?: Phaser.GameObjects.Container;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private selectedArea?: AreaId;
  private selectedCategory?: AnomalyCategory;
  private spawnTimer = 24;
  private eventFlags = new Set<string>();
  private eventsForRun: NightEvent[] = [];
  private finishing = false;
  private statusTimer = 0;
  private parallaxX = 0;
  private parallaxY = 0;
  private depthFocus = false;
  private transitioning = false;

  constructor() { super('Store'); }

  create(): void {
    const save = loadSave();
    this.session = new GameSession(save.settings.difficulty);
    this.anomalyManager = new AnomalyManager();
    this.audio = new AudioBus(save.settings.volume);
    const middle = Phaser.Utils.Array.Shuffle([NIGHT_EVENTS[1]!, NIGHT_EVENTS[3]!]);
    this.eventsForRun = [NIGHT_EVENTS[0]!, middle[0]!, NIGHT_EVENTS[2]!, middle[1]!];
    this.cameras.main.setBackgroundColor('#020609');
    this.createHud();
    this.renderCurrentArea();
    this.setupInput();
    addScanlines(this, 80);
    this.blackoutOverlay = this.add.rectangle(640, 350, 1280, 700, 0x000000, 0).setDepth(70).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.showStatus('记忆阶段开始。请查看每个区域的正常状态。', '#e5bd68', 6);
  }

  private createHud(): void {
    this.add.rectangle(640, 32, 1280, 65, 0x071116, 1).setDepth(50);
    this.add.line(640, 64, 0, 0, 1280, 0, COLORS.teal, .25).setDepth(50);
    this.clockText = this.add.text(28, 13, '00:00', { fontFamily: 'monospace', fontSize: '29px', color: '#c6f5ee' }).setDepth(51);
    this.phaseText = this.add.text(143, 22, '正常状态记忆', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#e5bd68' }).setDepth(51);
    this.areaName = this.add.text(640, 31, '', { fontFamily: 'Microsoft YaHei', fontSize: '22px', color: '#e1efec', fontStyle: 'bold' }).setOrigin(.5).setDepth(51);
    this.add.text(1010, 14, '危险', { fontFamily: 'Microsoft YaHei', fontSize: '13px', color: '#789598' }).setDepth(51);
    this.add.rectangle(1124, 32, 180, 9, 0x15272b).setOrigin(0, .5).setDepth(51);
    this.dangerFill = this.add.rectangle(1124, 32, 7, 9, COLORS.green).setOrigin(0, .5).setDepth(52);
    this.dangerLabel = this.add.text(1214, 46, '稳定', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#7bc9b0' }).setOrigin(.5).setDepth(51);

    this.add.rectangle(640, 680, 1280, 80, 0x061014, .98).setDepth(50);
    this.statusText = this.add.text(640, 653, '', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#759597' }).setOrigin(.5).setDepth(52);
    this.cooldownText = this.add.text(640, 704, '', { fontFamily: 'Microsoft YaHei', fontSize: '12px', color: '#d49864' }).setOrigin(.5).setDepth(52);
    button(this, 56, 350, '‹', () => this.move(-1), { width: 64, height: 145, fontSize: 46, fill: 0x071115, stroke: 0x64888a }).setDepth(55).setAlpha(.75);
    button(this, 1224, 350, '›', () => this.move(1), { width: 64, height: 145, fontSize: 46, fill: 0x071115, stroke: 0x64888a }).setDepth(55).setAlpha(.75);
    button(this, 115, 681, '◀  上一区域', () => this.move(-1), { width: 190, height: 42, fontSize: 15, stroke: 0x557477 }).setDepth(53);
    button(this, 1165, 681, '下一区域  ▶', () => this.move(1), { width: 190, height: 42, fontSize: 15, stroke: 0x557477 }).setDepth(53);
    button(this, 930, 681, '异常报告  [R]', () => this.openReport(), { width: 220, height: 42, fontSize: 15, fill: 0x28302d, stroke: 0xe5bd68 }).setDepth(53);
    button(this, 350, 681, '监控室', () => { this.areaIndex = 5; this.renderCurrentArea(); }, { width: 170, height: 42, fontSize: 15, stroke: 0x557477 }).setDepth(53);
    button(this, 525, 681, '手电筒  [F]', () => this.toggleFlashlight(), { width: 160, height: 42, fontSize: 15, stroke: 0x557477 }).setDepth(53);
    button(this, 700, 681, '向内观察  [E]', () => this.toggleDepthFocus(), { width: 170, height: 42, fontSize: 15, stroke: 0x557477 }).setDepth(53);
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    keyboard.on('keydown-A', () => this.move(-1));
    keyboard.on('keydown-LEFT', () => this.move(-1));
    keyboard.on('keydown-D', () => this.move(1));
    keyboard.on('keydown-RIGHT', () => this.move(1));
    keyboard.on('keydown-R', () => this.openReport());
    keyboard.on('keydown-F', () => this.toggleFlashlight());
    keyboard.on('keydown-E', () => this.toggleDepthFocus());
    keyboard.on('keydown-ESC', () => this.handleEscape());
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.parallaxX = (.5 - pointer.x / 1280) * 28;
      this.parallaxY = (.5 - pointer.y / 720) * 18;
    });
  }

  private move(direction: number): void {
    if (this.isBlocked() || this.transitioning) return;
    this.transitioning = true;
    this.depthFocus = false;
    const outgoing = this.areaView;
    this.areaView = undefined;
    this.areaIndex = (this.areaIndex + direction + AREA_IDS.length) % AREA_IDS.length;
    this.audio.click();
    if (outgoing) {
      this.tweens.add({
        targets: outgoing, x: -direction * 150, y: 10, alpha: 0, scaleX: .96, scaleY: .96,
        duration: 170, ease: 'Sine.easeIn', onComplete: () => outgoing.destroy(true),
      });
    }
    this.time.delayedCall(95, () => {
      this.renderCurrentArea(direction);
      this.transitioning = false;
    });
  }

  private renderCurrentArea(entryDirection = 0): void {
    this.areaView?.destroy(true);
    const area = AREA_IDS[this.areaIndex] ?? 'checkout';
    this.areaView = renderArea(this, area, this.anomalyManager?.inArea(area) ?? [], this.session?.danger ?? 0, this.session?.powerOn ?? true, this.session?.flashlight ?? false);
    this.areaView.setDepth(1);
    if (this.depthFocus) this.areaView.setPosition(-45, -18).setScale(1.07);
    if (entryDirection) {
      const targetX = this.depthFocus ? -45 : 0;
      const targetY = this.depthFocus ? -18 : 0;
      this.areaView.setPosition(entryDirection * 150, 10).setScale(.96).setAlpha(0);
      this.tweens.add({ targets: this.areaView, x: targetX, y: targetY, scaleX: this.depthFocus ? 1.07 : 1, scaleY: this.depthFocus ? 1.07 : 1, alpha: 1, duration: 220, ease: 'Sine.easeOut' });
    }
    if (this.areaName) this.areaName.setText(`${String(this.areaIndex + 1).padStart(2, '0')} / 06   ${AREA_NAMES[area]}`);
  }

  update(_time: number, deltaMs: number): void {
    if (this.areaView) updateAreaParallax(this.areaView, this.parallaxX, this.parallaxY);
    if (this.finishing || this.session.paused) return;
    const delta = Math.min(.1, deltaMs / 1000);
    this.session.tick(delta);
    this.anomalyManager.update(delta);
    this.statusTimer = Math.max(0, this.statusTimer - delta);
    if (!this.statusTimer && !this.modalOverlay) this.statusText.setText('');

    const memory = this.session.elapsedSeconds < MEMORY_SECONDS;
    if (!memory) {
      this.spawnTimer -= delta * DIFFICULTY_CONFIG[this.session.difficulty].spawnMultiplier;
      if (this.spawnTimer <= 0) this.trySpawn();
      const dangerGain = this.anomalyManager.active.reduce((sum, item) => sum + item.dangerRate, 0) * delta;
      this.session.addDanger(dangerGain);
      this.maybeTriggerEvent();
    }
    this.clockText.setText(this.session.timeLabel);
    this.phaseText.setText(memory ? `记忆阶段 ${Math.ceil(MEMORY_SECONDS - this.session.elapsedSeconds)} 秒` : this.phaseForHour());
    this.updateDangerHud();
    this.cooldownText.setText(this.session.reportCooldown > 0 ? `报告终端冷却中：${this.session.reportCooldown.toFixed(1)} 秒` : '');
    this.blackoutOverlay.setAlpha(this.session.danger > 72 ? (this.session.danger - 72) / 260 : 0);

    if (this.session.dead) this.finish(false);
    else if (this.session.finished) this.finish(true);
  }

  private trySpawn(): void {
    this.spawnTimer = Phaser.Math.Between(28, 43);
    const spawned = this.anomalyManager.spawn(this.session.hour, this.session.elapsedSeconds);
    if (!spawned) return;
    this.session.stats.spawned += 1;
    this.audio.alert();
    this.showStatus('监控信号发生了短暂波动……某处可能出现异常。', '#d5a864', 4);
    if (spawned.area === AREA_IDS[this.areaIndex]) this.renderCurrentArea();
    if (loadSave().settings.flicker) {
      this.cameras.main.flash(100, 120, 150, 150, false);
      this.cameras.main.shake(100, .002);
    }
  }

  private phaseForHour(): string {
    const hour = this.session.hour;
    if (hour < 2) return '低风险巡查';
    if (hour < 4) return '异常活动增强';
    if (hour < 5) return '高危时段';
    return '黎明前最后一小时';
  }

  private updateDangerHud(): void {
    const danger = this.session.danger;
    this.dangerFill.width = Math.max(4, 180 * danger / 100);
    let color = COLORS.green; let label = '稳定'; let textColor = '#7bc9b0';
    if (danger >= 75) { color = COLORS.red; label = '极度危险'; textColor = '#ed7379'; }
    else if (danger >= 48) { color = COLORS.amber; label = '异常活跃'; textColor = '#e5bd68'; }
    else if (danger >= 22) { color = 0x9bc76c; label = '受到干扰'; textColor = '#b2d27e'; }
    this.dangerFill.setFillStyle(color); this.dangerLabel.setText(label).setColor(textColor);
  }

  private openReport(): void {
    if (this.reportOverlay || this.modalOverlay || this.pauseOverlay || this.finishing) return;
    if (this.session.reportCooldown > 0) { this.audio.error(); this.showStatus('终端仍在冷却，无法提交新报告。', '#df7178', 3); return; }
    this.session.paused = true;
    this.selectedArea = undefined; this.selectedCategory = undefined;
    this.drawReport();
  }

  private drawReport(): void {
    this.reportOverlay?.destroy(true);
    const c = this.add.container(0, 0).setDepth(100);
    c.add(this.add.rectangle(640, 360, 1280, 720, 0x010405, .9).setInteractive());
    c.add(panel(this, 640, 355, 1010, 585, .99));
    c.add(this.add.text(190, 90, '异常报告终端', { fontFamily: 'Microsoft YaHei', fontSize: '30px', color: '#c5eee8', fontStyle: 'bold' }));
    c.add(this.add.text(190, 135, '选择一个区域与一种异常类型。终端会处理首个匹配目标。', { fontFamily: 'Microsoft YaHei', fontSize: '14px', color: '#739294' }));
    c.add(this.add.text(205, 190, '01 / 异常区域', { fontFamily: 'monospace', fontSize: '16px', color: '#e5bd68' }));
    c.add(this.add.text(695, 190, '02 / 异常类型', { fontFamily: 'monospace', fontSize: '16px', color: '#e5bd68' }));
    AREA_IDS.forEach((area, i) => {
      const selected = this.selectedArea === area;
      const b = button(this, 330, 240 + i * 56, `${selected ? '●' : '○'}  ${AREA_NAMES[area]}`, () => { this.selectedArea = area; this.drawReport(); }, {
        width: 310, height: 44, fontSize: 16, align: 'left', fill: selected ? 0x214447 : 0x102528, stroke: selected ? 0x9be9df : 0x49676a,
      }); c.add(b);
    });
    CATEGORY_IDS.forEach((category, i) => {
      const selected = this.selectedCategory === category;
      const b = button(this, 830, 240 + i * 56, `${selected ? '●' : '○'}  ${CATEGORY_NAMES[category]}`, () => { this.selectedCategory = category; this.drawReport(); }, {
        width: 310, height: 44, fontSize: 16, align: 'left', fill: selected ? 0x214447 : 0x102528, stroke: selected ? 0x9be9df : 0x49676a,
      }); c.add(b);
    });
    c.add(button(this, 430, 595, '取消  [Esc]', () => this.closeReport(), { width: 260, height: 48, stroke: 0x597477 }));
    c.add(button(this, 790, 595, '提交报告', () => this.submitReport(), { width: 320, height: 48, fill: 0x3b3023, stroke: 0xe5bd68 }));
    this.reportOverlay = c;
  }

  private submitReport(): void {
    if (!this.selectedArea || !this.selectedCategory) { this.audio.error(); return; }
    const found = this.anomalyManager.report(this.selectedArea, this.selectedCategory);
    if (found) {
      this.session.stats.resolved += 1;
      this.session.stats.resolveTimes.push(found.age);
      this.session.addDanger(-7);
      this.audio.success();
      this.closeReport();
      this.showStatus(`报告正确：${AREA_NAMES[found.area]} · ${found.name} 已清除。`, '#6bd9a1', 5);
      const current = AREA_IDS[this.areaIndex]; if (current === found.area) this.renderCurrentArea();
    } else {
      this.session.stats.wrongReports += 1;
      this.session.addDanger(12);
      this.session.reportCooldown = DIFFICULTY_CONFIG[this.session.difficulty].cooldown;
      this.audio.error();
      this.closeReport();
      this.showStatus('报告错误。危险上升，终端已暂时锁定。', '#ed6a72', 5);
      this.cameras.main.shake(220, .008);
    }
  }

  private closeReport(): void {
    this.reportOverlay?.destroy(true); this.reportOverlay = undefined;
    this.session.paused = false;
  }

  private maybeTriggerEvent(): void {
    const triggers = [1.35, 2.15, 3.15, 4.35];
    const index = triggers.findIndex((hour, i) => this.session.hour >= hour && !this.eventFlags.has(`event-${i}`));
    if (index < 0 || this.reportOverlay || this.modalOverlay) return;
    this.eventFlags.add(`event-${index}`);
    const event = this.eventsForRun[index] ?? NIGHT_EVENTS[0]!;
    this.showEvent(event);
  }

  private showEvent(event: NightEvent): void {
    this.session.paused = true; this.audio.alert();
    const c = this.add.container(0, 0).setDepth(110);
    c.add(this.add.rectangle(640, 360, 1280, 720, 0x010304, .92).setInteractive());
    c.add(panel(this, 640, 345, 860, 520, .99));
    c.add(this.add.text(250, 125, '特殊事件', { fontFamily: 'monospace', fontSize: '15px', color: '#e5bd68' }));
    c.add(this.add.text(250, 165, event.title, { fontFamily: 'Microsoft YaHei', fontSize: '31px', color: '#dfebe7', fontStyle: 'bold' }));
    c.add(this.add.text(250, 230, event.body, { fontFamily: 'Microsoft YaHei', fontSize: '18px', color: '#91acad', lineSpacing: 12, wordWrap: { width: 760 } }));
    event.choices.forEach((choice, i) => c.add(button(this, 640, 365 + i * 62, choice, () => this.resolveEvent(event, i), {
      width: 650, height: 48, fontSize: 16, align: 'left', stroke: 0x667f80,
    })));
    this.modalOverlay = c;
  }

  private resolveEvent(event: NightEvent, choice: number): void {
    const correct = choice === event.correct;
    if (correct) { this.session.stats.eventCorrect += 1; this.session.addDanger(-5); this.audio.success(); }
    else { this.session.stats.eventWrong += 1; this.session.addDanger(18); this.audio.error(); }
    this.modalOverlay?.destroy(true); this.modalOverlay = undefined; this.session.paused = false;
    if (event.id === 'outage') {
      this.session.powerOn = false;
      this.session.flashlight = correct;
      this.renderCurrentArea();
      this.time.delayedCall(18000, () => {
        if (this.finishing) return;
        this.session.powerOn = true; this.session.flashlight = false; this.renderCurrentArea();
        this.showStatus('备用电源恢复。请重新检查各区域发生的变化。', '#d9c27b', 6);
      });
    }
    this.showStatus(correct ? event.success : event.failure, correct ? '#78d5a8' : '#e1666d', 7);
  }

  private toggleFlashlight(): void {
    if (this.isBlocked()) return;
    this.session.flashlight = !this.session.flashlight; this.audio.click(); this.renderCurrentArea();
    this.showStatus(this.session.flashlight ? '手电筒已打开。' : '手电筒已关闭。', '#8ca9aa', 2);
  }

  private toggleDepthFocus(): void {
    if (this.isBlocked() || this.transitioning || !this.areaView) return;
    this.depthFocus = !this.depthFocus;
    this.audio.click();
    this.tweens.add({
      targets: this.areaView,
      x: this.depthFocus ? -45 : 0,
      y: this.depthFocus ? -18 : 0,
      scaleX: this.depthFocus ? 1.07 : 1,
      scaleY: this.depthFocus ? 1.07 : 1,
      duration: 260,
      ease: 'Sine.easeInOut',
    });
    this.showStatus(this.depthFocus ? '你向场景内部靠近了一步。近景可能遮住某些细节。' : '你退回了正常观察位置。', '#8fc0bd', 3);
  }

  private handleEscape(): void {
    if (this.reportOverlay) { this.closeReport(); return; }
    if (this.modalOverlay) return;
    if (this.pauseOverlay) { this.resumeGame(); return; }
    this.pauseGame();
  }

  private pauseGame(): void {
    this.session.paused = true;
    const c = this.add.container(0, 0).setDepth(120);
    c.add(this.add.rectangle(640, 360, 1280, 720, 0x010405, .9).setInteractive());
    c.add(panel(this, 640, 360, 520, 360));
    c.add(this.add.text(640, 245, '夜班暂停', { fontFamily: 'Microsoft YaHei', fontSize: '34px', color: '#d9eeea' }).setOrigin(.5));
    c.add(button(this, 640, 335, '继续巡查', () => this.resumeGame(), { width: 300 }));
    c.add(button(this, 640, 405, '放弃并返回主菜单', () => this.scene.start('Menu'), { width: 300, stroke: 0x9d5b61 }));
    this.pauseOverlay = c;
  }

  private resumeGame(): void { this.pauseOverlay?.destroy(true); this.pauseOverlay = undefined; this.session.paused = false; }
  private isBlocked(): boolean { return Boolean(this.reportOverlay || this.modalOverlay || this.pauseOverlay || this.finishing); }

  private showStatus(message: string, color: string, seconds: number): void {
    this.statusText.setText(message).setColor(color); this.statusTimer = seconds;
  }

  private finish(won: boolean): void {
    if (this.finishing) return;
    this.finishing = true; this.session.paused = true;
    const attempts = this.session.stats.resolved + this.session.stats.wrongReports;
    const accuracy = attempts ? this.session.stats.resolved / attempts : 0;
    const excellent = won && accuracy >= .9 && this.session.stats.wrongReports === 0 && this.session.stats.eventWrong === 0 && this.session.stats.resolved >= 7;
    const score = Math.max(0, Math.round(this.session.stats.resolved * 120 + this.session.stats.eventCorrect * 180 + (won ? 600 : 0) - this.session.stats.wrongReports * 90 - this.session.danger * 3));
    const grade = score >= 1800 ? 'S' : score >= 1350 ? 'A' : score >= 950 ? 'B' : score >= 550 ? 'C' : 'D';
    const result: ResultData = {
      won, ending: !won ? 'missing' : excellent ? 'excellent' : 'normal', score, grade, accuracy,
      stats: this.session.stats, danger: this.session.danger, elapsedMinutes: Math.min(360, Math.floor(this.session.hour * 60)),
    };
    if (!won) { this.audio.error(); this.cameras.main.shake(700, .025); }
    else this.audio.success();
    this.cameras.main.fadeOut(1200, won ? 210 : 40, won ? 225 : 0, won ? 210 : 8);
    this.time.delayedCall(1250, () => this.scene.start('Result', result));
  }
}
