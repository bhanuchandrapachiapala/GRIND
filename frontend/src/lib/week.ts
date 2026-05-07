import { format, startOfWeek } from 'date-fns';

/** Returns the Monday-of-this-week date in YYYY-MM-DD form. */
export function currentWeekStart(d: Date = new Date()): string {
  return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

/** Returns YYYY-MM-DD of the Monday of the week containing `d`. */
export function weekStartOf(d: Date): string {
  return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}
