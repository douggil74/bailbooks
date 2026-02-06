'use client';

import type { CashFlowMonth } from '@/lib/books-types';

export default function CashFlowChart({ data }: { data: CashFlowMonth[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-400 text-sm">No cash flow data yet</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expenses]), 1);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-4">Cash Flow (Last 6 Months)</h3>
      <div className="flex items-end gap-3 h-40">
        {data.map((month) => (
          <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-1 items-end h-32">
              {/* Income bar */}
              <div
                className="flex-1 bg-emerald-500/70 rounded-t-sm transition-all"
                style={{ height: `${(month.income / maxVal) * 100}%`, minHeight: month.income > 0 ? '2px' : '0' }}
                title={`Income: $${month.income.toLocaleString()}`}
              />
              {/* Expense bar */}
              <div
                className="flex-1 bg-red-500/70 rounded-t-sm transition-all"
                style={{ height: `${(month.expenses / maxVal) * 100}%`, minHeight: month.expenses > 0 ? '2px' : '0' }}
                title={`Expenses: $${month.expenses.toLocaleString()}`}
              />
            </div>
            <span className="text-[10px] text-gray-500 mt-1">{month.month}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" />
          <span className="text-[10px] text-gray-500">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500/70" />
          <span className="text-[10px] text-gray-500">Expenses</span>
        </div>
      </div>
    </div>
  );
}
