'use client';

import { useState, useEffect } from 'react';
import ReportShell from '../../components/ReportShell';
import type { ProfitLossReport } from '@/lib/books-types';

const ORG_ID_KEY = 'bailbooks_org_id';

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ProfitLossPage() {
  const [report, setReport] = useState<ProfitLossReport | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);

  function fetchReport(start: string, end: string) {
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (!orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/books/reports/profit-loss?org_id=${orgId}&start_date=${start}&end_date=${end}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setReport(d);
      })
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchReport(startDate, endDate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ReportShell
      title="Profit & Loss Statement"
      onDateChange={(s, e) => {
        setStartDate(s);
        setEndDate(e);
        fetchReport(s, e);
      }}
    >
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center animate-pulse">
          <p className="text-gray-400">Generating report...</p>
        </div>
      ) : !report ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">No data available</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {/* Revenue Section */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">Revenue</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Premiums Earned (bonds created in period)</span>
                <span className="text-gray-300">{fmt(report.revenue.premiums_earned)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Payments Collected</span>
                <span className="text-gray-300">{fmt(report.revenue.payments_collected)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-gray-800 pt-2 mt-2">
                <span className="text-white">Total Revenue</span>
                <span className="text-emerald-400">{fmt(report.revenue.total_revenue)}</span>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Expenses</h3>
            <div className="space-y-2">
              {report.expenses_by_category.length === 0 ? (
                <p className="text-gray-500 text-sm">No expenses in this period</p>
              ) : (
                report.expenses_by_category.map((cat) => (
                  <div key={cat.category} className="flex justify-between text-sm">
                    <span className="text-gray-400">{cat.category}</span>
                    <span className="text-gray-300">{fmt(cat.amount)}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between text-sm font-semibold border-t border-gray-800 pt-2 mt-2">
                <span className="text-white">Total Expenses</span>
                <span className="text-red-400">{fmt(report.total_expenses)}</span>
              </div>
            </div>
          </div>

          {/* Net Income */}
          <div className="p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-white">Net Income</span>
              <span className={`text-lg font-bold ${report.net_income >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmt(report.net_income)}
              </span>
            </div>
          </div>
        </div>
      )}
    </ReportShell>
  );
}
