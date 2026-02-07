'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, DollarSign, Calculator, FileSearch, Send, Siren, ArrowRight } from 'lucide-react';
import HandcuffsIcon from './components/HandcuffsIcon';

const MODULES = [
  {
    label: 'Case Management',
    href: '/admin',
    icon: Shield,
    description: 'Manage cases, powers & defendants',
    gradient: 'from-violet-600/20 to-violet-900/5',
    border: 'border-violet-500/20 hover:border-violet-400/60',
    iconColor: 'text-violet-400',
    iconGlow: 'shadow-violet-500/25',
    ring: 'group-hover:ring-violet-400/30',
  },
  {
    label: 'BailBooks',
    href: '/books/dashboard',
    icon: DollarSign,
    description: 'Accounting & financial reports',
    gradient: 'from-emerald-600/20 to-emerald-900/5',
    border: 'border-emerald-500/20 hover:border-emerald-400/60',
    iconColor: 'text-emerald-400',
    iconGlow: 'shadow-emerald-500/25',
    ring: 'group-hover:ring-emerald-400/30',
  },
  {
    label: 'Bond Calculator',
    href: '/app',
    icon: Calculator,
    description: 'Calculate bond amounts & fees',
    gradient: 'from-blue-600/20 to-blue-900/5',
    border: 'border-blue-500/20 hover:border-blue-400/60',
    iconColor: 'text-blue-400',
    iconGlow: 'shadow-blue-500/25',
    ring: 'group-hover:ring-blue-400/30',
  },
  {
    label: 'Bond Tracker',
    href: '/tracker',
    icon: FileSearch,
    description: 'Track active bond status',
    gradient: 'from-amber-600/20 to-amber-900/5',
    border: 'border-amber-500/20 hover:border-amber-400/60',
    iconColor: 'text-amber-400',
    iconGlow: 'shadow-amber-500/25',
    ring: 'group-hover:ring-amber-400/30',
  },
  {
    label: 'Bail Quote',
    href: '/quote',
    icon: Send,
    description: 'Lead capture & instant quotes',
    gradient: 'from-cyan-600/20 to-cyan-900/5',
    border: 'border-cyan-500/20 hover:border-cyan-400/60',
    iconColor: 'text-cyan-400',
    iconGlow: 'shadow-cyan-500/25',
    ring: 'group-hover:ring-cyan-400/30',
  },
  {
    label: 'Recovery App',
    href: 'https://eliterecoveryla.com/software',
    icon: Siren,
    description: 'Mobile recovery operations',
    gradient: 'from-red-600/20 to-red-900/5',
    border: 'border-red-500/20 hover:border-red-400/60',
    iconColor: 'text-red-400',
    iconGlow: 'shadow-red-500/25',
    ring: 'group-hover:ring-red-400/30',
    external: true,
  },
];

export default function CommandPage() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    setMounted(true);
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* CSS animations */}
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes icon-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(212,175,55,0.4)); }
          50% { filter: drop-shadow(0 0 20px rgba(212,175,55,0.7)); }
        }
        @keyframes grid-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(60px); }
        }
        .animate-fade-up { animation: fade-up 0.7s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-icon-glow { animation: icon-glow 3s ease-in-out infinite; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
      `}</style>

      {/* Animated grid background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(212,175,55,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212,175,55,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            animation: 'grid-scroll 8s linear infinite',
          }}
        />
        {/* Radial glow behind header */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#d4af37]/[0.04] rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className={`relative flex flex-col items-center pt-14 sm:pt-20 pb-10 px-4 ${mounted ? '' : 'opacity-0'}`}>
        {/* Live clock badge */}
        <div className={`flex items-center gap-2 mb-8 opacity-0 ${mounted ? 'animate-fade-in' : ''}`}>
          <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-1.5 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-400 font-medium">{time}</span>
            <span className="text-zinc-700">|</span>
            <span className="text-xs text-zinc-500">St. Tammany Parish</span>
          </div>
        </div>

        {/* Logo */}
        <div className={`flex items-center gap-4 mb-4 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
          <div className="animate-icon-glow">
            <HandcuffsIcon className="w-12 h-12 sm:w-14 sm:h-14 text-[#d4af37]" />
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Bail <span className="text-[#d4af37]">Command</span>
            </h1>
          </div>
        </div>

        <p className={`text-zinc-500 text-sm tracking-wide uppercase font-medium opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
          Management Hub
        </p>
      </div>

      {/* Module Grid */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            const isExternal = !!mod.external;
            const Tag = isExternal ? 'a' : Link;
            const extra = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {};
            const delayClass = `delay-${(i + 1) * 100}`;

            return (
              <Tag
                key={mod.label}
                href={mod.href}
                {...(extra as Record<string, string>)}
                className={`group relative block bg-gradient-to-br ${mod.gradient} border ${mod.border} rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 ring-1 ring-transparent ${mod.ring} opacity-0 ${mounted ? `animate-fade-up ${delayClass}` : ''}`}
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-zinc-900/80 border border-white/5 flex items-center justify-center mb-5 shadow-lg ${mod.iconGlow} transition-shadow duration-300 group-hover:shadow-xl`}>
                  <Icon className={`w-7 h-7 ${mod.iconColor} transition-transform duration-300 group-hover:scale-110`} />
                </div>

                {/* Text */}
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  {mod.label}
                  {isExternal && (
                    <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold bg-zinc-800/80 px-1.5 py-0.5 rounded">ext</span>
                  )}
                </h2>
                <p className="text-sm text-zinc-500 leading-relaxed">{mod.description}</p>

                {/* Arrow */}
                <div className="absolute bottom-5 right-5 opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight className={`w-4 h-4 ${mod.iconColor}`} />
                </div>
              </Tag>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="relative border-t border-zinc-900 py-6">
        <div className="flex items-center justify-center gap-3 text-xs text-zinc-600">
          <Link href="/" className="hover:text-zinc-400 transition-colors">
            BailBonds Made Easy
          </Link>
          <span className="text-zinc-800">&middot;</span>
          <span>Louisiana Bail Agents</span>
        </div>
      </div>
    </div>
  );
}
