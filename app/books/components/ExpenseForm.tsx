'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ExpenseCategory, Expense } from '@/lib/books-types';

const ORG_ID_KEY = 'bailbooks_org_id';

interface ExpenseFormProps {
  expense?: Expense | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ExpenseForm({ expense, onClose, onSaved }: ExpenseFormProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    description: expense?.description || '',
    amount: expense?.amount?.toString() || '',
    category_id: expense?.category_id || '',
    expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
    vendor: expense?.vendor || '',
    payment_method: expense?.payment_method || '',
    reference_number: expense?.reference_number || '',
    notes: expense?.notes || '',
  });

  useEffect(() => {
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (!orgId) return;
    fetch(`/api/books/expense-categories?org_id=${orgId}`)
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (!orgId) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        org_id: orgId,
        amount: parseFloat(form.amount),
        category_id: form.category_id || null,
      };

      const url = expense
        ? `/api/books/expenses/${expense.id}`
        : '/api/books/expenses';
      const method = expense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">
            {expense ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Description *</label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              placeholder="What was this expense for?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Amount *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Date *</label>
              <input
                type="date"
                required
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm appearance-none focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Vendor</label>
              <input
                type="text"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                placeholder="Who was paid?"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Payment Method</label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm appearance-none focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              >
                <option value="">—</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Reference #</label>
            <input
              type="text"
              value={form.reference_number}
              onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              placeholder="Check #, invoice #, etc."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none resize-none"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-[#d4af37] text-[#0a0a0a] font-bold rounded-lg text-sm disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : expense ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
