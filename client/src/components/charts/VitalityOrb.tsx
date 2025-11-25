import { motion } from "framer-motion";

interface VitalityOrbProps {
  score?: number;
  hrv?: number;
  sleep?: number;
}

export function VitalityOrb({ score = 0, hrv = 0, sleep = 0 }: VitalityOrbProps) {
  const path1 = "M45.7,-76.2C58.9,-69.3,69.1,-55.6,76.2,-40.8C83.3,-26,87.3,-10.1,84.8,4.4C82.3,18.9,73.3,32,63.3,43.3C53.3,54.6,42.3,64.1,29.4,70.8C16.5,77.5,1.7,81.4,-11.8,79.2C-25.3,77,-37.5,68.7,-48.4,59.1C-59.3,49.5,-68.9,38.6,-75.1,25.8C-81.3,13,-84.1,-1.7,-79.6,-14.8C-75.1,-27.9,-63.3,-39.4,-51.5,-47.2C-39.7,-55,-27.9,-59.1,-15.7,-61.9C-3.5,-64.7,9.1,-66.2,22.2,-68.1C35.3,-70,48.4,-72.3,45.7,-76.2Z";
  const path2 = "M43.6,-73.1C56.6,-65.6,67.5,-54.1,74.8,-40.9C82.1,-27.7,85.8,-12.8,83.2,1.1C80.6,15,71.7,27.9,61.8,39.1C51.9,50.3,41,59.8,28.6,66.3C16.2,72.8,2.3,76.3,-10.9,74.1C-24.1,71.9,-36.6,64,-47.9,54.3C-59.2,44.6,-69.3,33.1,-74.9,19.8C-80.5,6.5,-81.6,-8.6,-75.9,-21.3C-70.2,-34,-57.7,-44.3,-45.6,-52.3C-33.5,-60.3,-21.8,-66,-9.5,-68.1C2.8,-70.2,15.6,-68.7,28.4,-67.2C41.2,-65.7,54,-64.2,43.6,-73.1Z";

  const getState = () => {
    if (score === 0) return { label: 'Waiting for Data', suggestion: 'Sync Google Fit to see your vitality score' };
    if (score >= 90) return { label: 'Peak State', suggestion: 'Perfect for high-intensity training' };
    if (score >= 75) return { label: 'Ready', suggestion: 'Good energy for moderate workouts' };
    if (score >= 50) return { label: 'Moderate', suggestion: 'Light activity recommended' };
    return { label: 'Recovery Mode', suggestion: 'Focus on rest and recovery today' };
  };

  const state = getState();

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent z-0" />
      
      <div className="relative z-10 w-full h-[200px] flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_30px_rgba(132,204,22,0.6)]">
          <defs>
            <linearGradient id="orbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ccff00" />
              <stop offset="100%" stopColor="#00f0ff" />
            </linearGradient>
          </defs>
          <g transform="translate(100 100)">
            <motion.path
              d={path1}
              animate={{
                d: [path1, path2, path1],
                rotate: [0, 180, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="url(#orbGradient)"
            />
          </g>
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl font-display font-bold text-black mix-blend-overlay" data-testid="text-vitality-score">
              {score || '--'}
            </span>
            <span className="text-[10px] font-mono text-black/60 uppercase tracking-widest mix-blend-overlay">Vitality</span>
        </div>
      </div>

      <div className="mt-4 text-center z-10 px-4">
        <h3 className="text-lg font-medium text-white mb-1">{state.label}</h3>
        <p className="text-xs text-white/50 leading-relaxed">
          {state.suggestion}
        </p>
      </div>
    </div>
  );
}
