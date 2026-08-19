import type { Difficulty } from './types';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const REAL_SECONDS_PER_GAME_HOUR = 120;
export const MEMORY_SECONDS = 35;

export const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string; spawnMultiplier: number; dangerMultiplier: number; cooldown: number;
}> = {
  easy: { label: '见习', spawnMultiplier: 0.82, dangerMultiplier: 0.75, cooldown: 5 },
  normal: { label: '标准', spawnMultiplier: 1, dangerMultiplier: 1, cooldown: 8 },
  expert: { label: '噩梦', spawnMultiplier: 1.22, dangerMultiplier: 1.3, cooldown: 11 },
};

export const COLORS = {
  ink: 0x061014, panel: 0x0b1b20, panel2: 0x10292d, teal: 0x79d6cf,
  cyan: 0x8be5e7, muted: 0x72969a, amber: 0xe5bd68, red: 0xdd5d62,
  paper: 0xd8e2d6, black: 0x020506, white: 0xe7f4f2, green: 0x5cd69b,
};
