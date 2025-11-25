import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from "recharts";

interface RecoveryDataPoint {
  x: number;
  y: number;
  z: number;
  name: string;
}

interface RecoveryRadarProps {
  data?: RecoveryDataPoint[];
}

export function RecoveryRadar({ data = [] }: RecoveryRadarProps) {
  const chartData = data.length > 0 ? data : [{ x: 0, y: 0, z: 60, name: 'No data' }];

  return (
    <div className="h-full w-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Intensity" 
            unit="" 
            stroke="rgba(255,255,255,0.2)"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Sleep" 
            unit="%" 
            stroke="rgba(255,255,255,0.2)"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <ZAxis type="number" dataKey="z" range={[50, 400]} name="RHR" />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Scatter name="Recovery" data={chartData} fill="#8884d8">
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.z > 60 ? 'var(--color-accent)' : 'var(--color-primary)'} 
                fillOpacity={0.6}
                stroke={entry.z > 60 ? 'var(--color-accent)' : 'var(--color-primary)'}
                strokeWidth={2}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
