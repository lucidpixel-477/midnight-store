import type { SaveData } from './types';

const KEY = 'midnight-store-save-v1';
const DEFAULT_SAVE: SaveData = {
  version: 1,
  bestScore: 0,
  bestGrade: '—',
  unlockedEndings: [],
  discoveredAnomalies: [],
  tutorialSeen: false,
  settings: { volume: 0.65, flicker: true, difficulty: 'normal' },
};

export function loadSave(): SaveData {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<SaveData>;
    return {
      ...DEFAULT_SAVE,
      ...saved,
      settings: { ...DEFAULT_SAVE.settings, ...saved.settings },
      unlockedEndings: Array.isArray(saved.unlockedEndings) ? saved.unlockedEndings : [],
      discoveredAnomalies: Array.isArray(saved.discoveredAnomalies) ? saved.discoveredAnomalies : [],
    };
  } catch { return structuredClone(DEFAULT_SAVE); }
}

export function writeSave(save: SaveData): void {
  localStorage.setItem(KEY, JSON.stringify(save));
}
