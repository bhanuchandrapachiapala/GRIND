import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { heatmapColor } from '../../lib/utils';
import type { DailyCompletionSummary } from '../../types';

interface HeatmapCalendarProps {
  data: DailyCompletionSummary[];
  days?: number;
}

export function HeatmapCalendar({ data, days = 90 }: HeatmapCalendarProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  const grid = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => map.set(d.date, d.pct));
    const today = new Date();
    const cells: { date: string; pct: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, 'yyyy-MM-dd');
      cells.push({ date: key, pct: map.get(key) ?? 0 });
    }
    return cells;
  }, [data, days]);

  // Group into columns of 7 (week columns)
  const columns: { date: string; pct: number }[][] = [];
  for (let i = 0; i < grid.length; i += 7) {
    columns.push(grid.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="flex gap-[2px] min-w-max">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[2px]">
            {col.map((cell) => (
              <motion.div
                key={cell.date}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: ci * 0.01, duration: 0.2 }}
                onMouseEnter={() =>
                  setTooltip(`${cell.date} — ${cell.pct.toFixed(0)}%`)
                }
                onMouseLeave={() => setTooltip(null)}
                onTouchStart={() =>
                  setTooltip(`${cell.date} — ${cell.pct.toFixed(0)}%`)
                }
                className="h-[10px] w-[10px] rounded-sm"
                style={{ backgroundColor: heatmapColor(cell.pct) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-text-secondary">
        <span>{tooltip ?? 'Last 90 days'}</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          {[0, 30, 60, 89, 100].map((p) => (
            <span
              key={p}
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: heatmapColor(p) }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
