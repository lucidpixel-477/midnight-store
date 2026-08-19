import type { ResultData, RunRecord, SaveData } from './types';

const KEY = 'midnight-store-save-v1';
const MAX_RUN_HISTORY = 20;
const DEFAULT_SAVE: SaveData = {
  version: 2,
  bestScore: 0,
  bestGrade: '—',
  unlockedEndings: [],
  discoveredAnomalies: [],
  runHistory: [],
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
      runHistory: Array.isArray(saved.runHistory)
        ? saved.runHistory.filter(isRunRecord).slice(0, MAX_RUN_HISTORY)
        : [],
      version: 2,
    };
  } catch { return structuredClone(DEFAULT_SAVE); }
}

export function writeSave(save: SaveData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function saveRunCheckpoint(record: RunRecord): SaveData {
  const save = loadSave();
  const existingIndex = save.runHistory.findIndex((item) => item.id === record.id);
  if (existingIndex >= 0) save.runHistory.splice(existingIndex, 1);
  save.runHistory.unshift(record);
  save.runHistory = save.runHistory.slice(0, MAX_RUN_HISTORY);
  writeSave(save);
  return save;
}

export function saveRunResult(result: ResultData, anomalyIds: string[]): SaveData {
  const save = loadSave();
  const previous = save.runHistory.find((item) => item.id === result.runId);
  const alreadyFinal = previous && previous.status !== 'in_progress';
  const record: RunRecord = {
    id: result.runId,
    startedAt: result.startedAt,
    updatedAt: Date.now(),
    status: result.won ? 'completed' : 'failed',
    difficulty: result.difficulty,
    score: result.score,
    grade: result.grade,
    elapsedSeconds: result.elapsedMinutes * 60,
    resolved: result.stats.resolved,
    wrongReports: result.stats.wrongReports,
    eventCorrect: result.stats.eventCorrect,
  };
  const existingIndex = save.runHistory.findIndex((item) => item.id === result.runId);
  if (existingIndex >= 0) save.runHistory.splice(existingIndex, 1);
  save.runHistory.unshift(record);
  save.runHistory = save.runHistory.slice(0, MAX_RUN_HISTORY);

  if (!alreadyFinal) {
    save.bestScore = Math.max(save.bestScore, result.score);
    const gradeOrder = ['—', 'D', 'C', 'B', 'A', 'S'];
    if (gradeOrder.indexOf(result.grade) > gradeOrder.indexOf(save.bestGrade)) save.bestGrade = result.grade;
    if (!save.unlockedEndings.includes(result.ending)) save.unlockedEndings.push(result.ending);
    const discoverCount = Math.min(anomalyIds.length, save.discoveredAnomalies.length + result.stats.resolved);
    for (const anomalyId of anomalyIds) {
      if (save.discoveredAnomalies.length >= discoverCount) break;
      if (!save.discoveredAnomalies.includes(anomalyId)) save.discoveredAnomalies.push(anomalyId);
    }
  }

  writeSave(save);
  return save;
}

function isRunRecord(value: unknown): value is RunRecord {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<RunRecord>;
  return typeof item.id === 'string'
    && typeof item.startedAt === 'number'
    && typeof item.updatedAt === 'number'
    && ['in_progress', 'completed', 'failed', 'abandoned'].includes(item.status ?? '')
    && ['easy', 'normal', 'expert'].includes(item.difficulty ?? '')
    && typeof item.score === 'number'
    && typeof item.grade === 'string'
    && typeof item.elapsedSeconds === 'number'
    && typeof item.resolved === 'number'
    && typeof item.wrongReports === 'number'
    && typeof item.eventCorrect === 'number';
}
