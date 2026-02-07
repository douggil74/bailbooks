'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText } from 'lucide-react';
import type { ChartOfAccount } from '@/lib/books-types';
import { useTheme } from '../components/ThemeProvider';
import { useOrg } from '../components/OrgContext';

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
  const { theme } = useTheme();
  const light = theme === 'light';
  const orgId = useOrg();

  const fetchAccounts = useCallback(() => {
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
  }, [orgId]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  async function seedDefaults() {
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
        <h1 className={`text-2xl font-bold ${light ? 'text-gray-900' : 'text-white'}`}>Chart of Accounts</h1>
        <div className="flex gap-2">
          {accounts.length === 0 && !loading && (
            <button
              onClick={seedDefaults}
              disabled={seeding}
              className={`flex items-center gap-1.5 px-3 py-2 font-medium rounded-lg text-sm transition-colors disabled:opacity-50 ${light ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
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
            <div key={i} className={`border rounded-xl p-4 h-24 animate-pulse ${light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`} />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className={`border rounded-xl p-12 text-center ${light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`}>
          <FileText className={`w-10 h-10 mx-auto mb-3 ${light ? 'text-gray-300' : 'text-gray-600'}`} />
          <p className={`font-medium ${light ? 'text-gray-500' : 'text-gray-400'}`}>No chart of accounts set up</p>
          <p className={`text-sm mt-1 ${light ? 'text-gray-300' : 'text-gray-600'}`}>Click &quot;Load Bail Bond Defaults&quot; to start with a standard chart of accounts</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.filter((g) => g.accounts.length > 0).map((group) => (
            <div key={group.type}>
              <div className="flex items-center justify-between mb-2">
                <h2 className={`text-sm font-semibold ${group.color.split(' ')[0]}`}>{group.label}</h2>
                <span className={`text-sm font-bold ${group.color.split(' ')[0]}`}>{fmt(group.total)}</span>
              </div>
              <div className={`border rounded-xl overflow-hidden ${light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`}>
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${light ? 'border-gray-200' : 'border-gray-800'}`}>
                      <th className={`text-left text-[10px] uppercase tracking-wider px-4 py-2 font-semibold w-24 ${light ? 'text-gray-400' : 'text-gray-500'}`}>No.</th>
                      <th className={`text-left text-[10px] uppercase tracking-wider px-4 py-2 font-semibold ${light ? 'text-gray-400' : 'text-gray-500'}`}>Account Name</th>
                      <th className={`text-left text-[10px] uppercase tracking-wider px-4 py-2 font-semibold ${light ? 'text-gray-400' : 'text-gray-500'}`}>Sub-type</th>
                      <th className={`text-right text-[10px] uppercase tracking-wider px-4 py-2 font-semibold w-32 ${light ? 'text-gray-400' : 'text-gray-500'}`}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.accounts.map((acct) => (
                      <tr key={acct.id} className={`border-b last:border-0 transition-colors ${light ? 'border-gray-100 hover:bg-gray-50' : 'border-gray-800/50 hover:bg-gray-800/30'}`}>
                        <td className="px-4 py-2.5 text-sm text-gray-500 font-mono">{acct.account_number}</td>
                        <td className={`px-4 py-2.5 text-sm font-medium ${light ? 'text-gray-900' : 'text-white'}`}>{acct.account_name}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-500">{acct.sub_type || '—'}</td>
                        <td className={`px-4 py-2.5 text-sm text-right font-medium tabular-nums ${light ? 'text-gray-900' : 'text-white'}`}>{fmt(Number(acct.balance))}</td>
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
  const { theme } = useTheme();
  const light = theme === 'light';
  const orgId = useOrg();

  const inputCls = light
    ? 'w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none'
    : 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
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
      <form onSubmit={handleSubmit} className={`border rounded-2xl p-6 w-full max-w-md space-y-4 ${light ? 'bg-white border-gray-200 shadow-xl' : 'bg-gray-900 border-gray-700'}`}>
        <h2 className={`text-lg font-bold ${light ? 'text-gray-900' : 'text-white'}`}>Add Account</h2>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Account #</label>
            <input
              value={form.account_number}
              onChange={(e) => setForm({ ...form, account_number: e.target.value })}
              className={`${inputCls} font-mono`}
              placeholder="1000"
              required
            />
          </div>
          <div className="col-span-2">
            <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Account Name</label>
            <input
              value={form.account_name}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              className={inputCls}
              placeholder="e.g. Cash on Hand"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Type</label>
            <select
              value={form.account_type}
              onChange={(e) => setForm({ ...form, account_type: e.target.value })}
              className={`${inputCls} appearance-none`}
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Sub-type</label>
            <input
              value={form.sub_type}
              onChange={(e) => setForm({ ...form, sub_type: e.target.value })}
              className={inputCls}
              placeholder="e.g. Current Asset"
            />
          </div>
        </div>

        <div>
          <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={`${inputCls} resize-none`}
            rows={2}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${light ? 'bg-gray-100 text-gray-500 hover:text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
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
