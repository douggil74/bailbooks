import BooksShell from './components/BooksShell';

export const metadata = {
  title: 'BailBooks — Accounting',
};

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return <BooksShell>{children}</BooksShell>;
}
