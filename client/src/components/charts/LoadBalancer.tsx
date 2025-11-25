import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";

interface LoadBalancerDataPoint {
  date: string;
  strain: number;
  recovery: number;
}

interface LoadBalancerProps {
  data?: LoadBalancerDataPoint[];
}

export function LoadBalancer({ data = [] }: LoadBalancerProps) {
  const chartData = data.length > 0 ? data : [
    { date: new Date().toISOString(), strain: 0, recovery: 0 }
  ];

  return (
    <div className="h-full w-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
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
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          />
          <Bar 
            yAxisId="left"
            dataKey="strain" 
            name="Strain"
            fill="var(--color-accent)" 
            radius={[4, 4, 0, 0]}
            barSize={8}
            fillOpacity={0.8}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="recovery" 
            name="Recovery"
            stroke="var(--color-primary)" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--color-primary)' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
