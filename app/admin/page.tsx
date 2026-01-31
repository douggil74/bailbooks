'use client';

import { useState, useEffect, useMemo } from 'react';

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
  created_at: string;
  checkin_frequency: string | null;
  updated_at: string | null;
}

const STATUS_OPTIONS = ['all', 'draft', 'submitted', 'approved', 'active', 'completed'] as const;

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    submitted: 'bg-yellow-900 text-yellow-300',
    approved: 'bg-green-900 text-green-300',
    active: 'bg-blue-900 text-blue-300',
    completed: 'bg-gray-700 text-gray-300',
    draft: 'bg-gray-800 text-gray-400',
  };
  return styles[status] || styles.draft;
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

        {/* Table */}
        {loading ? (
          <p className="text-gray-400">Loading cases...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400">No cases match your criteria.</p>
        ) : (
          <>
            {/* Desktop table header */}
            <div className="hidden lg:grid grid-cols-[1fr_120px_120px_100px_110px_110px_100px] gap-4 px-5 py-2 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-800 mb-1">
              <span>Name / Phone</span>
              <span>Bond Amount</span>
              <span>Status</span>
              <span>Court Date</span>
              <span>Last Activity</span>
              <span>Frequency</span>
              <span></span>
            </div>

            <div className="space-y-2">
              {filtered.map((app) => (
                <div
                  key={app.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 lg:p-5 hover:border-gray-600 transition-colors"
                >
                  {/* Desktop row */}
                  <div className="hidden lg:grid grid-cols-[1fr_120px_120px_100px_110px_110px_100px] gap-4 items-center">
                    <a
                      href={`/admin/case/${app.id}`}
                      className="hover:text-[#d4af37] transition-colors"
                    >
                      <p className="font-bold text-sm">
                        {app.defendant_first} {app.defendant_last}
                      </p>
                      <p className="text-xs text-gray-500">
                        {app.defendant_phone || 'No phone'}
                      </p>
                    </a>
                    <span className="text-sm">
                      {app.bond_amount
                        ? `$${Number(app.bond_amount).toLocaleString()}`
                        : '—'}
                    </span>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full w-fit ${statusBadge(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                    <span className="text-sm text-gray-400">
                      {app.court_date
                        ? new Date(app.court_date + 'T00:00:00').toLocaleDateString()
                        : '—'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {app.updated_at
                        ? new Date(app.updated_at).toLocaleDateString()
                        : new Date(app.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">
                      {app.checkin_frequency || '—'}
                    </span>
                    <a
                      href={`/api/onboard/generate-pdf?id=${app.id}`}
                      target="_blank"
                      className="bg-[#d4af37] text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#e5c55a] transition-colors text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      PDF
                    </a>
                  </div>

                  {/* Mobile card */}
                  <div className="lg:hidden">
                    <div className="flex items-start justify-between mb-2">
                      <a
                        href={`/admin/case/${app.id}`}
                        className="hover:text-[#d4af37] transition-colors"
                      >
                        <p className="font-bold">
                          {app.defendant_first} {app.defendant_last}
                        </p>
                        <p className="text-xs text-gray-500">
                          {app.defendant_phone || 'No phone'}
                        </p>
                      </a>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${statusBadge(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
                      {app.bond_amount && (
                        <span>Bond: ${Number(app.bond_amount).toLocaleString()}</span>
                      )}
                      {app.court_date && (
                        <span>
                          Court: {new Date(app.court_date + 'T00:00:00').toLocaleDateString()}
                        </span>
                      )}
                      {app.checkin_frequency && (
                        <span className="capitalize">{app.checkin_frequency}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/admin/case/${app.id}`}
                        className="flex-1 bg-gray-800 text-white text-xs font-semibold px-3 py-2 rounded-lg text-center hover:bg-gray-700 transition-colors"
                      >
                        View Case
                      </a>
                      <a
                        href={`/api/onboard/generate-pdf?id=${app.id}`}
                        target="_blank"
                        className="bg-[#d4af37] text-gray-900 text-xs font-bold px-3 py-2 rounded-lg hover:bg-[#e5c55a] transition-colors"
                      >
                        PDF
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
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
