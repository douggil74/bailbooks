'use client';

import type { LucideIcon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function KPICard({
  label,
  value,
  icon: Icon,
  format = 'currency',
  colorClass = 'border-gray-800',
}: {
  label: string;
  value: number | null;
  icon?: LucideIcon;
  format?: 'currency' | 'number';
  colorClass?: string;
}) {
  const { theme } = useTheme();
  const light = theme === 'light';

  const formatted =
    value == null
      ? '—'
      : format === 'currency'
        ? `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : Number(value).toLocaleString('en-US');

  return (
    <div className={`border rounded-xl p-4 ${colorClass} ${
      light ? 'bg-white shadow-sm' : 'bg-gray-900'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <p className={`text-[10px] font-semibold uppercase tracking-wider ${light ? 'text-gray-400' : 'text-gray-500'}`}>
          {label}
        </p>
        {Icon && <Icon className={`w-4 h-4 ${light ? 'text-gray-300' : 'text-gray-600'}`} />}
      </div>
      <p className={`text-xl font-bold ${light ? 'text-gray-900' : 'text-white'}`}>{formatted}</p>
    </div>
  );
}
