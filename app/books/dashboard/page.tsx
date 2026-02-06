'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  Shield,
  TrendingUp,
  AlertTriangle,
  Calendar,
  CreditCard,
  Banknote,
  Scale,
} from 'lucide-react';
import KPICard from '../components/KPICard';
import CashFlowChart from '../components/CashFlowChart';
import DataTable, { type Column } from '../components/DataTable';
import type { DashboardData, RecentPayment, OverduePayment, UpcomingCourt } from '@/lib/books-types';

const ORG_ID_KEY = 'bailbooks_org_id';

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  return new Date(d + (d.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const recentPaymentCols: Column<RecentPayment>[] = [
  { key: 'defendant_name', label: 'Defendant', sortable: true },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    className: 'text-right',
    render: (r) => <span className="text-emerald-400 font-medium">{fmt(r.amount)}</span>,
  },
  {
    key: 'paid_at',
    label: 'Date',
    sortable: true,
    render: (r) => fmtDate(r.paid_at),
  },
  { key: 'payment_method', label: 'Method' },
];

const overdueCols: Column<OverduePayment>[] = [
  { key: 'defendant_name', label: 'Defendant', sortable: true },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    className: 'text-right',
    render: (r) => <span className="text-red-400 font-medium">{fmt(r.amount)}</span>,
  },
  {
    key: 'due_date',
    label: 'Due Date',
    sortable: true,
    render: (r) => fmtDate(r.due_date),
  },
  {
    key: 'days_overdue',
    label: 'Days Late',
    sortable: true,
    className: 'text-right',
    render: (r) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        r.days_overdue > 30 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
      }`}>
        {r.days_overdue}d
      </span>
    ),
  },
];

const courtCols: Column<UpcomingCourt>[] = [
  { key: 'defendant_name', label: 'Defendant', sortable: true },
  { key: 'court_name', label: 'Court' },
  {
    key: 'court_date',
    label: 'Date',
    sortable: true,
    render: (r) => fmtDate(r.court_date),
  },
  {
    key: 'bond_amount',
    label: 'Bond',
    sortable: true,
    className: 'text-right',
    render: (r) => fmt(r.bond_amount),
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (!orgId) {
      setError('No organization configured. Go to Settings to set up.');
      setLoading(false);
      return;
    }

    fetch(`/api/books/dashboard?org_id=${orgId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Active Bonds" value={data.total_active_bonds} icon={Shield} format="number" colorClass="border-gray-800" />
        <KPICard label="Bond Liability" value={data.total_bond_liability} icon={Scale} colorClass="border-blue-500/30" />
        <KPICard label="Premium Earned" value={data.total_premium_earned} icon={TrendingUp} colorClass="border-emerald-500/30" />
        <KPICard label="Total Collected" value={data.total_collected} icon={DollarSign} colorClass="border-emerald-500/30" />
        <KPICard label="Outstanding" value={data.total_outstanding} icon={Banknote} colorClass="border-yellow-500/30" />
        <KPICard label="Expenses (YTD)" value={data.total_expenses} icon={CreditCard} colorClass="border-red-500/30" />
        <KPICard label="Net Income" value={data.net_income} icon={TrendingUp} colorClass="border-emerald-500/30" />
        <KPICard label="Overdue" value={data.overdue_payments} icon={AlertTriangle} format="number" colorClass={data.overdue_payments > 0 ? 'border-red-500/30' : 'border-gray-800'} />
      </div>

      {/* Cash Flow Chart */}
      <CashFlowChart data={data.cash_flow} />

      {/* Tables Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Recent Payments
          </h2>
          <DataTable
            columns={recentPaymentCols}
            data={data.recent_payments || []}
            emptyMessage="No payments recorded yet"
          />
        </div>

        {/* Overdue Payments */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Overdue Payments
          </h2>
          <DataTable
            columns={overdueCols}
            data={data.overdue_list || []}
            emptyMessage="No overdue payments"
          />
        </div>
      </div>

      {/* Upcoming Court Dates */}
      {(data.upcoming_courts?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Upcoming Court Dates (Next 30 Days)
          </h2>
          <DataTable
            columns={courtCols}
            data={data.upcoming_courts || []}
            emptyMessage="No upcoming court dates"
          />
        </div>
      )}
    </div>
  );
}
