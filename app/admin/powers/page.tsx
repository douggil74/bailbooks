'use client';

import { useState, useEffect, useMemo } from 'react';
import { Shield } from 'lucide-react';

interface PowerRow {
  id: string;
  power_number: string;
  amount: number;
  surety: string;
  status: 'open' | 'active' | 'voided';
  application_id: string | null;
  assigned_at: string | null;
  created_at: string;
  defendant_name: string | null;
}

const STATUS_FILTERS = ['all', 'open', 'active', 'voided'] as const;

function statusBadge(status: string) {
  switch (status) {
    case 'open':
      return 'bg-green-900/60 text-green-400';
    case 'active':
      return 'bg-blue-900/60 text-blue-400';
    case 'voided':
      return 'bg-gray-700 text-gray-400';
    default:
      return 'bg-gray-700 text-gray-400';
  }
}

export default function PowersPage() {
  const [powers, setPowers] = useState<PowerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newSurety, setNewSurety] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [recentlyAdded, setRecentlyAdded] = useState<PowerRow[]>([]);

  async function fetchPowers() {
    try {
      const res = await fetch('/api/admin/powers');
      const data = await res.json();
      setPowers(data.powers || []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    fetchPowers();
  }, []);

  async function addPower() {
    if (!newNumber.trim() || !newAmount.trim() || !newSurety.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      const res = await fetch('/api/admin/powers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          power_number: newNumber.trim(),
          amount: parseFloat(newAmount),
          surety: newSurety.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Failed to add power');
        setAdding(false);
        return;
      }
      setRecentlyAdded((prev) => [data.power, ...prev]);
      setPowers((prev) => [data.power, ...prev]);
      setNewNumber('');
      setNewAmount('');
    } catch {
      setAddError('Network error');
    }
    setAdding(false);
  }

  async function voidPower(id: string) {
    await fetch('/api/admin/powers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchPowers();
  }

  const filtered = useMemo(() => {
    return powers.filter((p) => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesSearch =
        !search || p.power_number.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [powers, statusFilter, search]);

  const stats = useMemo(() => {
    return {
      total: powers.length,
      open: powers.filter((p) => p.status === 'open').length,
      active: powers.filter((p) => p.status === 'active').length,
    };
  }, [powers]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-[#1a4d2e] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-[#d4af37]" />
          <div>
            <h1 className="text-xl font-bold">
              BailBonds <span className="text-[#d4af37]">Made Easy</span>{' '}
              <span className="text-green-200 font-normal text-base">
                — Power Management
              </span>
            </h1>
            <p className="text-sm text-green-200">Power Inventory System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setShowModal(true);
              setRecentlyAdded([]);
              setAddError('');
            }}
            className="bg-[#d4af37] text-[#0a0a0a] text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#e5c55a] transition-colors"
          >
            + Load Power
          </button>
          <a
            href="/admin"
            className="text-sm text-green-200 underline"
          >
            Cases
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-400 mt-1">Total Powers</p>
          </div>
          <div className="bg-gray-900 border border-green-900/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.open}</p>
            <p className="text-xs text-gray-400 mt-1">Open</p>
          </div>
          <div className="bg-gray-900 border border-blue-900/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.active}</p>
            <p className="text-xs text-gray-400 mt-1">Active</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by power number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1a4d2e]"
          />
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-[#1a4d2e] text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Powers List */}
        {loading ? (
          <p className="text-gray-400">Loading powers...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400">No powers found.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-sm text-white">
                      {p.power_number}
                    </p>
                    <span className="text-xs text-gray-400">{p.surety}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusBadge(p.status)}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  {p.status === 'active' && p.defendant_name && (
                    <a
                      href={`/admin/case/${p.application_id}`}
                      className="text-xs text-blue-400 hover:text-blue-300 mt-0.5 inline-block"
                    >
                      {p.defendant_name}
                    </a>
                  )}
                </div>

                <span className="text-sm font-bold text-teal-400 tabular-nums">
                  ${Number(p.amount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>

                {p.status === 'open' && (
                  <button
                    onClick={() => voidPower(p.id)}
                    className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
                  >
                    Void
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Load Power Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">Load Power</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Power Number"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                autoFocus
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
              <input
                type="text"
                placeholder="Surety / Agency"
                value={newSurety}
                onChange={(e) => setNewSurety(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPower()}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>
            {addError && (
              <p className="text-sm text-red-400 mt-2">{addError}</p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm"
              >
                Done
              </button>
              <button
                onClick={addPower}
                disabled={
                  adding ||
                  !newNumber.trim() ||
                  !newAmount.trim() ||
                  !newSurety.trim()
                }
                className="flex-1 px-4 py-2.5 bg-[#d4af37] text-[#0a0a0a] font-bold rounded-lg hover:bg-[#e5c55a] transition-colors text-sm disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>

            {/* Recently added */}
            {recentlyAdded.length > 0 && (
              <div className="mt-4 border-t border-gray-800 pt-3">
                <p className="text-xs text-gray-500 mb-2">Just added:</p>
                <div className="space-y-1">
                  {recentlyAdded.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs bg-gray-800/50 rounded-lg px-3 py-2"
                    >
                      <span className="text-white font-medium">
                        {p.power_number}
                      </span>
                      <span className="text-gray-400">{p.surety}</span>
                      <span className="text-teal-400 font-bold">
                        ${Number(p.amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
