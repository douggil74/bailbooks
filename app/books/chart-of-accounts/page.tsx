'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText } from 'lucide-react';
import type { ChartOfAccount } from '@/lib/books-types';

const ORG_ID_KEY = 'bailbooks_org_id';

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const ACCOUNT_TYPE_ORDER = ['asset', 'liability', 'equity', 'income', 'expense'] as const;
const ACCOUNT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  asset: { label: 'Assets', color: 'text-blue-400 border-blue-500/30' },
  liability: { label: 'Liabilities', color: 'text-red-400 border-red-500/30' },
  equity: { label: 'Equity', color: 'text-purple-400 border-purple-500/30' },
  income: { label: 'Income', color: 'text-emerald-400 border-emerald-500/30' },
  expense: { label: 'Expenses', color: 'text-[#d4af37] border-[#d4af37]/30' },
};

const DEFAULT_ACCOUNTS = [
  { account_number: '1000', account_name: 'Cash on Hand', account_type: 'asset', sub_type: 'Current Asset' },
  { account_number: '1010', account_name: 'Operating Bank Account', account_type: 'asset', sub_type: 'Current Asset' },
  { account_number: '1020', account_name: 'Trust Bank Account', account_type: 'asset', sub_type: 'Current Asset' },
  { account_number: '1100', account_name: 'Premiums Receivable', account_type: 'asset', sub_type: 'Current Asset' },
  { account_number: '1200', account_name: 'Collateral Held', account_type: 'asset', sub_type: 'Other Asset' },
  { account_number: '2000', account_name: 'Accounts Payable', account_type: 'liability', sub_type: 'Current Liability' },
  { account_number: '2100', account_name: 'Bond Liability', account_type: 'liability', sub_type: 'Current Liability' },
  { account_number: '2200', account_name: 'Surety Payable', account_type: 'liability', sub_type: 'Current Liability' },
  { account_number: '2300', account_name: 'Forfeiture Reserve', account_type: 'liability', sub_type: 'Long-term Liability' },
  { account_number: '3000', account_name: 'Owner Equity', account_type: 'equity', sub_type: 'Owner Equity' },
  { account_number: '3100', account_name: 'Retained Earnings', account_type: 'equity', sub_type: 'Retained Earnings' },
  { account_number: '4000', account_name: 'Premium Income', account_type: 'income', sub_type: 'Revenue' },
  { account_number: '4100', account_name: 'Payment Plan Fees', account_type: 'income', sub_type: 'Revenue' },
  { account_number: '4200', account_name: 'Recovery Income', account_type: 'income', sub_type: 'Revenue' },
  { account_number: '5000', account_name: 'Surety Premiums', account_type: 'expense', sub_type: 'Cost of Goods' },
  { account_number: '5100', account_name: 'Recovery Expenses', account_type: 'expense', sub_type: 'Cost of Goods' },
  { account_number: '6000', account_name: 'Office Rent', account_type: 'expense', sub_type: 'Operating Expense' },
  { account_number: '6100', account_name: 'Insurance', account_type: 'expense', sub_type: 'Operating Expense' },
  { account_number: '6200', account_name: 'Salaries & Wages', account_type: 'expense', sub_type: 'Operating Expense' },
  { account_number: '6300', account_name: 'Advertising & Marketing', account_type: 'expense', sub_type: 'Operating Expense' },
  { account_number: '6400', account_name: 'Office Supplies', account_type: 'expense', sub_type: 'Operating Expense' },
  { account_number: '6500', account_name: 'Professional Fees', account_type: 'expense', sub_type: 'Operating Expense' },
  { account_number: '6600', account_name: 'Vehicle Expenses', account_type: 'expense', sub_type: 'Operating Expense' },
  { account_number: '6900', account_name: 'Forfeiture Losses', account_type: 'expense', sub_type: 'Other Expense' },
];

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchAccounts = useCallback(() => {
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/books/chart-of-accounts?org_id=${orgId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setAccounts(d.accounts || []);
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  async function seedDefaults() {
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (!orgId) return;
    setSeeding(true);
    for (const acct of DEFAULT_ACCOUNTS) {
      await fetch('/api/books/chart-of-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, ...acct }),
      });
    }
    setSeeding(false);
    fetchAccounts();
  }

  // Group by type
  const grouped = ACCOUNT_TYPE_ORDER.map((type) => ({
    type,
    ...ACCOUNT_TYPE_LABELS[type],
    accounts: accounts.filter((a) => a.account_type === type),
    total: accounts.filter((a) => a.account_type === type).reduce((s, a) => s + Number(a.balance), 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Chart of Accounts</h1>
        <div className="flex gap-2">
          {accounts.length === 0 && !loading && (
            <button
              onClick={seedDefaults}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {seeding ? 'Setting up...' : 'Load Bail Bond Defaults'}
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#d4af37] text-[#0a0a0a] font-bold rounded-lg text-sm hover:bg-[#e5c55a] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No chart of accounts set up</p>
          <p className="text-gray-600 text-sm mt-1">Click &quot;Load Bail Bond Defaults&quot; to start with a standard chart of accounts</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.filter((g) => g.accounts.length > 0).map((group) => (
            <div key={group.type}>
              <div className="flex items-center justify-between mb-2">
                <h2 className={`text-sm font-semibold ${group.color.split(' ')[0]}`}>{group.label}</h2>
                <span className={`text-sm font-bold ${group.color.split(' ')[0]}`}>{fmt(group.total)}</span>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left text-[10px] uppercase tracking-wider text-gray-500 px-4 py-2 font-semibold w-24">No.</th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-gray-500 px-4 py-2 font-semibold">Account Name</th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-gray-500 px-4 py-2 font-semibold">Sub-type</th>
                      <th className="text-right text-[10px] uppercase tracking-wider text-gray-500 px-4 py-2 font-semibold w-32">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.accounts.map((acct) => (
                      <tr key={acct.id} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-2.5 text-sm text-gray-500 font-mono">{acct.account_number}</td>
                        <td className="px-4 py-2.5 text-sm text-white font-medium">{acct.account_name}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-500">{acct.sub_type || '—'}</td>
                        <td className="px-4 py-2.5 text-sm text-right font-medium text-white tabular-nums">{fmt(Number(acct.balance))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      {showForm && (
        <ChartAccountForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchAccounts(); }}
        />
      )}
    </div>
  );
}

function ChartAccountForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    account_number: '',
    account_name: '',
    account_type: 'asset',
    sub_type: '',
    description: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (!orgId) return;

    const res = await fetch('/api/books/chart-of-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) { alert(data.error); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-bold text-white">Add Account</h2>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Account #</label>
            <input
              value={form.account_number}
              onChange={(e) => setForm({ ...form, account_number: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none font-mono"
              placeholder="1000"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Account Name</label>
            <input
              value={form.account_name}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              placeholder="e.g. Cash on Hand"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Type</label>
            <select
              value={form.account_type}
              onChange={(e) => setForm({ ...form, account_type: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none appearance-none"
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Sub-type</label>
            <input
              value={form.sub_type}
              onChange={(e) => setForm({ ...form, sub_type: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              placeholder="e.g. Current Asset"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none resize-none"
            rows={2}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-400 rounded-lg text-sm font-medium hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-[#d4af37] text-[#0a0a0a] font-bold rounded-lg text-sm disabled:opacity-50 hover:bg-[#e5c55a] transition-colors">
            {saving ? 'Saving...' : 'Add Account'}
          </button>
        </div>
      </form>
    </div>
  );
}
