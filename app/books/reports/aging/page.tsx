'use client';

import { useState, useEffect } from 'react';
import ReportShell from '../../components/ReportShell';
import KPICard from '../../components/KPICard';
import DataTable, { type Column } from '../../components/DataTable';
import { Clock } from 'lucide-react';
import type { AgingReceivablesReport, AgingBucket } from '@/lib/books-types';

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

type AgingPayment = AgingBucket['payments'][number];

const paymentCols: Column<AgingPayment>[] = [
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
      <span className="text-yellow-400 font-medium">{r.days_overdue}d</span>
    ),
  },
];

const BUCKET_COLORS = [
  'border-yellow-500/30',
  'border-orange-500/30',
  'border-red-500/30',
  'border-red-500/50',
];

export default function AgingPage() {
  const [report, setReport] = useState<AgingReceivablesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBucket, setExpandedBucket] = useState<number | null>(null);

  useEffect(() => {
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (!orgId) {
      setLoading(false);
      return;
    }

    fetch(`/api/books/reports/aging?org_id=${orgId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setReport(d);
      })
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ReportShell title="Aging Receivables" showDateRange={false}>
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center animate-pulse">
          <p className="text-gray-400">Generating report...</p>
        </div>
      ) : !report ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">No data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">As of {fmtDate(report.as_of)}</p>

          <KPICard
            label="Total Outstanding"
            value={report.total_outstanding}
            icon={Clock}
            colorClass="border-red-500/30"
          />

          {/* Bucket Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {report.buckets.map((bucket, i) => (
              <button
                key={bucket.label}
                onClick={() => setExpandedBucket(expandedBucket === i ? null : i)}
                className={`bg-gray-900 border rounded-xl p-4 text-left transition-colors ${BUCKET_COLORS[i]} ${
                  expandedBucket === i ? 'ring-2 ring-[#d4af37]' : ''
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  {bucket.label}
                </p>
                <p className="text-lg font-bold text-white mt-1">{fmt(bucket.total)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{bucket.count} payment{bucket.count !== 1 ? 's' : ''}</p>
              </button>
            ))}
          </div>

          {/* Expanded bucket detail */}
          {expandedBucket !== null && report.buckets[expandedBucket] && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                {report.buckets[expandedBucket].label} — Detail
              </h3>
              <DataTable
                columns={paymentCols}
                data={report.buckets[expandedBucket].payments}
                emptyMessage="No overdue payments in this bucket"
              />
            </div>
          )}
        </div>
      )}
    </ReportShell>
  );
}
