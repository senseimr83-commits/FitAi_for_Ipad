import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { format, parseISO } from "date-fns";

interface NerveCheckDataPoint {
  date: string;
  hrv: number;
  sleepConsistency: number;
}

interface NerveCheckProps {
  data?: NerveCheckDataPoint[];
}

export function NerveCheck({ data = [] }: NerveCheckProps) {
  const chartData = data.length > 0 ? data : [
    { date: new Date().toISOString(), hrv: 0, sleepConsistency: 0 }
  ];

  return (
    <div className="h-full w-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorHrv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            tickFormatter={(str) => format(parseISO(str), "dd")}
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            yAxisId="left"
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="hrv" 
            stroke="var(--color-secondary)" 
            strokeWidth={3}
            dot={{ r: 3, fill: 'var(--color-secondary)', strokeWidth: 0 }}
            activeDot={{ r: 6, stroke: 'var(--color-background)', strokeWidth: 2 }}
          />
          <Line 
            yAxisId="right"
            type="step" 
            dataKey="sleepConsistency" 
            stroke="var(--color-primary)" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
