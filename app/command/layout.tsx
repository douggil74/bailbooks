import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bail Command',
  description: 'Bail bond management hub',
};

export default function CommandLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
