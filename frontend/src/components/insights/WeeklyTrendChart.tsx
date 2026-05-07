import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { GlassCard } from '../ui/GlassCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useWeeklyTrend } from '../../hooks/useInsights';

export function WeeklyTrendChart() {
  const { data, isLoading } = useWeeklyTrend();
  if (isLoading) return <LoadingSpinner className="py-10" />;
  if (!data) return null;

  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), 'MMM d'),
  }));

  return (
    <GlassCard>
      <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
        Past 4 Weeks — Daily Completion
      </h3>
      <div className="h-44 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="trend-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ffff" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#00ffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              stroke="#6b7a99"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={4}
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
              labelStyle={{ color: '#f0f4ff' }}
              formatter={(v: number) => [`${v.toFixed(0)}%`, 'Completion']}
            />
            <Area
              type="monotone"
              dataKey="pct"
              stroke="#00ffff"
              strokeWidth={2}
              fill="url(#trend-grad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
