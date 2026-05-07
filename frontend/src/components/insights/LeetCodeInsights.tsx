import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { GlassCard } from '../ui/GlassCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { useLeetCodeInsights } from '../../hooks/useInsights';

export function LeetCodeInsights() {
  const { data, isLoading } = useLeetCodeInsights();
  if (isLoading) return <LoadingSpinner className="py-10" />;
  if (!data) return null;

  const daily = data.daily.map((d) => ({
    ...d,
    label: format(new Date(d.date), 'MMM d'),
  }));

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat label="Easy" value={data.total_easy} color="text-neon-green" />
          <Stat label="Medium" value={data.total_medium} color="text-neon-amber" />
          <Stat label="Hard" value={data.total_hard} color="text-neon-red" />
          <Stat label="Total" value={data.total_all} color="text-neon-cyan" />
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-3 font-semibold">
          Last 30 Days
        </h3>
        <div className="h-48 -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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
                width={20}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17,24,39,0.95)',
                  border: '1px solid rgba(0,255,255,0.2)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="easy" stackId="a" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="medium" stackId="a" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              <Bar dataKey="hard" stackId="a" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <AnimatedNumber
        value={value}
        className={`block text-2xl font-extrabold ${color}`}
      />
      <span className="text-[10px] uppercase tracking-widest text-text-secondary">
        {label}
      </span>
    </div>
  );
}
