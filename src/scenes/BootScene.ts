import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create(): void {
    this.cameras.main.setBackgroundColor('#02070a');
    this.add.text(640, 330, '夜班系统启动中…', {
      fontFamily: 'Microsoft YaHei, sans-serif', fontSize: '24px', color: '#79d6cf',
    }).setOrigin(.5);
    const bar = this.add.rectangle(440, 380, 0, 2, 0x79d6cf).setOrigin(0, .5);
    this.tweens.add({ targets: bar, width: 400, duration: 550, onComplete: () => this.scene.start('Menu') });
  }
}
