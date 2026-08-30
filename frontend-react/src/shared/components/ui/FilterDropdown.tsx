import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { Checkbox } from './Checkbox';

interface FilterDropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterDropdownOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export const FilterDropdown = ({ label, options, selected, onChange, className }: FilterDropdownProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(rootRef, () => setOpen(false));

  const toggleValue = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const active = selected.length > 0;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-small transition-colors',
          active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text hover:bg-background',
        )}
      >
        {label}
        {active && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1 min-w-44 rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {options.length === 0 && <p className="px-3 py-1.5 text-small text-text-muted">Không có lựa chọn</p>}
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-small hover:bg-background"
            >
              <Checkbox
                checked={selected.includes(option.value)}
                onChange={() => toggleValue(option.value)}
                className="h-4 w-4"
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
