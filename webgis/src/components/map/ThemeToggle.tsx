'use client';
// ============================================================
// ThemeToggle — Tombol Sun/Moon untuk switch light/dark mode
// ============================================================

import { useMapStore } from '@/store/mapStore';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useMapStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'glass-card rounded-xl px-3 py-1.5 flex items-center gap-1.5',
        'transition-all duration-300 cursor-pointer pointer-events-auto',
        'hover:scale-105',
        isDark
          ? 'hover:border-amber-500/30 hover:shadow-[0_0_12px_rgba(245,158,11,.2)]'
          : 'hover:border-indigo-400/30 hover:shadow-[0_0_12px_rgba(99,102,241,.2)]'
      )}
      title={isDark ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
      aria-label={isDark ? 'Aktifkan light mode' : 'Aktifkan dark mode'}
    >
      {isDark ? (
        <>
          <Sun size={12} className="text-amber-400" />
          <span className="text-[9px] font-bold text-amber-400">LIGHT</span>
        </>
      ) : (
        <>
          <Moon size={12} className="text-indigo-500" />
          <span className="text-[9px] font-bold text-indigo-500">DARK</span>
        </>
      )}
    </button>
  );
}
