import { describe, expect, it } from 'vitest';
import { AnomalyManager } from '../src/anomalies/anomalyManager';

describe('AnomalyManager', () => {
  it('only spawns anomalies unlocked for the current hour', () => {
    const manager = new AnomalyManager();
    const anomaly = manager.spawn(.6, 10, () => 0);
    expect(anomaly).not.toBeNull();
    expect(anomaly!.startHour).toBeLessThanOrEqual(.6);
  });

  it('prevents more simultaneous anomalies than the time period allows', () => {
    const manager = new AnomalyManager();
    expect(manager.spawn(1, 0, () => 0)).not.toBeNull();
    expect(manager.spawn(1, 1, () => .8)).toBeNull();
  });

  it('clears only a matching area/category report', () => {
    const manager = new AnomalyManager();
    const anomaly = manager.spawn(1, 0, () => 0)!;
    expect(manager.report('security', 'danger')).toBeNull();
    expect(manager.active).toHaveLength(1);
    expect(manager.report(anomaly.area, anomaly.category)?.id).toBe(anomaly.id);
    expect(manager.active).toHaveLength(0);
  });

  it('raises concurrency from one to three over the night', () => {
    const manager = new AnomalyManager();
    expect(manager.allowedCount(1.9)).toBe(1);
    expect(manager.allowedCount(3)).toBe(2);
    expect(manager.allowedCount(4)).toBe(3);
  });
});
