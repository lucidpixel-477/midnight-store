import Phaser from 'phaser';
import { COLORS } from './config';
import type { ActiveAnomaly, AreaId } from './types';

type G = Phaser.GameObjects.Graphics;

export function renderArea(
  scene: Phaser.Scene,
  area: AreaId,
  anomalies: ActiveAnomaly[],
  danger: number,
  powerOn: boolean,
  flashlight: boolean,
): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0);
  const g = scene.add.graphics();
  container.add(g);
  const has = (id: string) => anomalies.some((item) => item.id === id);
  const text = (x: number, y: number, value: string, size = 18, color = '#c6ded9', origin = .5) => {
    const obj = scene.add.text(x, y, value, { fontFamily: 'Microsoft YaHei, sans-serif', fontSize: `${size}px`, color, align: 'center' }).setOrigin(origin);
    container.add(obj); return obj;
  };

  g.fillStyle(0x071318).fillRect(0, 65, 1280, 575);
  g.fillStyle(0x0d262b).fillRect(0, 565, 1280, 75);
  g.lineStyle(2, 0x153a40, .8).lineBetween(0, 565, 1280, 565);
  g.fillStyle(0xa7d9d0, .8).fillRect(140, 92, 1000, 5);
  g.fillStyle(0xa7d9d0, .08).fillRect(120, 96, 1040, 310);

  if (area === 'checkout') drawCheckout(g, text, has);
  else if (area === 'shelves') drawShelves(g, text, has);
  else if (area === 'drinks') drawDrinks(g, text, has);
  else if (area === 'dining') drawDining(g, text, has);
  else if (area === 'storage') drawStorage(g, text, has);
  else drawSecurity(g, text, has);

  if (!powerOn) {
    g.fillStyle(0x000104, flashlight ? .78 : .94).fillRect(0, 65, 1280, 575);
    if (flashlight) {
      g.fillStyle(0xe7ead0, .11).fillCircle(640, 350, 250);
      g.lineStyle(2, 0xe7ead0, .13).strokeCircle(640, 350, 250);
    }
  }
  if (danger > 58) {
    g.fillStyle(0x5b0711, Math.min(.18, (danger - 58) / 260)).fillRect(0, 65, 1280, 575);
  }
  return container;
}

function drawCheckout(g: G, text: TextMaker, has: Has): void {
  // Entrance and rainy street
  g.fillStyle(0x101a20).fillRect(75, 130, 300, 405);
  g.lineStyle(5, 0x416169).strokeRect(75, 130, 300, 405);
  g.lineStyle(3, 0x29444b).lineBetween(225, 130, 225, 535);
  for (let i = 0; i < 18; i++) g.lineStyle(2, 0x7aa7b5, .26).lineBetween(95 + (i * 47) % 260, 150 + (i * 71) % 340, 80 + (i * 47) % 260, 190 + (i * 71) % 340);
  if (has('door_figure')) {
    g.fillStyle(0x010203, .95).fillEllipse(235, 330, 90, 220).fillCircle(235, 210, 47);
    g.fillStyle(0xdce9db, .75).fillCircle(220, 207, 4).fillCircle(250, 207, 4);
  }
  g.fillStyle(0x172f32).fillRect(450, 390, 680, 175);
  g.fillStyle(0x214249).fillRect(490, 315, 160, 95);
  g.fillStyle(0x0a1112).fillRect(510, 333, 120, 43);
  text(570, 354, '¥  0.00', 18, '#78d9b3');
  g.fillStyle(0xaab7a4).fillRect(680, 410, 150, 70);
  g.fillStyle(0x38474a).fillRect(705, 430, 100, 4);
  if (has('receipt_message')) text(755, 505, '别 回 头', 17, '#a21f31');
  else { g.fillStyle(0xd6dfcf).fillRect(735, 472, 50, 60); g.lineStyle(1, 0x73817a).lineBetween(744, 490, 776, 490); }
  g.fillStyle(0x324a49).fillRect(905, 190, 180, 180);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) g.fillStyle((x + y) % 2 ? 0xa98155 : 0x78575a).fillRect(922 + x * 30, 210 + y * 50, 20, 35);
  g.fillStyle(0xd9e2d7).fillCircle(720, 195, 65);
  g.lineStyle(3, 0x253639).strokeCircle(720, 195, 65);
  const angle = has('clock_reverse') ? -1.9 : 1.15;
  g.lineStyle(4, 0x26393c).lineBetween(720, 195, 720 + Math.cos(angle) * 43, 195 + Math.sin(angle) * 43).lineBetween(720, 195, 690, 177);
  text(720, 275, has('clock_reverse') ? '时针正在倒退' : '00:00', 13, has('clock_reverse') ? '#df6b72' : '#738f91');
  if (has('red_customer')) {
    g.fillStyle(0x1d1114).fillCircle(415, 235, 38);
    g.fillStyle(0x9a1f32).fillTriangle(350, 490, 415, 265, 480, 490);
    g.fillStyle(0xd6c6b1).fillCircle(415, 230, 27);
    g.fillStyle(0x24191b).fillRect(392, 225, 46, 4);
  }
  text(640, 590, '入口玻璃门外只有雨。收银机显示归零。时钟正常行走。', 14, '#66888a');
}

function drawShelves(g: G, text: TextMaker, has: Has): void {
  g.fillStyle(0x183239).fillRect(105, 170, 930, 370);
  for (let shelf = 0; shelf < 4; shelf++) {
    const y = 190 + shelf * 82;
    g.fillStyle(0x36565a).fillRect(120, y + 62, 900, 12);
    for (let i = 0; i < 15; i++) {
      if (has('missing_cans') && shelf === 1 && i > 4 && i < 12) continue;
      const palette = [0x9b6058, 0x4f8581, 0xb59655, 0x6e668e];
      g.fillStyle(palette[(i + shelf) % palette.length] ?? 0x888888).fillRoundedRect(135 + i * 58, y + ((i + shelf) % 3) * 3, 36, 57, 4);
      g.fillStyle(0xdad7b8, .55).fillRect(142 + i * 58, y + 18, 22, 11);
    }
  }
  if (has('aisle_figure')) {
    g.fillStyle(0x010304).fillRect(740, 252, 43, 235).fillCircle(761, 230, 32);
    g.fillStyle(0xd8d7c2).fillCircle(751, 228, 3).fillCircle(771, 228, 3);
  }
  g.fillStyle(0xe2ddd0).fillRect(1070, 175, 125, 210);
  g.fillStyle(has('poster_face') ? 0x561422 : 0x315c62).fillCircle(1132, 245, 45);
  if (has('poster_face')) {
    g.fillStyle(0xf2e3c4).fillCircle(1115, 242, 8).fillCircle(1149, 242, 8);
    g.lineStyle(5, 0x16070a).arc(1132, 255, 28, .1, 3.04);
    text(1132, 325, '它认识你', 18, '#7c1724');
  } else text(1132, 325, '热食优惠', 18, '#26484c');
  const price = has('price_666') ? '¥ 666.66' : '¥ 6.80';
  text(395, 278, price, 15, has('price_666') ? '#ed5663' : '#d4d2bd');
  text(640, 590, '四层货架。第二层摆满银色罐头。右侧是蓝绿色促销海报。', 14, '#66888a');
}

function drawDrinks(g: G, text: TextMaker, has: Has): void {
  g.fillStyle(0x152c35).fillRect(105, 135, 1070, 405);
  for (let door = 0; door < 5; door++) {
    const x = 120 + door * 208;
    const dark = has('freezer_dark') && door === 3;
    g.fillStyle(dark ? 0x020506 : 0x264c55, dark ? 1 : .9).fillRect(x, 150, 190, 370);
    g.lineStyle(5, 0x54747a).strokeRect(x, 150, 190, 370);
    g.fillStyle(0xc6f6e7, dark ? .01 : .16).fillRect(x + 8, 158, 174, 354);
    for (let row = 0; row < 4; row++) {
      g.fillStyle(0x7ca09e, .6).fillRect(x + 14, 235 + row * 70, 162, 4);
      for (let bottle = 0; bottle < (has('extra_bottles') && door === 1 ? 9 : 6); bottle++) {
        const bx = x + 19 + bottle * 25;
        g.fillStyle([0x6da1b2, 0xb65e5c, 0x8ca85f][(bottle + row) % 3] ?? 0x888888).fillRoundedRect(bx, 190 + row * 70, 16, 41, 5);
      }
    }
  }
  if (has('freezer_reflection')) {
    g.fillStyle(0x020405, .73).fillEllipse(685, 337, 95, 270).fillCircle(685, 190, 42);
    g.fillStyle(0xb8d5ce, .55).fillCircle(670, 187, 4).fillCircle(700, 187, 4);
  }
  if (has('wrong_brand')) text(352, 370, '你', 20, '#f4e7c8');
  text(640, 590, '五组冷柜全部亮着。瓶装饮料整齐排列，玻璃只映出货架。', 14, '#66888a');
}

function drawDining(g: G, text: TextMaker, has: Has): void {
  g.fillStyle(0x0b1920).fillRect(70, 135, 540, 270);
  g.lineStyle(5, 0x3d5c62).strokeRect(70, 135, 540, 270);
  for (let i = 0; i < 20; i++) g.lineStyle(2, 0x6f9dad, .24).lineBetween(90 + (i * 79) % 490, 150 + (i * 47) % 230, 75 + (i * 79) % 490, 190 + (i * 47) % 230);
  if (has('window_eyes')) {
    g.fillStyle(0xd8e5ce, .7).fillEllipse(270, 260, 95, 48).fillEllipse(440, 260, 95, 48);
    g.fillStyle(0x05070a).fillCircle(270, 260, 19).fillCircle(440, 260, 19);
  }
  for (let i = 0; i < 2; i++) {
    const x = 250 + i * 390;
    g.fillStyle(0x324e4f).fillRoundedRect(x, 420, 260, 30, 8);
    g.fillStyle(0x203438).fillRect(x + 20, 450, 15, 105).fillRect(x + 225, 450, 15, 105);
    const turned = has('chair_turn') && i === 0;
    g.fillStyle(0x614f4d).fillRect(turned ? x - 100 : x + 85, 478, 85, 18).fillRect(turned ? x - 100 : x + 85, 495, 12, 60);
  }
  g.fillStyle(0xaab4a7).fillRoundedRect(895, 215, 210, 145, 8);
  g.fillStyle(0x121b1b).fillRect(923, 248, 150, 70);
  text(998, 283, has('microwave_time') ? '66:66' : '00:00', 25, has('microwave_time') ? '#ed5d65' : '#83e2b0');
  if (has('faceless_guest')) {
    g.fillStyle(0x2a2d32).fillTriangle(640, 508, 710, 315, 780, 508);
    g.fillStyle(0xd3c6ad).fillCircle(710, 300, 47);
  }
  text(640, 590, '两张桌子、四把朝向桌面的椅子。微波炉待机，窗外只有雨。', 14, '#66888a');
}

function drawStorage(g: G, text: TextMaker, has: Has): void {
  const open = has('storage_open') || has('door_shadow');
  g.fillStyle(0x15282b).fillRect(425, 130, 430, 430);
  g.lineStyle(10, 0x385052).strokeRect(425, 130, 430, 430);
  g.fillStyle(open ? 0x000102 : 0x273f40).fillRect(440, 145, 400, 410);
  if (!open) {
    g.fillStyle(0x6c8580).fillRect(785, 345, 28, 10);
    text(640, 305, 'STAFF ONLY', 23, '#849d97');
  }
  if (has('door_shadow')) {
    g.fillStyle(0x020002).fillEllipse(640, 405, 260, 400);
    g.fillStyle(0x8e101f, .55).fillCircle(610, 255, 8).fillCircle(670, 255, 8);
  }
  const moved = has('box_move');
  for (let i = 0; i < 4; i++) {
    const x = (moved && i === 1) ? 920 : 135 + (i % 2) * 150;
    const y = (moved && i === 1) ? 160 : 390 - Math.floor(i / 2) * 120;
    g.fillStyle(0x8d7553).fillRect(x, y, 130, 100);
    g.lineStyle(2, 0x594732).strokeRect(x, y, 130, 100).lineBetween(x, y, x + 130, y + 100);
    text(x + 65, y + 48, '↑', 29, '#3f3429');
  }
  g.fillStyle(0x9b323c).fillRect(1000, 260, 55, 145).fillCircle(1028, 260, 28);
  if (has('bloody_steps')) {
    for (let i = 0; i < 7; i++) g.fillStyle(0x7f101b, .85).fillEllipse(470 + i * 65, 530 - (i % 2) * 20, 25, 43);
  }
  text(640, 590, '仓库门关闭上锁。四只纸箱码在左侧，灭火器在右侧。', 14, '#66888a');
}

function drawSecurity(g: G, text: TextMaker, has: Has): void {
  g.fillStyle(0x121b1d).fillRect(65, 125, 765, 390);
  for (let i = 0; i < 6; i++) {
    const x = 85 + (i % 3) * 245; const y = 145 + Math.floor(i / 3) * 178;
    const lost = has('camera_lost') && i === 2;
    g.fillStyle(lost ? 0x1d2425 : 0x173a3d).fillRect(x, y, 225, 155);
    g.lineStyle(2, 0x617b79).strokeRect(x, y, 225, 155);
    if (lost) for (let n = 0; n < 60; n++) g.fillStyle(n % 2 ? 0xd1ddd8 : 0x556361, .45).fillRect(x + (n * 47) % 220, y + (n * 83) % 150, 12, 3);
    else {
      g.fillStyle(0x79948f, .2).fillRect(x + 10, y + 18, 205, 98);
      g.lineStyle(2, 0x8faeaa, .3).lineBetween(x + 15, y + 120, x + 210, y + 120);
    }
    text(x + 18, y + 8, `CAM 0${i + 1}`, 11, '#8eaeaa', 0);
  }
  if (has('monitor_person') || has('black_approach')) {
    const big = has('black_approach');
    g.fillStyle(0x010203, .9).fillEllipse(415, big ? 310 : 275, big ? 220 : 80, big ? 310 : 130).fillCircle(415, big ? 180 : 204, big ? 82 : 30);
    g.fillStyle(0xdc1e34, .65).fillCircle(390, big ? 173 : 200, big ? 7 : 3).fillCircle(440, big ? 173 : 200, big ? 7 : 3);
  }
  g.fillStyle(0xd0d5c4).fillRect(875, 125, 330, 390);
  text(1040, 155, '夜班员工守则', 22, '#233638');
  const rules = has('rule_changed')
    ? '1. 整点确认仓库门\n2. 红制服是你的同事\n3. 三点后请打开仓库门\n4. 回应所有电话\n5. 不要相信旧规则'
    : '1. 整点确认仓库门已锁\n2. 本店没有红制服员工\n3. 不明顾客切勿接近\n4. 三点后不要回应呼救\n5. 不存在的时间立即上报';
  text(910, 205, rules, 16, has('rule_changed') ? '#6e101a' : '#344b4a', 0).setLineSpacing(12);
  text(640, 590, '六路监控均有信号。员工守则共五条，第三条之后不要开仓库门。', 14, '#66888a');
}

type TextMaker = (x: number, y: number, value: string, size?: number, color?: string, origin?: number) => Phaser.GameObjects.Text;
type Has = (id: string) => boolean;
