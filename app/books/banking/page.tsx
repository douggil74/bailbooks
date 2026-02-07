'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Building2, CreditCard, PiggyBank, Landmark, Wallet, Star, Trash2, Pencil } from 'lucide-react';
import type { BankAccount } from '@/lib/books-types';
import { useTheme } from '../components/ThemeProvider';
import { useOrg } from '../components/OrgContext';

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const ACCOUNT_TYPE_META: Record<string, { label: string; icon: typeof Building2; color: string }> = {
  checking: { label: 'Checking', icon: Building2, color: 'text-blue-400' },
  savings: { label: 'Savings', icon: PiggyBank, color: 'text-emerald-400' },
  trust: { label: 'Trust', icon: Landmark, color: 'text-purple-400' },
  operating: { label: 'Operating', icon: Wallet, color: 'text-[#d4af37]' },
  credit_card: { label: 'Credit Card', icon: CreditCard, color: 'text-red-400' },
};

export default function BankingPage() {
  const { theme } = useTheme();
  const light = theme === 'light';
  const orgId = useOrg();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);

  const fetchAccounts = useCallback(() => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/books/bank-accounts?org_id=${orgId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setAccounts(d.accounts || []);
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.current_balance), 0);

  async function handleDelete(id: string) {
    if (!confirm('Remove this bank account?')) return;
    await fetch(`/api/books/bank-accounts/${id}`, { method: 'DELETE' });
    fetchAccounts();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-bold ${light ? 'text-gray-900' : 'text-white'}`}>Bank Accounts</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#d4af37] text-[#0a0a0a] font-bold rounded-lg text-sm hover:bg-[#e5c55a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Total Balance Card */}
      <div className={`border rounded-xl p-6 ${light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`}>
        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${light ? 'text-gray-400' : 'text-gray-500'}`}>Total Balance (All Accounts)</p>
        <p className={`text-3xl font-bold ${light ? 'text-gray-900' : 'text-white'}`}>{fmt(totalBalance)}</p>
        <p className={`text-xs mt-1 ${light ? 'text-gray-400' : 'text-gray-500'}`}>{accounts.length} active account{accounts.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Account Cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`border rounded-xl p-5 h-32 animate-pulse ${light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`} />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className={`border rounded-xl p-12 text-center ${light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`}>
          <Building2 className={`w-10 h-10 mx-auto mb-3 ${light ? 'text-gray-300' : 'text-gray-600'}`} />
          <p className={`font-medium ${light ? 'text-gray-500' : 'text-gray-400'}`}>No bank accounts yet</p>
          <p className={`text-sm mt-1 ${light ? 'text-gray-300' : 'text-gray-600'}`}>Add your first bank account to start tracking balances</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {accounts.map((acct) => {
            const meta = ACCOUNT_TYPE_META[acct.account_type] || ACCOUNT_TYPE_META.checking;
            const Icon = meta.icon;
            return (
              <div key={acct.id} className={`border rounded-xl p-5 transition-colors group ${light ? 'bg-white border-gray-200 shadow-sm hover:border-gray-300' : 'bg-gray-900 border-gray-800 hover:border-gray-600'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.color} ${light ? 'bg-gray-100' : 'bg-gray-800'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${light ? 'text-gray-900' : 'text-white'}`}>{acct.account_name}</p>
                        {acct.is_default && <Star className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]" />}
                      </div>
                      <p className={`text-xs ${light ? 'text-gray-400' : 'text-gray-500'}`}>{acct.bank_name} &middot; {meta.label}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditing(acct); setShowForm(true); }}
                      className={`p-1.5 transition-colors ${light ? 'text-gray-400 hover:text-gray-900' : 'text-gray-500 hover:text-white'}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(acct.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${light ? 'text-gray-900' : 'text-white'}`}>{fmt(Number(acct.current_balance))}</p>
                  </div>
                  {acct.account_number_last4 && (
                    <p className={`text-xs ${light ? 'text-gray-300' : 'text-gray-600'}`}>&bull;&bull;&bull;&bull; {acct.account_number_last4}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <BankAccountForm
          account={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); fetchAccounts(); }}
        />
      )}
    </div>
  );
}

function BankAccountForm({
  account,
  onClose,
  onSaved,
}: {
  account: BankAccount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { theme } = useTheme();
  const light = theme === 'light';
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    account_name: account?.account_name || '',
    account_type: account?.account_type || 'checking',
    bank_name: account?.bank_name || '',
    routing_number: account?.routing_number || '',
    account_number_last4: account?.account_number_last4 || '',
    current_balance: account ? String(account.current_balance) : '0',
    is_default: account?.is_default || false,
    notes: account?.notes || '',
  });

  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none ${light ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`;

  const orgId = useOrg();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (!orgId) { setSaving(false); alert('No organization configured. Go to Settings first.'); return; }

    try {
      const payload = {
        org_id: orgId,
        ...form,
        current_balance: parseFloat(form.current_balance) || 0,
      };

      const url = account ? `/api/books/bank-accounts/${account.id}` : '/api/books/bank-accounts';
      const method = account ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.error) { alert(data.error); setSaving(false); return; }
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className={`border rounded-2xl p-6 w-full max-w-md space-y-4 ${light ? 'bg-white border-gray-200 shadow-xl' : 'bg-gray-900 border-gray-700'}`}>
        <h2 className={`text-lg font-bold ${light ? 'text-gray-900' : 'text-white'}`}>{account ? 'Edit Account' : 'Add Bank Account'}</h2>

        <div>
          <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Account Name</label>
          <input
            value={form.account_name}
            onChange={(e) => setForm({ ...form, account_name: e.target.value })}
            className={inputCls}
            placeholder="e.g. Main Operating Account"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Account Type</label>
            <select
              value={form.account_type}
              onChange={(e) => setForm({ ...form, account_type: e.target.value as BankAccount['account_type'] })}
              className={`${inputCls} appearance-none`}
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="trust">Trust</option>
              <option value="operating">Operating</option>
              <option value="credit_card">Credit Card</option>
            </select>
          </div>
          <div>
            <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Bank Name</label>
            <input
              value={form.bank_name}
              onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
              className={inputCls}
              placeholder="e.g. Chase"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Routing Number</label>
            <input
              value={form.routing_number}
              onChange={(e) => setForm({ ...form, routing_number: e.target.value })}
              className={inputCls}
              placeholder="9 digits"
              maxLength={9}
            />
          </div>
          <div>
            <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Last 4 of Account #</label>
            <input
              value={form.account_number_last4}
              onChange={(e) => setForm({ ...form, account_number_last4: e.target.value })}
              className={inputCls}
              placeholder="1234"
              maxLength={4}
            />
          </div>
        </div>

        <div>
          <label className={`text-xs block mb-1 ${light ? 'text-gray-500' : 'text-gray-400'}`}>Current Balance</label>
          <input
            type="number"
            step="0.01"
            value={form.current_balance}
            onChange={(e) => setForm({ ...form, current_balance: e.target.value })}
            className={inputCls}
          />
        </div>

        <label className={`flex items-center gap-2 text-sm cursor-pointer ${light ? 'text-gray-700' : 'text-gray-300'}`}>
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
            className={`rounded text-[#d4af37] focus:ring-[#d4af37] ${light ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-800'}`}
          />
          Set as default account
        </label>

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
            {saving ? 'Saving...' : account ? 'Update' : 'Add Account'}
          </button>
        </div>
      </form>
    </div>
  );
}
