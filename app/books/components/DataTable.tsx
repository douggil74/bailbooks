'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (row: T) => React.ReactNode;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DataTable<T extends Record<string, any> = Record<string, any>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data found',
}: {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const { theme } = useTheme();
  const light = theme === 'light';

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : data;

  if (data.length === 0) {
    return (
      <div className={`border rounded-xl p-8 text-center ${
        light ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'
      }`}>
        <p className={`text-sm ${light ? 'text-gray-400' : 'text-gray-400'}`}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl overflow-hidden ${
      light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'
    }`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${light ? 'border-gray-100' : 'border-gray-800'}`}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    light ? 'text-gray-400' : 'text-gray-500'
                  } ${
                    col.sortable ? `cursor-pointer select-none ${light ? 'hover:text-gray-700' : 'hover:text-gray-300'}` : ''
                  } ${col.className || ''}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${light ? 'divide-gray-50' : 'divide-gray-800/50'}`}>
            {sorted.map((row, i) => (
              <tr
                key={i}
                className={`transition-colors ${
                  onRowClick
                    ? `cursor-pointer ${light ? 'hover:bg-gray-50' : 'hover:bg-gray-800/50'}`
                    : ''
                }`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${light ? 'text-gray-700' : 'text-gray-300'} ${col.className || ''}`}>
                    {col.render ? col.render(row) : (row[col.key] as React.ReactNode) ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
