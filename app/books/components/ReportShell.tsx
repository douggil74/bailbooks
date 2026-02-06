'use client';

import { useState } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
  const now = new Date();
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);

  function handleApply() {
    onDateChange?.(startDate, endDate);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/books/reports" className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white flex-1">{title}</h1>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {showDateRange && (
        <div className="flex flex-wrap items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-3">
          <label className="text-xs text-gray-500 font-semibold">Period:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          />
          <span className="text-gray-500 text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
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
