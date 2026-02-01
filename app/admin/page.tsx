'use client';

import { useState, useEffect, useMemo } from 'react';
import { Shield } from 'lucide-react';
import StatusBadge from './components/StatusBadge';
import type { ActivityStatus } from '@/lib/bail-types';

interface AppRow {
  id: string;
  status: string;
  defendant_first: string;
  defendant_last: string;
  defendant_phone: string | null;
  defendant_email: string | null;
  bond_amount: number | null;
  charge_description: string | null;
  court_date: string | null;
  court_name: string | null;
  county: string | null;
  bond_date: string | null;
  premium: number | null;
  down_payment: number | null;
  created_at: string;
  checkin_frequency: string | null;
  updated_at: string | null;
  power_number: string | null;
  defendant_status: ActivityStatus;
  indemnitor_status: ActivityStatus;
}

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

const STATUS_OPTIONS = ['all', 'draft', 'submitted', 'approved', 'active', 'completed'] as const;
const POWER_STATUS_FILTERS = ['all', 'open', 'active', 'voided'] as const;

function caseStatusBadge(status: string) {
  const styles: Record<string, string> = {
    submitted: 'bg-yellow-900 text-yellow-300',
    approved: 'bg-green-900 text-green-300',
    active: 'bg-violet-900 text-violet-300',
    completed: 'bg-zinc-700 text-zinc-300',
    draft: 'bg-zinc-800 text-zinc-400',
  };
  return styles[status] || styles.draft;
}

function powerStatusBadge(status: string) {
  switch (status) {
    case 'open':
      return 'bg-green-900/60 text-green-400';
    case 'active':
      return 'bg-violet-900/60 text-violet-400';
    case 'voided':
      return 'bg-zinc-700 text-zinc-400';
    default:
      return 'bg-zinc-700 text-zinc-400';
  }
}

function DateBadge({ dateStr, status }: { dateStr: string | null; status: string }) {
  const date = dateStr ? new Date(dateStr + 'T00:00:00') : null;
  const month = date
    ? date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    : '—';
  const day = date ? date.getDate() : '—';

  const bgColor =
    status === 'completed'
      ? 'bg-zinc-700'
      : status === 'active' || status === 'approved'
        ? 'bg-violet-900/60'
        : status === 'submitted'
          ? 'bg-yellow-800'
          : 'bg-zinc-800';

  return (
    <div
      className={`${bgColor} rounded-lg w-14 h-14 flex flex-col items-center justify-center flex-shrink-0`}
    >
      <span className="text-[10px] font-bold tracking-wider text-white/70">{month}</span>
      <span className="text-lg font-bold text-white leading-none">{day}</span>
    </div>
  );
}

export default function AdminPage() {
  // Cases state
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewCase, setShowNewCase] = useState(false);
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [creating, setCreating] = useState(false);

  // Powers state
  const [powers, setPowers] = useState<PowerRow[]>([]);
  const [powersLoading, setPowersLoading] = useState(true);
  const [powerStatusFilter, setPowerStatusFilter] = useState<string>('all');
  const [powerSearch, setPowerSearch] = useState('');
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newSurety, setNewSurety] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [recentlyAdded, setRecentlyAdded] = useState<PowerRow[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');

  useEffect(() => {
    fetch('/api/admin/applications')
      .then((r) => r.json())
      .then((data) => {
        setApps(data.applications || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function fetchPowers() {
    try {
      const res = await fetch('/api/admin/powers');
      const data = await res.json();
      setPowers(data.powers || []);
    } catch { /* ignore */ }
    setPowersLoading(false);
  }

  useEffect(() => {
    fetchPowers();
  }, []);

  async function createCase() {
    const first = newFirst.trim();
    const last = newLast.trim();
    if (!first || !last) return;
    setCreating(true);
    try {
      const res = await fetch('/api/onboard/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defendant_first: first, defendant_last: last }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        window.location.href = `/admin/case/${data.id}`;
        return;
      }
    } catch {
      // network error
    }
    setCreating(false);
  }

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

  async function extractFromFile(file: File) {
    setExtracting(true);
    setExtractError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/powers/extract', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setExtractError(data.error || 'Extraction failed');
        setExtracting(false);
        return;
      }
      if (data.power_number) setNewNumber(data.power_number);
      if (data.amount != null) setNewAmount(String(data.amount));
      if (data.surety) setNewSurety(data.surety);
    } catch {
      setExtractError('Network error during extraction');
    }
    setExtracting(false);
  }

  const filtered = useMemo(() => {
    return apps.filter((app) => {
      const name = `${app.defendant_first} ${app.defendant_last}`.toLowerCase();
      const matchesSearch = !search || name.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [apps, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: apps.length,
      submitted: apps.filter((a) => a.status === 'submitted').length,
      active: apps.filter((a) => a.status === 'active' || a.status === 'approved').length,
      completed: apps.filter((a) => a.status === 'completed').length,
    };
  }, [apps]);

  const filteredPowers = useMemo(() => {
    return powers.filter((p) => {
      const matchesStatus = powerStatusFilter === 'all' || p.status === powerStatusFilter;
      const matchesSearch =
        !powerSearch || p.power_number.toLowerCase().includes(powerSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [powers, powerStatusFilter, powerSearch]);

  const powerStats = useMemo(() => {
    return {
      total: powers.length,
      open: powers.filter((p) => p.status === 'open').length,
      active: powers.filter((p) => p.status === 'active').length,
    };
  }, [powers]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="bg-[#18181b] border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-[#fbbf24]" />
          <div>
            <h1 className="text-xl font-bold">BailBonds <span className="text-[#fbbf24]">Made Easy</span> <span className="text-zinc-500 font-normal text-base">— Agent Control Panel</span></h1>
            <p className="text-sm text-violet-400">Case Management Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowNewCase(true)}
            className="bg-[#fbbf24] text-[#0a0a0a] text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#fcd34d] transition-colors"
          >
            + New Case
          </button>
          <a href="/" className="text-sm text-zinc-400 underline">
            Back to Site
          </a>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* ── Left Column: Cases ── */}
          <div className="flex-1 min-w-0">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-zinc-400 mt-1">Total Cases</p>
              </div>
              <div className="bg-zinc-900 border border-yellow-900/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-yellow-400">{stats.submitted}</p>
                <p className="text-xs text-zinc-400 mt-1">Submitted</p>
              </div>
              <div className="bg-zinc-900 border border-violet-900/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-violet-400">{stats.active}</p>
                <p className="text-xs text-zinc-400 mt-1">Active</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-zinc-400">{stats.completed}</p>
                <p className="text-xs text-zinc-400 mt-1">Completed</p>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"
              />
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      statusFilter === s
                        ? 'bg-[#fbbf24] text-[#0a0a0a]'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Management Header */}
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[#fbbf24]">Customer Management</h2>
              <p className="text-sm text-zinc-400">
                Manage customers, communications, and their status in the bail bond process.
              </p>
            </div>

            {/* Case Cards */}
            {loading ? (
              <p className="text-zinc-400">Loading cases...</p>
            ) : filtered.length === 0 ? (
              <p className="text-zinc-400">No cases match your criteria.</p>
            ) : (
              <div className="space-y-3">
                {filtered.map((app) => {
                  const needsAttention = app.indemnitor_status === 'pending' || app.indemnitor_status === 'request_sent';
                  return (
                  <a
                    key={app.id}
                    href={`/admin/case/${app.id}`}
                    className={`block bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 hover:bg-zinc-900/80 transition-colors ${
                      needsAttention ? 'border-l-2 border-l-orange-500' : ''
                    }`}
                  >
                    {/* Desktop layout */}
                    <div className="hidden sm:flex items-center gap-4">
                      <DateBadge
                        dateStr={app.bond_date || app.created_at?.split('T')[0]}
                        status={app.status}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white truncate">
                            {app.defendant_first} {app.defendant_last}
                          </p>
                          {app.power_number && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-900/60 text-teal-400 border border-teal-800/50 whitespace-nowrap">
                              {app.power_number}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 text-xs text-zinc-500 mt-0.5">
                          {app.county && <span>County: {app.county}</span>}
                          {!app.county && app.court_name && <span>{app.court_name}</span>}
                          {app.bond_date && (
                            <span>
                              Bond Date:{' '}
                              {new Date(app.bond_date + 'T00:00:00').toLocaleDateString()}
                            </span>
                          )}
                          {!app.bond_date && app.court_date && (
                            <span>
                              Court:{' '}
                              {new Date(app.court_date + 'T00:00:00').toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${caseStatusBadge(app.status)}`}
                      >
                        {app.status}
                      </span>

                      {app.bond_amount && (
                        <span className="text-sm font-bold text-white w-24 text-right tabular-nums">
                          ${Number(app.bond_amount).toLocaleString()}
                        </span>
                      )}

                      {needsAttention && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-900/60 text-orange-400 border border-orange-800/50 whitespace-nowrap">
                          {app.indemnitor_status === 'request_sent' ? 'Awaiting Response' : 'Indemnitor Pending'}
                        </span>
                      )}

                      <div className="flex gap-2">
                        <StatusBadge label="Indemnitor" status={app.indemnitor_status} />
                        <StatusBadge label="Defendant" status={app.defendant_status} />
                      </div>
                    </div>

                    {/* Mobile layout */}
                    <div className="sm:hidden">
                      <div className="flex items-start gap-3 mb-3">
                        <DateBadge
                          dateStr={app.bond_date || app.created_at?.split('T')[0]}
                          status={app.status}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-white truncate">
                              {app.defendant_first} {app.defendant_last}
                            </p>
                            {app.power_number && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-900/60 text-teal-400 border border-teal-800/50 whitespace-nowrap">
                                {app.power_number}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-2 text-xs text-zinc-500 mt-0.5">
                            {app.county && <span>{app.county}</span>}
                            {app.bond_amount && (
                              <span>${Number(app.bond_amount).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${caseStatusBadge(app.status)}`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <StatusBadge label="Indemnitor" status={app.indemnitor_status} />
                        <StatusBadge label="Defendant" status={app.defendant_status} />
                      </div>
                    </div>
                  </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right Column: Powers ── */}
          <div className="w-[420px] flex-shrink-0 hidden lg:block">
            <div className="sticky top-6">
              {/* Powers Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#fbbf24]">Powers</h2>
                <button
                  onClick={() => {
                    setShowPowerModal(true);
                    setRecentlyAdded([]);
                    setAddError('');
                    setExtractError('');
                  }}
                  className="bg-[#fbbf24] text-[#0a0a0a] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#fcd34d] transition-colors"
                >
                  + Load Power
                </button>
              </div>

              {/* Power Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-white">{powerStats.total}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Total</p>
                </div>
                <div className="bg-zinc-900 border border-green-900/50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-green-400">{powerStats.open}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Open</p>
                </div>
                <div className="bg-zinc-900 border border-violet-900/50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-violet-400">{powerStats.active}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Active</p>
                </div>
              </div>

              {/* Power Search & Filter */}
              <div className="space-y-2 mb-4">
                <input
                  type="text"
                  placeholder="Search powers..."
                  value={powerSearch}
                  onChange={(e) => setPowerSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"
                />
                <div className="flex gap-2">
                  {POWER_STATUS_FILTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setPowerStatusFilter(s)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        powerStatusFilter === s
                          ? 'bg-[#fbbf24] text-[#0a0a0a]'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Powers List */}
              <div className="max-h-[calc(100vh-340px)] overflow-y-auto space-y-2 pr-1">
                {powersLoading ? (
                  <p className="text-zinc-400 text-sm">Loading powers...</p>
                ) : filteredPowers.length === 0 ? (
                  <p className="text-zinc-400 text-sm">No powers found.</p>
                ) : (
                  filteredPowers.map((p) => (
                    <div
                      key={p.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center gap-3 hover:border-zinc-600 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white">
                            {p.power_number}
                          </p>
                          <span className="text-xs text-zinc-400 truncate">{p.surety}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${powerStatusBadge(p.status)}`}
                          >
                            {p.status}
                          </span>
                        </div>
                        {p.status === 'active' && p.defendant_name && (
                          <a
                            href={`/admin/case/${p.application_id}`}
                            className="text-xs text-violet-400 hover:text-violet-300 mt-0.5 inline-block"
                          >
                            {p.defendant_name}
                          </a>
                        )}
                      </div>

                      <span className="text-sm font-bold text-teal-400 tabular-nums whitespace-nowrap">
                        ${Number(p.amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>

                      {p.status === 'open' && (
                        <button
                          onClick={() => voidPower(p.id)}
                          className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          Void
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* New Case Modal */}
      {showNewCase && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowNewCase(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">New Case</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="First name"
                value={newFirst}
                onChange={(e) => setNewFirst(e.target.value)}
                autoFocus
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"
              />
              <input
                type="text"
                placeholder="Last name"
                value={newLast}
                onChange={(e) => setNewLast(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createCase()}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowNewCase(false)}
                className="flex-1 px-4 py-2.5 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createCase}
                disabled={creating || !newFirst.trim() || !newLast.trim()}
                className="flex-1 px-4 py-2.5 bg-[#fbbf24] text-[#0a0a0a] font-bold rounded-lg hover:bg-[#fcd34d] transition-colors text-sm disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Power Modal */}
      {showPowerModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPowerModal(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">Load Power</h3>

            {/* Document Scanner */}
            <label className={`block border-2 border-dashed rounded-xl p-4 mb-4 text-center cursor-pointer transition-colors ${
              extracting
                ? 'border-[#fbbf24]/50 bg-[#fbbf24]/5'
                : 'border-zinc-700 hover:border-zinc-500'
            }`}>
              {extracting ? (
                <div className="flex items-center justify-center gap-2 text-[#fbbf24]">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span className="text-sm font-medium">Scanning document...</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-zinc-400">Upload power document to auto-fill</p>
                  <p className="text-xs text-zinc-600 mt-1">Photo or PDF</p>
                </>
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                disabled={extracting}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) extractFromFile(file);
                  e.target.value = '';
                }}
              />
            </label>
            {extractError && (
              <p className="text-sm text-red-400 mb-3">{extractError}</p>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Power Number"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                autoFocus
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"
              />
              <input
                type="text"
                placeholder="Surety / Agency"
                value={newSurety}
                onChange={(e) => setNewSurety(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPower()}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"
              />
            </div>
            {addError && (
              <p className="text-sm text-red-400 mt-2">{addError}</p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowPowerModal(false)}
                className="flex-1 px-4 py-2.5 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors text-sm"
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
                className="flex-1 px-4 py-2.5 bg-[#fbbf24] text-[#0a0a0a] font-bold rounded-lg hover:bg-[#fcd34d] transition-colors text-sm disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>

            {/* Recently added */}
            {recentlyAdded.length > 0 && (
              <div className="mt-4 border-t border-zinc-800 pt-3">
                <p className="text-xs text-zinc-500 mb-2">Just added:</p>
                <div className="space-y-1">
                  {recentlyAdded.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs bg-zinc-800/50 rounded-lg px-3 py-2"
                    >
                      <span className="text-white font-medium">
                        {p.power_number}
                      </span>
                      <span className="text-zinc-400">{p.surety}</span>
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
