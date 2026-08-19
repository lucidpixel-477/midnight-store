import { beforeEach, describe, expect, it } from 'vitest';
import { loadSave, saveRunCheckpoint, saveRunResult } from '../src/game/save';
import type { ResultData, RunRecord } from '../src/game/types';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });

const checkpoint: RunRecord = {
  id: 'shift-test', startedAt: 1000, updatedAt: 2000, status: 'in_progress', difficulty: 'normal',
  score: 0, grade: '—', elapsedSeconds: 12, resolved: 0, wrongReports: 0, eventCorrect: 0,
};

const result: ResultData = {
  runId: 'shift-test', startedAt: 1000, difficulty: 'normal', won: true, ending: 'normal',
  score: 720, grade: 'C', accuracy: 1, danger: 12, elapsedMinutes: 360,
  stats: { spawned: 1, resolved: 1, wrongReports: 0, resolveTimes: [4], eventCorrect: 0, eventWrong: 0, maxDanger: 12 },
};

describe('save data', () => {
  beforeEach(() => localStorage.clear());

  it('migrates a version 1 save without losing its best score', () => {
    localStorage.setItem('midnight-store-save-v1', JSON.stringify({ version: 1, bestScore: 500, bestGrade: 'C' }));
    const save = loadSave();
    expect(save.version).toBe(2);
    expect(save.bestScore).toBe(500);
    expect(save.bestGrade).toBe('C');
    expect(save.runHistory).toEqual([]);
  });

  it('persists and updates a checkpoint without duplicating the run', () => {
    saveRunCheckpoint(checkpoint);
    saveRunCheckpoint({ ...checkpoint, updatedAt: 3000, elapsedSeconds: 18, resolved: 1 });
    const save = loadSave();
    expect(save.runHistory).toHaveLength(1);
    expect(save.runHistory[0]?.elapsedSeconds).toBe(18);
    expect(save.runHistory[0]?.resolved).toBe(1);
  });

  it('finalizes a run once and keeps the result after reloading', () => {
    saveRunCheckpoint(checkpoint);
    saveRunResult(result, ['a', 'b']);
    saveRunResult(result, ['a', 'b']);
    const save = loadSave();
    expect(save.runHistory).toHaveLength(1);
    expect(save.runHistory[0]?.status).toBe('completed');
    expect(save.bestScore).toBe(720);
    expect(save.bestGrade).toBe('C');
    expect(save.discoveredAnomalies).toEqual(['a']);
  });
});
