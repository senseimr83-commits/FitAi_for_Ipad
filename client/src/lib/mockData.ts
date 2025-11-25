export interface DailyMetric {
  date: string;
  rhr: number;
  hrv: number;
  sleepScore: number;
  sleepConsistency: number; // 0-100
  workoutIntensity: number; // 0-10
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  steps: number;
  deepSleepMinutes: number;
  spo2: number;
  recoveryScore: number;
}

export const generateMockData = (days: number): DailyMetric[] => {
  const data: DailyMetric[] = [];
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseRHR = 55 + Math.random() * 5;
    const baseHRV = 60 + Math.random() * 20;
    
    data.push({
      date: date.toISOString().split('T')[0],
      rhr: Math.round(baseRHR + (isWeekend ? 2 : 0)),
      hrv: Math.round(baseHRV - (isWeekend ? 5 : 0)),
      sleepScore: Math.round(70 + Math.random() * 30),
      sleepConsistency: Math.round(60 + Math.random() * 40),
      workoutIntensity: Math.round(Math.random() * 10),
      calories: Math.round(2000 + Math.random() * 1000),
      protein: Math.round(100 + Math.random() * 80),
      carbs: Math.round(150 + Math.random() * 150),
      fats: Math.round(50 + Math.random() * 40),
      steps: Math.round(5000 + Math.random() * 10000),
      deepSleepMinutes: Math.round(40 + Math.random() * 80),
      spo2: 95 + Math.random() * 4,
      recoveryScore: Math.round(Math.random() * 100),
    });
  }
  return data;
};

export const mockData = generateMockData(30);

export const fuelData = [
  { subject: 'Protein', A: 120, fullMark: 150 },
  { subject: 'Carbs', A: 98, fullMark: 150 },
  { subject: 'Fats', A: 86, fullMark: 150 },
  { subject: 'Hydration', A: 99, fullMark: 150 },
  { subject: 'Micros', A: 85, fullMark: 150 },
  { subject: 'Timing', A: 65, fullMark: 150 },
];

export const syncIndexScores = {
  recovery: 82,
  adaptation: 67,
  metabolic: 91
};
