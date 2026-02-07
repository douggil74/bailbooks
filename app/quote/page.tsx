'use client';

import React, { useState } from 'react';
import { Shield, Phone, Send, Check, Clock, AlertTriangle, MessageSquare } from 'lucide-react';
import CommandBar from '@/app/command/components/CommandBar';

export default function QuotePage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bondAmount, setBondAmount] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Quick estimate
  const amt = parseFloat(bondAmount) || 0;
  const premium = amt * 0.12;
  const downPayment = premium * 0.5;

  const fmt = (n: number) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const sendTextQuote = async () => {
    if (!name || !phone || !bondAmount) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/quote/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, bond_amount: bondAmount, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send quote');
      } else {
        setSent(true);
      }
    } catch {
      setError('Network error');
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setName('');
    setPhone('');
    setBondAmount('');
    setMessage('');
    setSent(false);
    setError('');
  };

  // Also keep the old lead submission for email notification
  const submitLead = async () => {
    if (!name || !phone) return;
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, bondAmount, message, urgency: 'normal' }),
      });
    } catch { /* silent */ }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <CommandBar />
        <div className="flex items-center justify-center p-4 pt-20">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Quote Sent!</h2>
            <p className="text-gray-400 mb-2">
              Text quote sent to <span className="text-white font-medium">{name}</span> at <span className="text-white font-medium">{phone}</span>
            </p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 my-4 text-left text-sm">
              <p className="text-zinc-400 mb-1">Bond: <span className="text-white">{fmt(amt)}</span></p>
              <p className="text-zinc-400 mb-1">Premium: <span className="text-white">{fmt(premium)}</span></p>
              <p className="text-[#d4af37]">Down Payment: <span className="font-bold">{fmt(downPayment)}</span></p>
            </div>
            <p className="text-sm text-zinc-500 mb-6">
              When they reply <span className="text-green-400 font-bold">YES</span>, a case will auto-create in Case Management.
            </p>
            <button
              onClick={reset}
              className="w-full bg-[#d4af37] hover:bg-[#e5c55a] text-[#0a0a0a] font-bold py-3 rounded-xl transition-colors"
            >
              Send Another Quote
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <CommandBar />
      <div className="max-w-lg mx-auto p-4">
        {/* Header */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <Send className="w-6 h-6 text-[#d4af37]" />
            <span className="text-xl font-bold text-white">
              Bail <span className="text-[#d4af37]">Quote</span>
            </span>
          </div>
          <p className="text-gray-400 text-sm">Send a text quote to a prospective client</p>
        </div>

        {/* Form */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 mb-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Client Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full bg-[#0a0a0a] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(985) 555-1234"
                  className="w-full bg-[#0a0a0a] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Bond Amount *</label>
              <input
                type="number"
                value={bondAmount}
                onChange={(e) => setBondAmount(e.target.value)}
                placeholder="Enter bond amount"
                className="w-full bg-[#0a0a0a] border border-white/20 rounded-xl px-4 py-3 text-white text-xl font-bold focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Notes (agent only, not sent)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Which jail? Charges? Any context..."
                rows={2}
                className="w-full bg-[#0a0a0a] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        {amt > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-zinc-500" />
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Text Preview</span>
            </div>
            <div className="bg-[#1a4d2e] rounded-xl rounded-tl-none p-3 text-sm text-white leading-relaxed">
              <p>Hi {name.split(' ')[0] || '___'}, here&apos;s your bail bond quote from BailBonds Made Easy:</p>
              <p className="mt-2">
                Bond Amount: {fmt(amt)}<br />
                Premium (12%): {fmt(premium)}<br />
                Est. Down Payment: {fmt(downPayment)}
              </p>
              <p className="mt-2">Payment plans available. Reply YES to proceed or call 985-264-9519.</p>
            </div>
            <p className="text-[10px] text-zinc-600 mt-2">
              Sent via SignalWire from {process.env.NEXT_PUBLIC_SIGNALWIRE_NUMBER || '(985) 236-6515'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 mb-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => { sendTextQuote(); submitLead(); }}
            disabled={sending || !name || !phone || !bondAmount}
            className="flex-1 flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#e5c55a] text-[#0a0a0a] font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            {sending ? 'Sending...' : 'Text Quote to Client'}
          </button>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-3">
          Client replies <span className="text-green-400">YES</span> → case auto-created → you get notified
        </p>

        {/* Call Now */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm mb-2">Or call the client directly:</p>
          <a
            href="tel:985-264-9519"
            className="inline-flex items-center gap-2 text-[#d4af37] hover:text-[#e5c55a] font-semibold"
          >
            <Phone className="w-4 h-4" />
            985-264-9519
          </a>
        </div>
      </div>
    </div>
  );
}
