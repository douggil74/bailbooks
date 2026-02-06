'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, UserPlus, Building2, Check } from 'lucide-react';
import type { Organization, OrgUser, ExpenseCategory } from '@/lib/books-types';

const ORG_ID_KEY = 'bailbooks_org_id';

export default function SettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Setup form
  const [showSetup, setShowSetup] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');

  // New category
  const [newCatName, setNewCatName] = useState('');

  // Org form state
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: 'LA',
    zip: '',
    license_number: '',
    surety_company: '',
    premium_rate: '0.12',
  });

  useEffect(() => {
    const orgId = localStorage.getItem(ORG_ID_KEY);
    if (!orgId) {
      setShowSetup(true);
      setLoading(false);
      return;
    }
    loadData(orgId);
  }, []);

  async function loadData(orgId: string) {
    setLoading(true);
    try {
      const [orgRes, usersRes, catsRes] = await Promise.all([
        fetch(`/api/books/org?org_id=${orgId}`).then((r) => r.json()),
        fetch(`/api/books/org/users?org_id=${orgId}`).then((r) => r.json()),
        fetch(`/api/books/expense-categories?org_id=${orgId}`).then((r) => r.json()),
      ]);

      if (orgRes.organization) {
        setOrg(orgRes.organization);
        setForm({
          name: orgRes.organization.name || '',
          phone: orgRes.organization.phone || '',
          address: orgRes.organization.address || '',
          city: orgRes.organization.city || '',
          state: orgRes.organization.state || 'LA',
          zip: orgRes.organization.zip || '',
          license_number: orgRes.organization.license_number || '',
          surety_company: orgRes.organization.surety_company || '',
          premium_rate: String(orgRes.organization.premium_rate || 0.12),
        });
      }
      setUsers(usersRes.users || []);
      setCategories(catsRes.categories || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/books/org/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: setupName, owner_email: setupEmail }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      localStorage.setItem(ORG_ID_KEY, data.organization.id);
      setShowSetup(false);
      loadData(data.organization.id);
      setMessage('Organization created successfully!');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setSaving(false);
    }
  }

  const formRef = useRef(form);
  formRef.current = form;

  const saveOrg = useCallback(async () => {
    if (!org) return;
    setSaving(true);
    try {
      const current = formRef.current;
      const res = await fetch('/api/books/org', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: org.id, ...current, premium_rate: parseFloat(current.premium_rate) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOrg(data.organization);
      setMessage('Saved');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [org]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!org) return;
    try {
      const res = await fetch('/api/books/org/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: org.id, email: inviteEmail, display_name: inviteName, role: inviteRole }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUsers([...users, data.user]);
      setInviteEmail('');
      setInviteName('');
      setMessage('User added');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to add user');
    }
  }

  async function handleRemoveUser(id: string) {
    if (!confirm('Remove this user?')) return;
    await fetch(`/api/books/org/users?id=${id}`, { method: 'DELETE' });
    setUsers(users.filter((u) => u.id !== id));
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!org || !newCatName.trim()) return;
    try {
      const res = await fetch('/api/books/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: org.id, name: newCatName.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCategories([...categories, data.category]);
      setNewCatName('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to add category');
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Delete this category?')) return;
    await fetch(`/api/books/expense-categories?id=${id}`, { method: 'DELETE' });
    setCategories(categories.filter((c) => c.id !== id));
  }

  // Clear message after 3s
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center animate-pulse">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Setup Screen
  if (showSetup) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Set Up BailBooks</h1>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-6 h-6 text-[#d4af37]" />
            <p className="text-gray-300 text-sm">Create your organization to get started.</p>
          </div>
          <form onSubmit={handleSetup} className="space-y-4">
            {message && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
                {message}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                placeholder="Your bail bonds company name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Owner Email *</label>
              <input
                type="email"
                required
                value={setupEmail}
                onChange={(e) => setSetupEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
                placeholder="admin@company.com"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 bg-[#d4af37] text-[#0a0a0a] font-bold rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Organization'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-purple-500/20 text-purple-400',
    agent: 'bg-blue-500/20 text-blue-400',
    bookkeeper: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        {message && (
          <span className="flex items-center gap-1 text-sm text-[#d4af37] font-medium">
            {message === 'Saved' && <Check className="w-3.5 h-3.5" />}
            {message}
          </span>
        )}
      </div>

      {/* Organization Details */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#d4af37]" />
          Organization Details
        </h2>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Company Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={saveOrg}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                onBlur={saveOrg}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              onBlur={saveOrg}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                onBlur={saveOrg}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                onBlur={saveOrg}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">ZIP</label>
              <input
                type="text"
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                onBlur={saveOrg}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">License #</label>
              <input
                type="text"
                value={form.license_number}
                onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                onBlur={saveOrg}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Surety Company</label>
              <input
                type="text"
                value={form.surety_company}
                onChange={(e) => setForm({ ...form, surety_company: e.target.value })}
                onBlur={saveOrg}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Premium Rate</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={form.premium_rate}
                onChange={(e) => setForm({ ...form, premium_rate: e.target.value })}
                onBlur={saveOrg}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expense Categories */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-white mb-4">Expense Categories</h2>
        <div className="space-y-2 mb-4">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg">
              <div>
                <span className="text-sm text-white">{cat.name}</span>
                {cat.description && <span className="text-xs text-gray-500 ml-2">{cat.description}</span>}
              </div>
              {!cat.is_default && (
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New category name"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </form>
      </div>

      {/* Users */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#d4af37]" />
          Team Members
        </h2>
        <div className="space-y-2 mb-4">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-sm text-white">{u.display_name || u.email}</span>
                  {u.display_name && <span className="text-xs text-gray-500 ml-2">{u.email}</span>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || 'bg-gray-500/20 text-gray-400'}`}>
                  {u.role}
                </span>
              </div>
              <button
                onClick={() => handleRemoveUser(u.id)}
                className="p-1 text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={handleInvite} className="flex flex-wrap gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email"
            required
            className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          />
          <input
            type="text"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Name"
            className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm appearance-none focus:ring-2 focus:ring-[#d4af37] focus:outline-none"
          >
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
            <option value="bookkeeper">Bookkeeper</option>
          </select>
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
