'use client';

import Link from 'next/link';
import { TrendingUp, Shield, Clock } from 'lucide-react';

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
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Reports</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.href}
              href={r.href}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors group"
            >
              <Icon className={`w-6 h-6 ${r.color} mb-3`} />
              <h3 className="text-white font-semibold group-hover:text-[#d4af37] transition-colors">
                {r.title}
              </h3>
              <p className="text-sm text-gray-400 mt-1">{r.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
