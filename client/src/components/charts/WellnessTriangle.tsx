import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";

interface WellnessData {
  subject: string;
  A: number;
  fullMark: number;
}

interface WellnessTriangleProps {
  data?: WellnessData[];
}

export function WellnessTriangle({ data = [] }: WellnessTriangleProps) {
  const chartData = data.length > 0 ? data : [
    { subject: 'Recovery', A: 0, fullMark: 100 },
    { subject: 'HRV', A: 0, fullMark: 100 },
    { subject: 'Sleep', A: 0, fullMark: 100 },
    { subject: 'RHR', A: 0, fullMark: 100 },
  ];

  return (
    <div className="h-full w-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="rgba(132,204,22,0.2)" strokeWidth={1.5} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)' }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Wellness Score"
            dataKey="A"
            stroke="var(--color-primary)"
            strokeWidth={3}
            fill="var(--color-primary)"
            fillOpacity={0.5}
          />
          <Tooltip 
             contentStyle={{ 
               backgroundColor: '#0a0a0f', 
               border: '1px solid rgba(132,204,22,0.3)', 
               borderRadius: '12px', 
               color: '#fff',
               fontFamily: 'var(--font-mono)',
               fontSize: '12px'
             }}
             labelStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
