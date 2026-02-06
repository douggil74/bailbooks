'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import DataTable, { type Column } from '../components/DataTable';
import type { BondLedgerEntry, PaginatedResponse } from '@/lib/books-types';

const ORG_ID_KEY = 'bailbooks_org_id';

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + (d.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400',
  approved: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-gray-500/20 text-gray-400',
};

const columns: Column<BondLedgerEntry>[] = [
  { key: 'defendant_name', label: 'Defendant', sortable: true },
  { key: 'power_number', label: 'Power #' },
  {
    key: 'bond_amount',
    label: 'Bond',
    sortable: true,
    className: 'text-right',
    render: (r) => fmt(r.bond_amount),
  },
  {
    key: 'premium',
    label: 'Premium',
    sortable: true,
    className: 'text-right',
    render: (r) => fmt(r.premium),
  },
  {
    key: 'total_paid',
    label: 'Paid',
    className: 'text-right',
    render: (r) => <span className="text-emerald-400">{fmt(r.total_paid)}</span>,
  },
  {
    key: 'balance_due',
    label: 'Balance',
    className: 'text-right',
    render: (r) => (
      <span className={r.balance_due > 0 ? 'text-yellow-400 font-medium' : 'text-gray-400'}>
        {fmt(r.balance_due)}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (r) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-gray-500/20 text-gray-400'}`}>
        {r.status}
      </span>
    ),
  },
  {
    key: 'bond_date',
    label: 'Bond Date',
    sortable: true,
    render: (r) => fmtDate(r.bond_date),
  },
  {
    key: 'overdue_count',
    label: '',
    render: (r) =>
      r.overdue_count > 0 ? (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
          {r.overdue_count} overdue
        </span>
      ) : null,
  },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
];

export default function LedgerPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<BondLedgerEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(() => {
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (!orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({ org_id: orgId, page: String(page), per_page: '25' });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);

    fetch(`/api/books/ledger?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Bond Ledger</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search defendant, power #, case #..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-8 py-2 text-white text-sm appearance-none focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm animate-pulse">Loading ledger...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.data || []}
          onRowClick={(row) => router.push(`/books/ledger/${row.id}`)}
          emptyMessage="No bonds found"
        />
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, data.total)} of {data.total}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(data.total_pages, page + 1))}
              disabled={page === data.total_pages}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
