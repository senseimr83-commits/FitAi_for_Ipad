import type { FitnessMetric } from './api';

// Transform fitness metrics for RecoveryRadar (3D Bubble Chart)
export function transformRecoveryRadarData(metrics: FitnessMetric[]) {
  return metrics.map((m) => ({
    x: m.workoutIntensity || 0,
    y: m.sleepScore || 0,
    z: m.rhr || 60,
    name: m.date,
  })).slice(-7); // Last 7 days
}

// Transform fitness metrics for NerveCheck (Dual Line Chart)
export function transformNerveCheckData(metrics: FitnessMetric[]) {
  return metrics.map((m) => ({
    date: m.date,
    hrv: m.hrv || 0,
    sleepConsistency: m.sleepConsistency || 0,
  })).slice(-14); // Last 14 days
}

// Transform fitness metrics for MindShield (Heatmap)
export function transformMindShieldData(metrics: FitnessMetric[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeks = 4;
  
  const heatmapData = [];
  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < 7; day++) {
      const index = week * 7 + day;
      const metric = metrics[metrics.length - 28 + index]; // Last 4 weeks
      heatmapData.push({
        day: days[day],
        week: `W${week + 1}`,
        value: metric?.sleepConsistency || 0,
      });
    }
  }
  return heatmapData;
}

// Transform fitness metrics for Wellness Triangle (Radar Chart with 4 health dimensions)
export function transformWellnessTriangleData(metrics: FitnessMetric[]) {
  const latest = metrics[metrics.length - 1];
  if (!latest) return [];
  
  // Normalize RHR to 0-100 scale (lower is better, so invert it)
  // Typical RHR range: 40-80 bpm, optimal is 40-60
  const normalizeRHR = (rhr: number | null) => {
    if (!rhr) return 0;
    // Invert so lower HR = higher score
    return Math.max(0, Math.min(100, 100 - ((rhr - 40) * 2)));
  };
  
  return [
    { subject: 'Recovery', A: latest.recoveryScore || 0, fullMark: 100 },
    { subject: 'HRV', A: latest.hrv || 0, fullMark: 100 },
    { subject: 'Sleep', A: latest.sleepScore || 0, fullMark: 100 },
    { subject: 'RHR', A: normalizeRHR(latest.rhr), fullMark: 100 },
  ];
}

// For backwards compatibility (renamed)
export const transformFuelAnalyzerData = transformWellnessTriangleData;

// Transform fitness metrics for LoadBalancer (Bar + Line Chart)
export function transformLoadBalancerData(metrics: FitnessMetric[]) {
  return metrics.map((m) => ({
    date: m.date,
    strain: m.workoutIntensity || 0,
    recovery: m.recoveryScore || 0,
  })).slice(-7); // Last 7 days
}

// Calculate Sync Index scores
export function calculateSyncIndexScores(metrics: FitnessMetric[]) {
  const latest = metrics[metrics.length - 1];
  if (!latest) {
    return {
      hrv: 0,
      sleep: 0,
      recovery: 0,
    };
  }
  
  return {
    hrv: latest.hrv || 0,
    sleep: latest.sleepScore || 0,
    recovery: latest.recoveryScore || 0,
  };
}
