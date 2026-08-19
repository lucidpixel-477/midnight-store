import Phaser from 'phaser';
import { addScanlines, button, panel, title } from '../ui/ui';
import { loadSave, writeSave } from '../game/save';

const PAGES = [
  { num: '01', title: '观察与记忆', body: '前 35 秒不会出现异常。\n用画面两侧按钮或 A / D 切换区域，按 E 向内观察。\n移动鼠标查看景深，记住商品、文字、门窗与倒影。' },
  { num: '02', title: '发现并报告', body: '异常出现后会一直存在。前往监控室，或按 R，\n依次选择“区域”和“异常类型”再提交。\n正确报告会清除异常；错误报告会提升危险并锁定终端。' },
  { num: '03', title: '活到六点', body: '未处理异常会持续提高危险。\n留意特殊事件与《夜班员工守则》，不要盲信被改写的规则。\n危险达到上限，夜班将提前结束。' },
];

export class TutorialScene extends Phaser.Scene {
  private page = 0;
  constructor() { super('Tutorial'); }

  create(): void { this.draw(); }

  private draw(): void {
    this.children.removeAll();
    this.cameras.main.setBackgroundColor('#050c10');
    addScanlines(this);
    title(this, 640, 105, '夜班岗前说明', 34);
    const item = PAGES[this.page] ?? PAGES[0]!;
    panel(this, 640, 350, 780, 370);
    this.add.text(330, 215, item.num, { fontFamily: 'monospace', fontSize: '62px', color: '#e5bd68' });
    this.add.text(440, 228, item.title, { fontFamily: 'Microsoft YaHei', fontSize: '30px', color: '#bde9e3' });
    this.add.text(330, 315, item.body, {
      fontFamily: 'Microsoft YaHei', fontSize: '20px', color: '#9bb6b8', lineSpacing: 14,
    });
    this.add.text(640, 494, `${this.page + 1} / ${PAGES.length}`, { fontSize: '15px', color: '#638286' }).setOrigin(.5);
    button(this, 505, 590, this.page ? '上一页' : '返回', () => {
      if (this.page) { this.page -= 1; this.draw(); } else this.scene.start('Menu');
    }, { width: 220, height: 46, stroke: 0x58787b });
    button(this, 775, 590, this.page === PAGES.length - 1 ? '开始值班' : '下一页', () => {
      if (this.page < PAGES.length - 1) { this.page += 1; this.draw(); return; }
      const save = loadSave(); save.tutorialSeen = true; writeSave(save); this.scene.start('Store');
    }, { width: 220, height: 46 });
  }
}
