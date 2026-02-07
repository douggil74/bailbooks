'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Sliders, ChevronLeft, ChevronRight, PiggyBank } from 'lucide-react';
import DataTable, { type Column } from '../components/DataTable';
import { useTheme } from '../components/ThemeProvider';
import { useOrg } from '../components/OrgContext';
import type { Transaction, BankAccount } from '@/lib/books-types';

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const TYPE_META: Record<string, { label: string; icon: typeof ArrowUpRight; color: string }> = {
  deposit: { label: 'Deposit', icon: ArrowDownLeft, color: 'text-emerald-400' },
  withdrawal: { label: 'Withdrawal', icon: ArrowUpRight, color: 'text-red-400' },
  transfer: { label: 'Transfer', icon: ArrowLeftRight, color: 'text-blue-400' },
  adjustment: { label: 'Adjustment', icon: Sliders, color: 'text-yellow-400' },
};

export default function TransactionsPage() {
  const { theme } = useTheme();
  const light = theme === 'light';
  const orgId = useOrg();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [accountFilter, setAccountFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);

  const fetchData = useCallback(() => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true);

    const params = new URLSearchParams({ org_id: orgId, page: String(page), per_page: '25' });
    if (accountFilter) params.set('bank_account_id', accountFilter);

    fetch(`/api/books/transactions?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setTransactions(d.data || []);
        setTotal(d.total || 0);
        setTotalPages(d.total_pages || 1);
      })
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, [orgId, accountFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!orgId) return;
    fetch(`/api/books/bank-accounts?org_id=${orgId}`)
      .then((r) => r.json())
      .then((d) => setBankAccounts(d.accounts || []))
      .catch(() => {});
  }, [orgId]);

  const columns: Column<Transaction>[] = [
    {
      key: 'transaction_date',
      label: 'Date',
      sortable: true,
      render: (r) => fmtDate(r.transaction_date),
    },
    {
      key: 'transaction_type',
      label: 'Type',
      render: (r) => {
        const meta = TYPE_META[r.transaction_type] || TYPE_META.deposit;
        const Icon = meta.icon;
        return (
          <div className="flex items-center gap-1.5">
            <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
            <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
          </div>
        );
      },
    },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'payee', label: 'Payee' },
    {
      key: 'bank_account_name',
      label: 'Account',
      render: (r) => <span className={light ? 'text-gray-500' : 'text-gray-400'}>{r.bank_account_name || '—'}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      className: 'text-right',
      render: (r) => {
        const isDebit = r.transaction_type === 'withdrawal';
        return (
          <span className={`font-medium ${isDebit ? 'text-red-400' : 'text-emerald-400'}`}>
            {isDebit ? '-' : '+'}{fmt(r.amount)}
          </span>
        );
      },
    },
    {
      key: 'balance',
      label: 'Balance',
      className: 'text-right',
      render: (r) => (
        <span className={`font-semibold ${light ? 'text-gray-900' : 'text-white'}`}>
          {r.balance != null ? fmt(r.balance) : '—'}
        </span>
      ),
    },
    {
      key: 'is_reconciled',
      label: '',
      className: 'w-8',
      render: (r) => r.is_reconciled ? (
        <span className="w-2 h-2 rounded-full bg-emerald-400 block mx-auto" title="Reconciled" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-gray-600 block mx-auto" title="Unreconciled" />
      ),
    },
    { key: 'reference_number', label: 'Ref #' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-bold ${light ? 'text-gray-900' : 'text-white'}`}>Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeposit(true)}
            className={`flex items-center gap-1.5 px-3 py-2 font-bold rounded-lg text-sm transition-colors ${light ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' : 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 border border-emerald-800'}`}
          >
            <PiggyBank className="w-4 h-4" />
            Deposit
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#d4af37] text-[#0a0a0a] font-bold rounded-lg text-sm hover:bg-[#e5c55a] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <select
          value={accountFilter}
          onChange={(e) => { setAccountFilter(e.target.value); setPage(1); }}
          className={`border rounded-lg px-3 py-2 text-sm appearance-none focus:ring-2 focus:ring-[#d4af37] focus:outline-none ${light ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
        >
          <option value="">All Accounts</option>
          {bankAccounts.map((a) => (
            <option key={a.id} value={a.id}>{a.account_name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className={`border rounded-xl p-8 text-center ${light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`}>
          <p className={`text-sm animate-pulse ${light ? 'text-gray-500' : 'text-gray-400'}`}>Loading transactions...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={transactions}
          emptyMessage="No transactions recorded yet"
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className={`text-xs ${light ? 'text-gray-400' : 'text-gray-500'}`}>
            Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed ${light ? 'bg-gray-100 text-gray-500 hover:text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed ${light ? 'bg-gray-100 text-gray-500 hover:text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showForm && (
        <TransactionForm
          bankAccounts={bankAccounts}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchData(); }}
        />
      )}

      {/* Quick Deposit Modal */}
      {showDeposit && (
        <DepositForm
          bankAccounts={bankAccounts}
          onClose={() => setShowDeposit(false)}
          onSaved={() => { setShowDeposit(false); fetchData(); }}
        />
      )}
    </div>
  );
}

function TransactionForm({
  bankAccounts,
  onClose,
  onSaved,
}: {
  bankAccounts: BankAccount[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { theme } = useTheme();
  const light = theme === 'light';

  const orgId = useOrg();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    transaction_type: 'deposit',
    bank_account_id: '',
    amount: '',
    description: '',
    payee: '',
    reference_number: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none ${light ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (!orgId) return;

    const res = await fetch('/api/books/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_id: orgId,
        ...form,
        amount: parseFloat(form.amount) || 0,
        bank_account_id: form.bank_account_id || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) { alert(data.error); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className={`border rounded-2xl p-6 w-full max-w-md space-y-4 ${light ? 'bg-white border-gray-200 shadow-xl' : 'bg-gray-900 border-gray-700'}`}>
        <h2 className={`text-lg font-bold ${light ? 'text-gray-900' : 'text-white'}`}>Add Transaction</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Type</label>
            <select
              value={form.transaction_type}
              onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}
              className={`${inputCls} appearance-none`}
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
          <div>
            <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Date</label>
            <input
              type="date"
              value={form.transaction_date}
              onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Bank Account</label>
          <select
            value={form.bank_account_id}
            onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}
            className={`${inputCls} appearance-none`}
          >
            <option value="">Select account...</option>
            {bankAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.account_name} ({a.bank_name})</option>
            ))}
          </select>
        </div>

        <div>
          <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Amount</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className={inputCls}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputCls}
            placeholder="What was this for?"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Payee</label>
            <input
              value={form.payee}
              onChange={(e) => setForm({ ...form, payee: e.target.value })}
              className={inputCls}
              placeholder="Who was paid?"
            />
          </div>
          <div>
            <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Reference #</label>
            <input
              value={form.reference_number}
              onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
              className={inputCls}
              placeholder="Check #, etc."
            />
          </div>
        </div>

        <div>
          <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={`${inputCls} resize-none`}
            rows={2}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${light ? 'bg-gray-100 text-gray-500 hover:text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-[#d4af37] text-[#0a0a0a] font-bold rounded-lg text-sm disabled:opacity-50 hover:bg-[#e5c55a] transition-colors">
            {saving ? 'Saving...' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}

function DepositForm({
  bankAccounts,
  onClose,
  onSaved,
}: {
  bankAccounts: BankAccount[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { theme } = useTheme();
  const light = theme === 'light';

  const orgId = useOrg();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bank_account_id: '',
    amount: '',
    description: '',
    payee: '',
    reference_number: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none ${light ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (!orgId) return;

    const res = await fetch('/api/books/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_id: orgId,
        transaction_type: 'deposit',
        ...form,
        amount: parseFloat(form.amount) || 0,
        bank_account_id: form.bank_account_id || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) { alert(data.error); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className={`border rounded-2xl p-6 w-full max-w-md space-y-4 ${light ? 'bg-white border-gray-200 shadow-xl' : 'bg-gray-900 border-gray-700'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${light ? 'bg-emerald-50' : 'bg-emerald-900/30'}`}>
            <PiggyBank className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className={`text-lg font-bold ${light ? 'text-gray-900' : 'text-white'}`}>Record Deposit</h2>
        </div>

        <div>
          <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Bank Account</label>
          <select
            value={form.bank_account_id}
            onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}
            className={`${inputCls} appearance-none`}
          >
            <option value="">Select account...</option>
            {bankAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.account_name} ({a.bank_name})</option>
            ))}
          </select>
        </div>

        <div>
          <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Amount</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className={`${inputCls} text-lg font-bold`}
            placeholder="0.00"
            required
            autoFocus
          />
        </div>

        <div>
          <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>From / Payer</label>
          <input
            value={form.payee}
            onChange={(e) => setForm({ ...form, payee: e.target.value })}
            className={inputCls}
            placeholder="Who deposited?"
          />
        </div>

        <div>
          <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputCls}
            placeholder="Bond premium, payment, etc."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Date</label>
            <input
              type="date"
              value={form.transaction_date}
              onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Reference #</label>
            <input
              value={form.reference_number}
              onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
              className={inputCls}
              placeholder="Check #, receipt #"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${light ? 'bg-gray-100 text-gray-500 hover:text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={`flex-1 px-4 py-2.5 font-bold rounded-lg text-sm disabled:opacity-50 transition-colors ${light ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}>
            {saving ? 'Saving...' : 'Record Deposit'}
          </button>
        </div>
      </form>
    </div>
  );
}
