import { DIFFICULTY_CONFIG, REAL_SECONDS_PER_GAME_HOUR } from './config';
import type { Difficulty, GameStats } from './types';

export class GameSession {
  elapsedSeconds = 0;
  danger = 4;
  reportCooldown = 0;
  powerOn = true;
  flashlight = false;
  paused = false;
  stats: GameStats = {
    spawned: 0, resolved: 0, wrongReports: 0, resolveTimes: [],
    eventCorrect: 0, eventWrong: 0, maxDanger: 4,
  };

  constructor(public readonly difficulty: Difficulty) {}

  get hour(): number { return this.elapsedSeconds / REAL_SECONDS_PER_GAME_HOUR; }
  get finished(): boolean { return this.hour >= 6; }
  get dead(): boolean { return this.danger >= 100; }

  tick(deltaSeconds: number): void {
    if (this.paused) return;
    this.elapsedSeconds += deltaSeconds;
    this.reportCooldown = Math.max(0, this.reportCooldown - deltaSeconds);
    this.stats.maxDanger = Math.max(this.stats.maxDanger, this.danger);
  }

  addDanger(value: number): void {
    this.danger = Math.min(100, Math.max(0, this.danger + value * DIFFICULTY_CONFIG[this.difficulty].dangerMultiplier));
  }

  get timeLabel(): string {
    const totalMinutes = Math.min(360, Math.floor(this.hour * 60));
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
  }
}
