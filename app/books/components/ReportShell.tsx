'use client';

import { useState } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from './ThemeProvider';

export default function ReportShell({
  title,
  showDateRange = true,
  onDateChange,
  children,
}: {
  title: string;
  showDateRange?: boolean;
  onDateChange?: (start: string, end: string) => void;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const light = theme === 'light';
  const now = new Date();
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);

  function handleApply() {
    onDateChange?.(startDate, endDate);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/books/reports" className={`${light ? 'text-gray-400 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className={`text-2xl font-bold flex-1 ${light ? 'text-gray-900' : 'text-white'}`}>{title}</h1>
        <button
          onClick={() => window.print()}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            light ? 'bg-gray-100 text-gray-500 hover:text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {showDateRange && (
        <div className={`flex flex-wrap items-center gap-3 border rounded-xl p-3 ${
          light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'
        }`}>
          <label className={`text-xs font-semibold ${light ? 'text-gray-400' : 'text-gray-500'}`}>Period:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none ${
              light ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'
            }`}
          />
          <span className={`text-sm ${light ? 'text-gray-400' : 'text-gray-500'}`}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none ${
              light ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'
            }`}
          />
          <button
            onClick={handleApply}
            className="px-3 py-1.5 bg-[#d4af37] text-[#0a0a0a] font-bold rounded-lg text-sm"
          >
            Apply
          </button>
        </div>
      )}

      <div className="print:bg-white print:text-black">{children}</div>
    </div>
  );
}
