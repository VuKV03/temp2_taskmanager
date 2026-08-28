import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  style?: React.CSSProperties;
}

/** Generic pill badge. Pass explicit bg/text colors via `style` for data-driven colors (status, priority, tags). */
export const Badge = ({ className, ...props }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-small font-medium',
      'bg-status-todo text-status-todo-text',
      className,
    )}
    {...props}
  />
);
