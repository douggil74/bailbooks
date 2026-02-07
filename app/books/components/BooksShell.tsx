'use client';

import ThemeProvider, { useTheme } from './ThemeProvider';
import BooksHeader from './BooksHeader';
import BooksSidebar from './BooksSidebar';
import BooksFooter from './BooksFooter';
import CommandBar from '@/app/command/components/CommandBar';

function ShellInner({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const light = theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col ${light ? 'bg-gray-100 text-gray-900' : 'bg-[#0a0a0a] text-white'}`}>
      <CommandBar />
      <BooksHeader />
      <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        <div className="flex gap-6">
          <BooksSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <BooksFooter />
    </div>
  );
}

export default function BooksShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ShellInner>{children}</ShellInner>
    </ThemeProvider>
  );
}
