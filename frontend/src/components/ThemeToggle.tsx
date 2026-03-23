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
      className={`group inline-flex items-center gap-3 rounded-full border px-2.5 py-2 text-left backdrop-blur-md transition-all ${
        isDark
          ? 'border-white/15 bg-slate-950/45 text-slate-100 shadow-lg shadow-black/20'
          : 'border-white/35 bg-white/15 text-white shadow-lg shadow-cyan-950/15'
      } ${compact ? 'min-w-[132px]' : 'min-w-[148px]'}`}
    >
      <span
        className={`relative flex ${compact ? 'h-7 w-12' : 'h-8 w-14'} items-center rounded-full px-1 transition-colors ${
          isDark ? 'bg-slate-900/90' : 'bg-white/25'
        }`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className={`flex ${compact ? 'h-5 w-5' : 'h-6 w-6'} items-center justify-center rounded-full shadow-md ${
            isDark ? 'bg-slate-100 text-slate-900' : 'bg-white text-cyan-700'
          }`}
        >
          {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        </motion.span>
      </span>

      <span className="flex flex-col leading-none">
        <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-cyan-100/80'}`}>
          Theme
        </span>
        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-white'}`}>
          {theme === 'dark' ? 'Dark mode' : 'Light mode'}
        </span>
      </span>
    </button>
  );
}
