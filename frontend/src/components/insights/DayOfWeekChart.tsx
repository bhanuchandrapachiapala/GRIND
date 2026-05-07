import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GlassCard } from '../ui/GlassCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useDayOfWeek } from '../../hooks/useInsights';

export function DayOfWeekChart() {
  const { data, isLoading } = useDayOfWeek();
  if (isLoading) return <LoadingSpinner className="py-10" />;
  if (!data) return null;

  return (
    <GlassCard>
      <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
        Average by Day of Week
      </h3>
      <div className="h-44 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="day_name"
              stroke="#6b7a99"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7a99"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              width={28}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17,24,39,0.95)',
                border: '1px solid rgba(0,255,255,0.2)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v.toFixed(0)}%`, 'Avg Completion']}
            />
            <Bar dataKey="avg_pct" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.day_name} fill="#00ffff" fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
