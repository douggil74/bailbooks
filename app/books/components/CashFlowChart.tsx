'use client';

import type { CashFlowMonth } from '@/lib/books-types';
import { useTheme } from './ThemeProvider';

export default function CashFlowChart({ data }: { data: CashFlowMonth[] }) {
  const { theme } = useTheme();
  const light = theme === 'light';

  if (data.length === 0) {
    return (
      <div className={`border rounded-xl p-8 text-center ${
        light ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'
      }`}>
        <p className={`text-sm ${light ? 'text-gray-400' : 'text-gray-400'}`}>No cash flow data yet</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expenses]), 1);

  return (
    <div className={`border rounded-xl p-4 ${
      light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'
    }`}>
      <h3 className={`text-sm font-semibold mb-4 ${light ? 'text-gray-900' : 'text-white'}`}>Cash Flow (Last 6 Months)</h3>
      <div className="flex items-end gap-3 h-40">
        {data.map((month) => (
          <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-1 items-end h-32">
              <div
                className="flex-1 bg-emerald-500/70 rounded-t-sm transition-all"
                style={{ height: `${(month.income / maxVal) * 100}%`, minHeight: month.income > 0 ? '2px' : '0' }}
                title={`Income: $${month.income.toLocaleString()}`}
              />
              <div
                className="flex-1 bg-red-500/70 rounded-t-sm transition-all"
                style={{ height: `${(month.expenses / maxVal) * 100}%`, minHeight: month.expenses > 0 ? '2px' : '0' }}
                title={`Expenses: $${month.expenses.toLocaleString()}`}
              />
            </div>
            <span className={`text-[10px] mt-1 ${light ? 'text-gray-400' : 'text-gray-500'}`}>{month.month}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" />
          <span className={`text-[10px] ${light ? 'text-gray-400' : 'text-gray-500'}`}>Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500/70" />
          <span className={`text-[10px] ${light ? 'text-gray-400' : 'text-gray-500'}`}>Expenses</span>
        </div>
      </div>
    </div>
  );
}
