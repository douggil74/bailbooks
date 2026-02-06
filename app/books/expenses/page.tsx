'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import DataTable, { type Column } from '../components/DataTable';
import ExpenseForm from '../components/ExpenseForm';
import type { Expense, ExpenseCategory } from '@/lib/books-types';

const ORG_ID_KEY = 'bailbooks_org_id';

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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const fetchData = useCallback(() => {
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (!orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({ org_id: orgId, page: String(page), per_page: '25' });
    if (categoryFilter) params.set('category_id', categoryFilter);

    fetch(`/api/books/expenses?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setExpenses(d.data || []);
        setTotal(d.total || 0);
        setTotalPages(d.total_pages || 1);
      })
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false));
  }, [categoryFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load categories for filter
  useEffect(() => {
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (!orgId) return;
    fetch(`/api/books/expense-categories?org_id=${orgId}`)
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    await fetch(`/api/books/expenses/${id}`, { method: 'DELETE' });
    fetchData();
  }

  const columns: Column<Expense>[] = [
    {
      key: 'expense_date',
      label: 'Date',
      sortable: true,
      render: (r) => fmtDate(r.expense_date),
    },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'category_name', label: 'Category' },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      className: 'text-right',
      render: (r) => <span className="text-red-400 font-medium">{fmt(r.amount)}</span>,
    },
    { key: 'vendor', label: 'Vendor' },
    { key: 'payment_method', label: 'Method' },
    {
      key: 'id',
      label: '',
      className: 'w-20',
      render: (r) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingExpense(r);
              setShowForm(true);
            }}
            className="p-1 text-gray-500 hover:text-white transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(r.id);
            }}
            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Expenses</h1>
        <button
          onClick={() => {
            setEditingExpense(null);
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#d4af37] text-[#0a0a0a] font-bold rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-3 items-center">
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm appearance-none focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {expenses.length > 0 && (
          <p className="text-xs text-gray-500">
            Page total: <span className="text-red-400 font-medium">{fmt(totalAmount)}</span>
          </p>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm animate-pulse">Loading expenses...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={expenses}
          emptyMessage="No expenses recorded yet"
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

      {/* Modal */}
      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          onClose={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingExpense(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
