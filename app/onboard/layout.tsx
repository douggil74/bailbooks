import type { Metadata } from 'next';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Start Your Application | BailBonds Made Easy',
  description: 'Complete your bail bond application online. Fast, secure, mobile-friendly.',
};

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-[#1a4d2e] text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-3">
          <Shield className="w-7 h-7 text-[#d4af37]" />
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              BailBonds <span className="text-[#d4af37]">Made Easy</span>
            </h1>
            <p className="text-xs text-green-200">Secure Online Application</p>
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
