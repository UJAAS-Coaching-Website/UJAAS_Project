import { Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../theme';

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`group inline-flex items-center gap-2 rounded-full border px-2 py-1.5 text-left backdrop-blur-md transition-all ${
        !compact ? 'sm:gap-4 sm:px-4 sm:py-2.5 sm:min-w-[190px]' : ''
      } ${
        isDark
          ? 'border-white/15 bg-slate-950/45 text-slate-100 shadow-lg shadow-black/20'
          : 'border-white/35 bg-white/15 text-white shadow-lg shadow-cyan-950/15'
      }`}
    >
      <span
        className={`relative flex items-center rounded-full px-1 transition-colors ${
          compact ? 'h-6 w-11' : 'h-6 w-11 sm:h-9 sm:w-[72px]'
        } ${isDark ? 'bg-slate-900/90 justify-end' : 'bg-white/25 justify-start'}`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className={`flex items-center justify-center rounded-full shadow-md ${
            compact ? 'h-4 w-4' : 'h-4 w-4 sm:h-7 sm:w-7'
          } ${isDark ? 'bg-slate-100 text-slate-900' : 'bg-white text-cyan-700'}`}
        >
          {isDark ? (
            <Moon className={compact ? 'h-3 w-3' : 'h-3 w-3 sm:h-4 sm:w-4'} />
          ) : (
            <Sun className={compact ? 'h-3 w-3' : 'h-3 w-3 sm:h-4 sm:w-4'} />
          )}
        </motion.span>
      </span>

      {!compact && (
        <span className="hidden sm:block leading-none">
          <span className="text-base font-semibold tracking-wide text-white">
            {theme === 'dark' ? 'Dark mode' : 'Light mode'}
          </span>
        </span>
      )}
    </button>
  );
}
