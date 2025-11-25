import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";

interface FuelData {
  subject: string;
  A: number;
  fullMark: number;
}

interface FuelAnalyzerProps {
  data?: FuelData[];
}

export function FuelAnalyzer({ data = [] }: FuelAnalyzerProps) {
  const chartData = data.length > 0 ? data : [
    { subject: 'Protein', A: 0, fullMark: 200 },
    { subject: 'Carbs', A: 0, fullMark: 300 },
    { subject: 'Fats', A: 0, fullMark: 100 },
    { subject: 'Calories', A: 0, fullMark: 3000 },
  ];

  return (
    <div className="h-full w-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
          <Radar
            name="Nutrient Intake"
            dataKey="A"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="var(--color-accent)"
            fillOpacity={0.4}
          />
          <Tooltip 
             contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
