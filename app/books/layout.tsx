import Link from 'next/link';
import BooksSidebar from './components/BooksSidebar';

export const metadata = {
  title: 'BailBooks — Accounting',
};

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#1a4d2e] border-b border-[#1a4d2e]/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/books/dashboard" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#d4af37] flex items-center justify-center text-[#0a0a0a] font-black text-lg">$</span>
            <span className="text-lg font-bold text-white">BailBooks</span>
            <span className="text-xs bg-white/20 text-white/80 px-2 py-0.5 rounded-full font-medium">
              Accounting
            </span>
          </Link>
          <Link
            href="/admin"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Back to Admin
          </Link>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <BooksSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
