import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HabitListItem } from './HabitListItem';
import type { Habit } from '../../types';

interface SortableHabitItemProps {
  habit: Habit;
  reorderMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function SortableHabitItem(props: SortableHabitItemProps) {
  const { habit, reorderMode } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: habit.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 20 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <HabitListItem
        habit={habit}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        onPause={props.onPause}
        onResume={props.onResume}
        reorderMode={reorderMode}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
