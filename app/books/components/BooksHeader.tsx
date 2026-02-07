'use client';

import Link from 'next/link';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function BooksHeader() {
  const { theme, toggle } = useTheme();
  const light = theme === 'light';

  return (
    <header className={`border-b ${light ? 'bg-[#1a4d2e] border-[#1a4d2e]/50' : 'bg-[#1a4d2e] border-[#1a4d2e]/50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/books/dashboard" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[#d4af37] flex items-center justify-center text-[#0a0a0a] font-black text-lg">$</span>
          <span className="text-lg font-bold text-white">BailBooks</span>
          <span className="text-xs bg-white/20 text-white/80 px-2 py-0.5 rounded-full font-medium">
            Accounting
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title={light ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {light
              ? <Moon className="w-4 h-4 text-white" />
              : <Sun className="w-4 h-4 text-[#d4af37]" />
            }
          </button>
        </div>
      </div>
    </header>
  );
}
