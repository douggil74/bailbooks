'use client';

import type { LucideIcon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const light = theme === 'light';

  return (
    <div className={`border rounded-xl p-12 text-center ${
      light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'
    }`}>
      <Icon className={`w-10 h-10 mx-auto mb-3 ${light ? 'text-gray-300' : 'text-gray-600'}`} />
      <h3 className={`font-semibold mb-1 ${light ? 'text-gray-900' : 'text-white'}`}>{title}</h3>
      <p className={`text-sm mb-4 ${light ? 'text-gray-500' : 'text-gray-400'}`}>{description}</p>
      {action}
    </div>
  );
}
