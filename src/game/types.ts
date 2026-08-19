export const AREA_IDS = ['checkout', 'shelves', 'drinks', 'dining', 'storage', 'security'] as const;
export type AreaId = (typeof AREA_IDS)[number];

export const CATEGORY_IDS = ['item', 'environment', 'text', 'figure', 'customer', 'danger'] as const;
export type AnomalyCategory = (typeof CATEGORY_IDS)[number];

export const AREA_NAMES: Record<AreaId, string> = {
  checkout: '收银台', shelves: '食品货架', drinks: '饮料区',
  dining: '用餐区', storage: '仓库门口', security: '监控室',
};

export const CATEGORY_NAMES: Record<AnomalyCategory, string> = {
  item: '物品异常', environment: '环境异常', text: '文字异常',
  figure: '人影异常', customer: '顾客异常', danger: '危险异常',
};

export type Difficulty = 'easy' | 'normal' | 'expert';

export interface AnomalyDefinition {
  id: string;
  name: string;
  area: AreaId;
  category: AnomalyCategory;
  startHour: number;
  dangerRate: number;
  hint: string;
  conflicts?: string[];
}

export interface ActiveAnomaly extends AnomalyDefinition {
  spawnedAt: number;
  age: number;
}

export interface GameStats {
  spawned: number;
  resolved: number;
  wrongReports: number;
  resolveTimes: number[];
  eventCorrect: number;
  eventWrong: number;
  maxDanger: number;
}

export interface SaveData {
  version: 1;
  bestScore: number;
  bestGrade: string;
  unlockedEndings: string[];
  discoveredAnomalies: string[];
  tutorialSeen: boolean;
  settings: { volume: number; flicker: boolean; difficulty: Difficulty };
}

export interface ResultData {
  won: boolean;
  ending: 'normal' | 'excellent' | 'missing';
  score: number;
  grade: string;
  accuracy: number;
  stats: GameStats;
  danger: number;
  elapsedMinutes: number;
}
