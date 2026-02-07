'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import HandcuffsIcon from './HandcuffsIcon';

const NAV_ITEMS = [
  { label: 'Cases', href: '/admin' },
  { label: 'Books', href: '/books' },
  { label: 'Calculator', href: '/app' },
  { label: 'Tracker', href: '/tracker' },
  { label: 'Quote', href: '/quote' },
];

export default function CommandBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/admin') return pathname.startsWith('/admin');
    if (href === '/books') return pathname.startsWith('/books');
    return pathname === href;
  }

  return (
    <nav className="bg-zinc-950 border-b border-zinc-800 h-10 flex items-center px-4 text-sm">
      <Link
        href="/command"
        className="flex items-center gap-1.5 text-[#d4af37] font-bold mr-4 hover:text-[#e5c55a] transition-colors"
      >
        <HandcuffsIcon className="w-4 h-4" />
        <span>Bail Command</span>
      </Link>
      <span className="text-zinc-700 mr-4">|</span>
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-2.5 py-1 rounded transition-colors ${
              isActive(item.href)
                ? 'text-[#d4af37] bg-[#d4af37]/10 font-medium'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
