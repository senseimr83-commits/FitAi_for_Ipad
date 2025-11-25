import { CircularProgress } from "./CircularProgress";

interface SyncIndexProps {
  hrv?: number;
  sleep?: number;
  recovery?: number;
}

export function SyncIndex({ hrv = 0, sleep = 0, recovery = 0 }: SyncIndexProps) {
  return (
    <div className="grid grid-cols-3 gap-4 h-full items-center">
      <div className="flex flex-col items-center gap-2">
        <CircularProgress value={recovery} color="var(--color-primary)" label="REC" delay={0.2} />
        <span className="text-xs font-mono text-white/50 uppercase mt-2">Recovery</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CircularProgress value={hrv} color="var(--color-secondary)" label="HRV" delay={0.4} />
        <span className="text-xs font-mono text-white/50 uppercase mt-2">HRV</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CircularProgress value={sleep} color="var(--color-accent)" label="SLP" delay={0.6} />
        <span className="text-xs font-mono text-white/50 uppercase mt-2">Sleep</span>
      </div>
    </div>
  );
}
