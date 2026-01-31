import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Start Your Application | BailMadeSimple',
  description: 'Complete your bail bond application online. Fast, secure, mobile-friendly.',
};

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-[#1a4d2e] text-white px-4 py-3 text-center">
        <h1 className="text-lg font-bold tracking-tight">BailMadeSimple</h1>
        <p className="text-xs text-green-200">Secure Online Application</p>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
