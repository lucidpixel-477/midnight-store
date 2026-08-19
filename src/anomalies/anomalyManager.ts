import { ANOMALIES } from './anomalyData';
import type { ActiveAnomaly, AnomalyCategory, AreaId } from '../game/types';

export class AnomalyManager {
  readonly active: ActiveAnomaly[] = [];
  private used = new Set<string>();

  get maxActive(): number { return 3; }

  allowedCount(hour: number): number {
    if (hour < 2) return 1;
    if (hour < 4) return 2;
    return 3;
  }

  spawn(hour: number, nowSeconds: number, random = Math.random): ActiveAnomaly | null {
    if (this.active.length >= this.allowedCount(hour)) return null;
    let pool = ANOMALIES.filter((item) => item.startHour <= hour && !this.used.has(item.id));
    if (!pool.length) {
      this.used.clear();
      this.active.forEach((item) => this.used.add(item.id));
      pool = ANOMALIES.filter((item) => item.startHour <= hour && !this.used.has(item.id));
    }
    pool = pool.filter((item) => !this.active.some((active) =>
      active.area === item.area || active.conflicts?.includes(item.id) || item.conflicts?.includes(active.id),
    ));
    const picked = pool[Math.floor(random() * pool.length)];
    if (!picked) return null;
    const active = { ...picked, spawnedAt: nowSeconds, age: 0 };
    this.active.push(active);
    this.used.add(active.id);
    return active;
  }

  update(deltaSeconds: number): void { this.active.forEach((item) => { item.age += deltaSeconds; }); }

  report(area: AreaId, category: AnomalyCategory): ActiveAnomaly | null {
    const index = this.active.findIndex((item) => item.area === area && item.category === category);
    if (index < 0) return null;
    const [removed] = this.active.splice(index, 1);
    return removed ?? null;
  }

  inArea(area: AreaId): ActiveAnomaly[] { return this.active.filter((item) => item.area === area); }
}
