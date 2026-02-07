'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import KPICard from '../../components/KPICard';
import DataTable, { type Column } from '../../components/DataTable';
import { useTheme } from '../../components/ThemeProvider';
import { useOrg } from '../../components/OrgContext';

interface BondDetail {
  id: string;
  defendant_first: string;
  defendant_last: string;
  bond_amount: number;
  premium: number;
  down_payment: number;
  status: string;
  bond_date: string | null;
  court_date: string | null;
  court_name: string | null;
  case_number: string | null;
  power_number: string | null;
  charge_description: string | null;
  forfeiture_status: string | null;
  forfeiture_date: string | null;
  forfeiture_deadline: string | null;
  forfeiture_amount: number | null;
  forfeiture_notes: string | null;
  next_payment_date: string | null;
}

interface PaymentRow {
  id: string;
  amount: number;
  type: string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  description: string | null;
}

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

const paymentCols: Column<PaymentRow>[] = [
  {
    key: 'due_date',
    label: 'Due Date',
    sortable: true,
    render: (r) => fmtDate(r.due_date),
  },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    className: 'text-right',
    render: (r) => fmt(r.amount),
  },
  {
    key: 'status',
    label: 'Status',
    render: (r) => {
      const colors: Record<string, string> = {
        paid: 'bg-emerald-500/20 text-emerald-400',
        pending: 'bg-yellow-500/20 text-yellow-400',
        failed: 'bg-red-500/20 text-red-400',
        cancelled: 'bg-gray-500/20 text-gray-400',
      };
      return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[r.status] || 'bg-gray-500/20 text-gray-400'}`}>
          {r.status}
        </span>
      );
    },
  },
  { key: 'type', label: 'Type' },
  { key: 'payment_method', label: 'Method' },
  {
    key: 'paid_at',
    label: 'Paid',
    render: (r) => fmtDate(r.paid_at),
  },
];

export default function BondDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const light = theme === 'light';
  const orgId = useOrg();
  const [bond, setBond] = useState<BondDetail | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId || !id) return;

    Promise.all([
      fetch(`/api/admin/applications?id=${id}`).then((r) => r.json()),
      fetch(`/api/admin/payments?application_id=${id}`).then((r) => r.json()),
    ])
      .then(([appData, payData]) => {
        setBond(appData.application || null);
        setPayments(payData.payments || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className={`h-8 w-48 rounded animate-pulse ${light ? 'bg-gray-200' : 'bg-gray-800'}`} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`rounded-xl p-4 h-20 animate-pulse border ${light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`} />
          ))}
        </div>
      </div>
    );
  }

  if (!bond) {
    return (
      <div>
        <Link href="/books/ledger" className={`flex items-center gap-1 text-sm mb-4 ${light ? 'text-gray-400 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}>
          <ArrowLeft className="w-4 h-4" /> Back to Ledger
        </Link>
        <div className={`rounded-xl p-8 text-center border ${light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`}>
          <p className={light ? 'text-gray-500' : 'text-gray-400'}>Bond not found</p>
        </div>
      </div>
    );
  }

  const premium = Number(bond.premium) || 0;
  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balance = Math.max(0, premium - totalPaid);
  const todayStr = new Date().toISOString().split('T')[0];
  const overduePayments = payments.filter(
    (p) => p.status === 'pending' && p.due_date && p.due_date < todayStr
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/books/ledger" className={`flex items-center gap-1 text-sm mb-3 ${light ? 'text-gray-400 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}>
          <ArrowLeft className="w-4 h-4" /> Back to Ledger
        </Link>
        <h1 className={`text-2xl font-bold ${light ? 'text-gray-900' : 'text-white'}`}>
          {bond.defendant_first} {bond.defendant_last}
        </h1>
        <p className={`text-sm mt-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>
          {bond.power_number && `Power #${bond.power_number} · `}
          {bond.case_number && `Case #${bond.case_number} · `}
          {bond.charge_description || 'No charge listed'}
        </p>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Bond Amount" value={Number(bond.bond_amount) || 0} colorClass="border-blue-500/30" />
        <KPICard label="Premium" value={premium} colorClass="border-emerald-500/30" />
        <KPICard label="Total Paid" value={totalPaid} icon={DollarSign} colorClass="border-emerald-500/30" />
        <KPICard label="Balance Due" value={balance} colorClass={balance > 0 ? 'border-yellow-500/30' : 'border-gray-800'} />
      </div>

      {/* Bond Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className={`rounded-xl p-4 space-y-3 border ${light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`}>
          <h3 className={`text-sm font-semibold flex items-center gap-2 ${light ? 'text-gray-900' : 'text-white'}`}>
            <Calendar className="w-4 h-4 text-blue-400" /> Key Dates
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={light ? 'text-gray-400' : 'text-gray-500'}>Bond Date</span>
              <span className={light ? 'text-gray-700' : 'text-gray-300'}>{fmtDate(bond.bond_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className={light ? 'text-gray-400' : 'text-gray-500'}>Court Date</span>
              <span className={light ? 'text-gray-700' : 'text-gray-300'}>{fmtDate(bond.court_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className={light ? 'text-gray-400' : 'text-gray-500'}>Next Payment</span>
              <span className={light ? 'text-gray-700' : 'text-gray-300'}>{fmtDate(bond.next_payment_date)}</span>
            </div>
          </div>
        </div>

        {/* Forfeiture info if applicable */}
        {bond.forfeiture_status && (
          <div className="bg-gray-900 border border-red-500/30 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Forfeiture
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={light ? 'text-gray-400' : 'text-gray-500'}>Status</span>
                <span className="text-red-400 font-medium">{bond.forfeiture_status}</span>
              </div>
              <div className="flex justify-between">
                <span className={light ? 'text-gray-400' : 'text-gray-500'}>Date</span>
                <span className={light ? 'text-gray-700' : 'text-gray-300'}>{fmtDate(bond.forfeiture_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className={light ? 'text-gray-400' : 'text-gray-500'}>Deadline</span>
                <span className={light ? 'text-gray-700' : 'text-gray-300'}>{fmtDate(bond.forfeiture_deadline)}</span>
              </div>
              {bond.forfeiture_amount && (
                <div className="flex justify-between">
                  <span className={light ? 'text-gray-400' : 'text-gray-500'}>Amount</span>
                  <span className="text-red-400 font-medium">{fmt(Number(bond.forfeiture_amount))}</span>
                </div>
              )}
              {bond.forfeiture_notes && (
                <p className={`text-xs mt-2 ${light ? 'text-gray-500' : 'text-gray-400'}`}>{bond.forfeiture_notes}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overdue Alert */}
      {overduePayments.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">
            {overduePayments.length} overdue payment{overduePayments.length > 1 ? 's' : ''} totaling{' '}
            {fmt(overduePayments.reduce((s, p) => s + Number(p.amount), 0))}
          </p>
        </div>
      )}

      {/* Payment History */}
      <div>
        <h2 className={`text-sm font-semibold mb-3 ${light ? 'text-gray-900' : 'text-white'}`}>Payment History</h2>
        <DataTable
          columns={paymentCols}
          data={payments}
          emptyMessage="No payments recorded"
        />
      </div>
    </div>
  );
}
