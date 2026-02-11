import { cn } from '@/lib/utils';

const categoryColors: Record<string, string> = {
  Homepage: 'bg-primary/15 text-primary',
  Pricing: 'bg-success/15 text-success',
  Product: 'bg-accent text-accent-foreground',
  Blog: 'bg-warning/15 text-warning',
  Documentation: 'bg-[hsl(270,60%,55%)]/15 text-[hsl(270,60%,55%)]',
  About: 'bg-secondary text-secondary-foreground',
  Contact: 'bg-muted text-muted-foreground',
};

interface CategoryBadgeProps {
  category: string;
  color?: string | null;
  className?: string;
}

export function CategoryBadge({ category, color, className }: CategoryBadgeProps) {
  const fallbackClass = categoryColors[category] ?? 'bg-muted text-muted-foreground';

  const style = color
    ? { backgroundColor: `${color}20`, color }
    : undefined;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        !color && fallbackClass,
        className,
      )}
      style={style}
    >
      {category}
    </span>
  );
}
