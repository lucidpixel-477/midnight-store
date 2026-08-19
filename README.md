# 深夜便利店：异常巡查

一款使用 Phaser 3、TypeScript 和 Vite 制作的 2.5D 第一人称观察类恐怖小游戏。

## 在线游玩

<https://lucidpixel-477.github.io/midnight-store/>

## 本地运行

```bash
npm install
npm run dev
```

## 操作

- `A / D`：切换巡查区域
- `E`：向场景深处观察
- `F`：开关手电筒
- `R`：打开异常报告
- `P / Esc`：暂停或继续游戏
- 移动鼠标：产生轻微的前后景视差

## 存档

游戏会在开局和游玩过程中自动保存值班记录，并在正常结束、失败或主动退出时更新结果。主菜单中的“值班记录”可以查看最近 20 次记录。本地运行与 GitHub Pages 使用各自浏览器来源下的独立存档。

## 构建与测试

```bash
npm test
npm run build
```
