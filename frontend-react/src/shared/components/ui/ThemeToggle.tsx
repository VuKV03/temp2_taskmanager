import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../stores/theme.store';
import { cn } from '../../utils/cn';

export const ThemeToggle = () => {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-border transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isDark ? 'bg-primary' : 'bg-background',
      )}
    >
      <span
        className={cn(
          'inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface shadow-sm transition-transform',
          isDark ? 'translate-x-[26px]' : 'translate-x-1',
        )}
      >
        {isDark ? <Moon className="h-3 w-3 text-primary" /> : <Sun className="h-3 w-3 text-priority-medium" />}
      </span>
    </button>
  );
};
