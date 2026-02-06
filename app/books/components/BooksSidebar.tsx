'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  Building2,
  FileText,
  ArrowLeftRight,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

const NAV_ITEMS = [
  { href: '/books/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/books/banking', label: 'Banking', icon: Building2 },
  { href: '/books/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/books/chart-of-accounts', label: 'Chart of Accounts', icon: FileText },
  { href: '/books/ledger', label: 'Bond Ledger', icon: BookOpen },
  { href: '/books/payments', label: 'Payments', icon: CreditCard },
  { href: '/books/expenses', label: 'Expenses', icon: Receipt },
  { href: '/books/reports', label: 'Reports', icon: BarChart3 },
  { href: '/books/settings', label: 'Settings', icon: Settings },
];

export default function BooksSidebar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const light = theme === 'light';

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-56 flex-shrink-0 self-start sticky top-4">
        <nav className={`rounded-xl p-2 space-y-0.5 border ${
          light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'
        }`}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? light
                      ? 'bg-gray-100 text-[#b8962e] border-l-2 border-[#d4af37]'
                      : 'bg-gray-800 text-[#d4af37] border-l-2 border-[#d4af37]'
                    : light
                      ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile horizontal tabs */}
      <div className={`lg:hidden overflow-x-auto -mx-4 px-4 mb-4 sticky top-0 z-30 pb-2 pt-2 border-b ${
        light ? 'bg-gray-100 border-gray-200' : 'bg-gray-950 border-gray-800/50'
      }`}>
        <div className="flex gap-1 min-w-max">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? light
                      ? 'bg-white text-[#b8962e] border-b-2 border-[#d4af37] shadow-sm'
                      : 'bg-gray-800 text-[#d4af37] border-b-2 border-[#d4af37]'
                    : light
                      ? 'text-gray-500 hover:text-gray-900 hover:bg-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
