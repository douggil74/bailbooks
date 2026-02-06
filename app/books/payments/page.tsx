'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import DataTable, { type Column } from '../components/DataTable';

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

interface PaymentEntry {
  id: string;
  application_id: string;
  defendant_name: string;
  amount: number;
  type: string;
  status: string;
  payment_method: string | null;
  due_date: string | null;
  paid_at: string | null;
  days_overdue: number;
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
];

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-emerald-500/20 text-emerald-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  failed: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
};

const columns: Column<PaymentEntry>[] = [
  { key: 'defendant_name', label: 'Defendant', sortable: true },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    className: 'text-right',
    render: (r) => <span className="font-medium">{fmt(r.amount)}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (r) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-gray-500/20 text-gray-400'}`}>
        {r.status}
      </span>
    ),
  },
  { key: 'type', label: 'Type' },
  { key: 'payment_method', label: 'Method' },
  {
    key: 'due_date',
    label: 'Due Date',
    sortable: true,
    render: (r) => fmtDate(r.due_date),
  },
  {
    key: 'paid_at',
    label: 'Paid',
    render: (r) => fmtDate(r.paid_at),
  },
  {
    key: 'days_overdue',
    label: '',
    render: (r) =>
      r.days_overdue > 0 ? (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          r.days_overdue > 30 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {r.days_overdue}d late
        </span>
      ) : null,
  },
];

export default function PaymentsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaymentEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(() => {
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (!orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({ org_id: orgId, page: String(page), per_page: '25' });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);

    fetch(`/api/books/payments?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d.data || []);
        setTotal(d.total || 0);
        setTotalPages(d.total_pages || 1);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Payments</h1>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === tab.value
                  ? 'bg-gray-800 text-[#d4af37]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by defendant name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm animate-pulse">Loading payments...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          onRowClick={(row) => router.push(`/books/ledger/${row.application_id}`)}
          emptyMessage="No payments found"
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
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
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
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
