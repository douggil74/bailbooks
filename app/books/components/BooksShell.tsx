'use client';

import { useEffect, useState } from 'react';
import ThemeProvider, { useTheme } from './ThemeProvider';
import { OrgProvider } from './OrgContext';
import BooksHeader from './BooksHeader';
import BooksSidebar from './BooksSidebar';
import BooksFooter from './BooksFooter';
import CommandBar from '@/app/command/components/CommandBar';

const ORG_ID_KEY = 'bailbooks_org_id';

function ShellInner({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const light = theme === 'light';
  const [orgId, setOrgId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Auto-discover org if localStorage was cleared
  useEffect(() => {
    const stored = localStorage.getItem(ORG_ID_KEY);
    if (stored) {
      setOrgId(stored);
      setReady(true);
      return;
    }

    fetch('/api/books/org?discover=true')
      .then((r) => r.json())
      .then((d) => {
        if (d.organizations && d.organizations.length > 0) {
          const id = d.organizations[0].id;
          localStorage.setItem(ORG_ID_KEY, id);
          setOrgId(id);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Listen for org_id changes (e.g. Settings page creates new org)
  useEffect(() => {
    function handleStorage() {
      const current = localStorage.getItem(ORG_ID_KEY);
      if (current && current !== orgId) {
        setOrgId(current);
      }
    }
    window.addEventListener('storage', handleStorage);
    // Also poll for same-tab changes (storage event only fires cross-tab)
    const interval = setInterval(handleStorage, 1000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [orgId]);

  return (
    <OrgProvider orgId={orgId}>
      <div className={`min-h-screen flex flex-col ${light ? 'bg-gray-100 text-gray-900' : 'bg-[#0a0a0a] text-white'}`}>
        <CommandBar />
        <BooksHeader />
        <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
          <div className="flex gap-6">
            <BooksSidebar />
            <main className="flex-1 min-w-0">{ready ? children : null}</main>
          </div>
        </div>
        <BooksFooter />
      </div>
    </OrgProvider>
  );
}

export default function BooksShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ShellInner>{children}</ShellInner>
    </ThemeProvider>
  );
}
