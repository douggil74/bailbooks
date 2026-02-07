'use client';

import Link from 'next/link';
import { TrendingUp, Shield, Clock } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';

const REPORTS = [
  {
    href: '/books/reports/profit-loss',
    title: 'Profit & Loss',
    description: 'Revenue vs expenses for any date range',
    icon: TrendingUp,
    color: 'text-emerald-400',
  },
  {
    href: '/books/reports/outstanding',
    title: 'Outstanding Bonds',
    description: 'Active bond liability and premium receivable',
    icon: Shield,
    color: 'text-blue-400',
  },
  {
    href: '/books/reports/aging',
    title: 'Aging Receivables',
    description: 'Overdue payments by aging bucket (30/60/90+)',
    icon: Clock,
    color: 'text-yellow-400',
  },
];

export default function ReportsPage() {
  const { theme } = useTheme();
  const light = theme === 'light';

  return (
    <div className="space-y-6">
      <h1 className={`text-2xl font-bold ${light ? 'text-gray-900' : 'text-white'}`}>Reports</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.href}
              href={r.href}
              className={`border rounded-xl p-5 transition-colors group ${
                light
                  ? 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
                  : 'bg-gray-900 border-gray-800 hover:border-gray-700'
              }`}
            >
              <Icon className={`w-6 h-6 ${r.color} mb-3`} />
              <h3 className={`font-semibold group-hover:text-[#d4af37] transition-colors ${
                light ? 'text-gray-900' : 'text-white'
              }`}>
                {r.title}
              </h3>
              <p className={`text-sm mt-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>{r.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
