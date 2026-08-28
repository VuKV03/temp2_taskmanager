import type { LabelHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export const Label = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('mb-1 block text-small font-medium text-text', className)} {...props} />
);
