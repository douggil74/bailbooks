'use client';

import Link from 'next/link';
import { BookOpen, Phone, ExternalLink } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function BooksFooter() {
  const { theme } = useTheme();
  const light = theme === 'light';

  return (
    <footer className={`border-t mt-12 py-8 ${
      light ? 'bg-gray-50 border-gray-200' : 'bg-gray-950 border-gray-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-[#d4af37] flex items-center justify-center text-[#0a0a0a] font-black text-xs">$</span>
            <span className={`font-bold ${light ? 'text-gray-900' : 'text-white'}`}>
              BailBooks
            </span>
            <span className={`text-xs ${light ? 'text-gray-500' : 'text-gray-500'}`}>Accounting</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link href="/books/dashboard" className={`hover:text-[#d4af37] transition-colors ${light ? 'text-gray-600' : 'text-gray-400'}`}>
              Dashboard
            </Link>
            <Link href="/books/reports" className={`hover:text-[#d4af37] transition-colors ${light ? 'text-gray-600' : 'text-gray-400'}`}>
              Reports
            </Link>
            <Link href="/books/settings" className={`hover:text-[#d4af37] transition-colors ${light ? 'text-gray-600' : 'text-gray-400'}`}>
              Settings
            </Link>
            <Link href="/command" className={`flex items-center gap-1 hover:text-[#d4af37] transition-colors ${light ? 'text-gray-600' : 'text-gray-400'}`}>
              <ExternalLink className="w-3 h-3" />
              Bail Command
            </Link>
          </div>

          <a
            href="tel:9852649519"
            className="flex items-center gap-1.5 text-[#d4af37] font-semibold text-sm hover:text-[#e5c55a] transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            985-264-9519
          </a>
        </div>

        <div className={`mt-6 pt-4 border-t text-center text-xs ${
          light ? 'border-gray-200 text-gray-400' : 'border-gray-800 text-gray-600'
        }`}>
          © {new Date().getFullYear()} BailBooks by BailBonds Financed. All rights reserved. Licensed Louisiana Bail Bond Agents.
        </div>
      </div>
    </footer>
  );
}
