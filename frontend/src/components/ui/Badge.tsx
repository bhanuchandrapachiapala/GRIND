import { categoryBadgeClass, categoryLabel } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}
    >
      {children}
    </span>
  );
}

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  return (
    <Badge className={`${categoryBadgeClass(category)} ${className}`}>
      {categoryLabel(category)}
    </Badge>
  );
}
