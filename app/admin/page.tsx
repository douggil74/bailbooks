'use client';

import { useState, useEffect, useMemo } from 'react';
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
  defendant_status: ActivityStatus;
  indemnitor_status: ActivityStatus;
}

const STATUS_OPTIONS = ['all', 'draft', 'submitted', 'approved', 'active', 'completed'] as const;

function caseStatusBadge(status: string) {
  const styles: Record<string, string> = {
    submitted: 'bg-yellow-900 text-yellow-300',
    approved: 'bg-green-900 text-green-300',
    active: 'bg-blue-900 text-blue-300',
    completed: 'bg-gray-700 text-gray-300',
    draft: 'bg-gray-800 text-gray-400',
  };
  return styles[status] || styles.draft;
}

function DateBadge({ dateStr, status }: { dateStr: string | null; status: string }) {
  const date = dateStr ? new Date(dateStr + 'T00:00:00') : null;
  const month = date
    ? date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    : '—';
  const day = date ? date.getDate() : '—';

  const bgColor =
    status === 'completed'
      ? 'bg-gray-700'
      : status === 'active' || status === 'approved'
        ? 'bg-[#1a4d2e]'
        : status === 'submitted'
          ? 'bg-yellow-800'
          : 'bg-gray-800';

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
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewCase, setShowNewCase] = useState(false);
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/admin/applications')
      .then((r) => r.json())
      .then((data) => {
        setApps(data.applications || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-[#1a4d2e] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">BailMadeSimple — Agent Control Panel</h1>
          <p className="text-sm text-green-200">Case Management Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowNewCase(true)}
            className="bg-[#d4af37] text-[#0a0a0a] text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#e5c55a] transition-colors"
          >
            + New Case
          </button>
          <a href="/" className="text-sm text-green-200 underline">
            Back to Site
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-400 mt-1">Total Cases</p>
          </div>
          <div className="bg-gray-900 border border-yellow-900/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.submitted}</p>
            <p className="text-xs text-gray-400 mt-1">Submitted</p>
          </div>
          <div className="bg-gray-900 border border-blue-900/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.active}</p>
            <p className="text-xs text-gray-400 mt-1">Active</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-400">{stats.completed}</p>
            <p className="text-xs text-gray-400 mt-1">Completed</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1a4d2e]"
          />
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
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

        {/* Customer Management Header */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#d4af37]">Customer Management</h2>
          <p className="text-sm text-gray-400">
            Manage customers, communications, and their status in the bail bond process.
          </p>
        </div>

        {/* Case Cards */}
        {loading ? (
          <p className="text-gray-400">Loading cases...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400">No cases match your criteria.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <a
                key={app.id}
                href={`/admin/case/${app.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 hover:bg-gray-900/80 transition-colors"
              >
                {/* Desktop layout */}
                <div className="hidden sm:flex items-center gap-4">
                  <DateBadge
                    dateStr={app.bond_date || app.created_at?.split('T')[0]}
                    status={app.status}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white truncate">
                      {app.defendant_first} {app.defendant_last}
                    </p>
                    <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 mt-0.5">
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
                    <span className="text-sm font-medium text-gray-300 w-28 text-right">
                      ${Number(app.bond_amount).toLocaleString()}
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
                      <p className="font-bold text-sm text-white truncate">
                        {app.defendant_first} {app.defendant_last}
                      </p>
                      <div className="flex flex-wrap gap-x-2 text-xs text-gray-500 mt-0.5">
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
            ))}
          </div>
        )}
      </main>

      {showNewCase && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowNewCase(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm"
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
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
              <input
                type="text"
                placeholder="Last name"
                value={newLast}
                onChange={(e) => setNewLast(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createCase()}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowNewCase(false)}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createCase}
                disabled={creating || !newFirst.trim() || !newLast.trim()}
                className="flex-1 px-4 py-2.5 bg-[#d4af37] text-[#0a0a0a] font-bold rounded-lg hover:bg-[#e5c55a] transition-colors text-sm disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
