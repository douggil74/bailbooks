'use client';

import { useState, useEffect } from 'react';
import ReportShell from '../../components/ReportShell';
import DataTable, { type Column } from '../../components/DataTable';
import KPICard from '../../components/KPICard';
import { Shield, DollarSign } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import type { OutstandingBondReport } from '@/lib/books-types';

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

type BondRow = OutstandingBondReport['bonds'][number];

const columns: Column<BondRow>[] = [
  { key: 'defendant_name', label: 'Defendant', sortable: true },
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
    key: 'collected',
    label: 'Collected',
    className: 'text-right',
    render: (r) => <span className="text-emerald-400">{fmt(r.collected)}</span>,
  },
  {
    key: 'remaining',
    label: 'Remaining',
    sortable: true,
    className: 'text-right',
    render: (r) => (
      <span className={r.remaining > 0 ? 'text-yellow-400 font-medium' : 'text-gray-400'}>
        {fmt(r.remaining)}
      </span>
    ),
  },
  {
    key: 'bond_date',
    label: 'Bond Date',
    render: (r) => fmtDate(r.bond_date),
  },
  {
    key: 'forfeiture_status',
    label: '',
    render: (r) =>
      r.forfeiture_status ? (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
          {r.forfeiture_status}
        </span>
      ) : null,
  },
];

export default function OutstandingPage() {
  const { theme } = useTheme();
  const light = theme === 'light';
  const [report, setReport] = useState<OutstandingBondReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (!orgId) {
      setLoading(false);
      return;
    }

    fetch(`/api/books/reports/outstanding?org_id=${orgId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setReport(d);
      })
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ReportShell title="Outstanding Bond Liability" showDateRange={false}>
      {loading ? (
        <div className={`${light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'} border rounded-xl p-8 text-center animate-pulse`}>
          <p className={`${light ? 'text-gray-500' : 'text-gray-400'}`}>Generating report...</p>
        </div>
      ) : !report ? (
        <div className={`${light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'} border rounded-xl p-8 text-center`}>
          <p className={`${light ? 'text-gray-500' : 'text-gray-400'}`}>No data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className={`text-xs ${light ? 'text-gray-400' : 'text-gray-500'}`}>As of {fmtDate(report.as_of)}</p>

          <div className="grid grid-cols-2 gap-3">
            <KPICard label="Total Bond Liability" value={report.total_liability} icon={Shield} colorClass="border-blue-500/30" />
            <KPICard label="Premium Receivable" value={report.total_premium_receivable} icon={DollarSign} colorClass="border-yellow-500/30" />
          </div>

          <DataTable
            columns={columns}
            data={report.bonds}
            emptyMessage="No outstanding bonds"
          />
        </div>
      )}
    </ReportShell>
  );
}
