'use client';

import React, { useState } from 'react';
import { Shield, Phone, Send, Check, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function QuotePage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bondAmount, setBondAmount] = useState('');
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setSubmitting(true);
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, bondAmount, message, urgency }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick estimate calculation
  const amt = parseFloat(bondAmount) || 0;
  const premium = amt * 0.12;
  const downPayment = premium * 0.5;

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Request Received!</h2>
          <p className="text-gray-400 mb-6">
            We'll call you back {urgency === 'urgent' ? 'immediately' : 'shortly'}. Keep your phone nearby.
          </p>
          <p className="text-[#d4af37] font-semibold mb-6">
            Need help right now? Call us directly:
          </p>
          <a
            href="tel:985-264-9519"
            className="inline-flex items-center gap-2 bg-[#d4af37] hover:bg-[#e5c55a] text-[#0a0a0a] font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <Phone className="w-5 h-5" />
            985-264-9519
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center py-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-[#d4af37]" />
            <span className="text-xl font-bold text-white">
              Bailbonds <span className="text-[#d4af37]">Financed</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Get a Free Quote</h1>
          <p className="text-gray-400">St. Tammany Parish, Louisiana</p>
        </div>

        {/* Urgency Toggle */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 mb-4">
          <p className="text-gray-400 text-sm mb-3">How urgent is your situation?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUrgency('normal')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-colors ${
                urgency === 'normal'
                  ? 'bg-[#1a4d2e] text-white border-2 border-green-500'
                  : 'bg-white/5 text-gray-400 border border-white/10'
              }`}
            >
              <Clock className="w-4 h-4" />
              Normal
            </button>
            <button
              type="button"
              onClick={() => setUrgency('urgent')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-colors ${
                urgency === 'urgent'
                  ? 'bg-red-500/20 text-red-400 border-2 border-red-500'
                  : 'bg-white/5 text-gray-400 border border-white/10'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Urgent
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 mb-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Your Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
                className="w-full bg-[#0a0a0a] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(985) 555-1234"
                required
                className="w-full bg-[#0a0a0a] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Bond Amount (if known)</label>
              <input
                type="number"
                value={bondAmount}
                onChange={(e) => setBondAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-[#0a0a0a] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Additional Details</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Who is this for? Which jail? Any details that help us..."
                rows={3}
                className="w-full bg-[#0a0a0a] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !name || !phone}
              className="w-full flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#e5c55a] text-[#0a0a0a] font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {submitting ? 'Sending...' : 'Get My Free Quote'}
            </button>
          </div>
        </form>

        {/* Quick Estimate */}
        {amt > 0 && (
          <div className="bg-[#1a4d2e] border border-green-500/30 rounded-2xl p-5 mb-4">
            <h3 className="text-white font-semibold mb-3">Quick Estimate</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Bond Amount:</span>
                <span className="text-white font-semibold">${amt.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">12% Premium:</span>
                <span className="text-white font-semibold">${premium.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-2 mt-2">
                <span className="text-[#d4af37]">Est. Down Payment (50%):</span>
                <span className="text-[#d4af37] font-bold">${downPayment.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">* Final amounts may vary. Payment plans available.</p>
            <p className="text-xs text-gray-300 italic mt-2">Payment arrangements and discounts available upon interview.</p>
          </div>
        )}

        {/* Call Now */}
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-3">Need help right now?</p>
          <a
            href="tel:985-264-9519"
            className="inline-flex items-center gap-2 text-[#d4af37] hover:text-[#e5c55a] font-semibold"
          >
            <Phone className="w-5 h-5" />
            Call or Text: 985-264-9519
          </a>
        </div>

        {/* Trust Signals */}
        <div className="mt-8 text-center text-gray-500 text-xs">
          <p>Licensed Louisiana Bail Bond Agent</p>
          <p>Affiliate of Louisiana Bail Agents</p>
          <p className="mt-2">Available 24/7 • Fast Response • Payment Plans</p>
        </div>
      </div>
    </div>
  );
}
