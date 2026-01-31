'use client';

import { useState } from 'react';
import type { CardInfoResponse, Payment } from '@/lib/bail-types';
import CardCollectForm from '@/app/components/CardCollectForm';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'paid': return 'bg-green-900/60 text-green-400';
    case 'pending': return 'bg-yellow-900/60 text-yellow-400';
    case 'failed': return 'bg-red-900/60 text-red-400';
    case 'cancelled': return 'bg-gray-700 text-gray-400';
    default: return 'bg-gray-700 text-gray-400';
  }
}

function methodBadgeClass(method: string | null) {
  switch (method) {
    case 'card': return 'bg-blue-900/60 text-blue-400';
    case 'cash': return 'bg-green-900/60 text-green-400';
    case 'check': return 'bg-purple-900/60 text-purple-400';
    default: return 'bg-gray-700 text-gray-400';
  }
}

export default function PaymentPlanTab({
  applicationId,
  cardInfo,
  cardLoading,
  showCardForm,
  setShowCardForm,
  chargeAmount,
  setChargeAmount,
  charging,
  chargeMsg,
  onChargeCard,
  onCardSuccess,
  paymentAmount,
  premium,
  downPayment,
  payments,
  onRefresh,
}: {
  applicationId: string;
  cardInfo: CardInfoResponse | null;
  cardLoading: boolean;
  showCardForm: boolean;
  setShowCardForm: (v: boolean) => void;
  chargeAmount: string;
  setChargeAmount: (v: string) => void;
  charging: boolean;
  chargeMsg: string;
  onChargeCard: () => void;
  onCardSuccess: (pmId: string, last4: string, brand: string) => void;
  paymentAmount: string;
  premium: string;
  downPayment: string;
  payments: Payment[];
  onRefresh: () => void;
}) {
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recordAmount, setRecordAmount] = useState('');
  const [recordMethod, setRecordMethod] = useState('cash');
  const [recordDesc, setRecordDesc] = useState('');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planTotal, setPlanTotal] = useState(premium);
  const [planDown, setPlanDown] = useState(downPayment);
  const [planPayment, setPlanPayment] = useState(paymentAmount);
  const [planFreq, setPlanFreq] = useState('monthly');
  const [planStart, setPlanStart] = useState(new Date().toISOString().split('T')[0]);
  const [planCreating, setPlanCreating] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const premNum = premium ? parseFloat(premium) : 0;
  const dpNum = downPayment ? parseFloat(downPayment) : 0;
  const pmtNum = paymentAmount ? parseFloat(paymentAmount) : 0;

  // Compute from actual payment records
  const paidPayments = payments.filter((p) => p.status === 'paid');
  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const amountPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalScheduled = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = premNum > 0 ? premNum - amountPaid : totalScheduled - amountPaid;
  const hasOverdue = pendingPayments.some((p) => p.due_date && new Date(p.due_date + 'T00:00:00') < new Date());

  async function recordManualPayment() {
    const amt = parseFloat(recordAmount);
    if (!amt || amt <= 0) return;
    setRecordingPayment(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          amount: amt,
          type: 'manual',
          payment_method: recordMethod,
          description: recordDesc || `${recordMethod.charAt(0).toUpperCase() + recordMethod.slice(1)} payment`,
        }),
      });
      if (res.ok) {
        setShowRecordForm(false);
        setRecordAmount('');
        setRecordDesc('');
        setActionMsg('Payment recorded');
        onRefresh();
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch { /* ignore */ }
    setRecordingPayment(false);
  }

  async function markPaymentPaid(paymentId: string) {
    await fetch('/api/admin/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: paymentId, status: 'paid', payment_method: 'cash' }),
    });
    onRefresh();
  }

  async function cancelPayment(paymentId: string) {
    await fetch('/api/admin/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: paymentId, status: 'cancelled' }),
    });
    onRefresh();
  }

  async function createPlan() {
    const total = parseFloat(planTotal);
    const dp = parseFloat(planDown) || 0;
    const pmt = parseFloat(planPayment);
    if (!total || !pmt || !planStart) return;
    setPlanCreating(true);
    try {
      const res = await fetch('/api/admin/payments/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          total_amount: total,
          down_payment: dp,
          payment_amount: pmt,
          frequency: planFreq,
          start_date: planStart,
        }),
      });
      if (res.ok) {
        setShowPlanForm(false);
        setActionMsg('Payment plan created');
        onRefresh();
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch { /* ignore */ }
    setPlanCreating(false);
  }

  async function deletePlan() {
    await fetch(`/api/admin/payments/plan?application_id=${applicationId}`, { method: 'DELETE' });
    setActionMsg('Pending payments deleted');
    onRefresh();
    setTimeout(() => setActionMsg(''), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border p-4 bg-green-900/30 border-green-800">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-green-400/70">Status</p>
          <p className="text-lg font-bold text-green-400 mt-1">
            {payments.length > 0 ? (hasOverdue ? 'Overdue' : 'Active') : cardInfo?.has_card ? 'Active' : 'No Card'}
          </p>
        </div>
        <div className="rounded-xl border p-4 bg-gray-800 border-gray-700">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Remaining</p>
          <p className="text-lg font-bold text-white mt-1">{pendingPayments.length}</p>
        </div>
        <div className="rounded-xl border p-4 bg-gray-800 border-gray-700">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Payments</p>
          <p className="text-lg font-bold text-white mt-1">{payments.length}</p>
        </div>
        <div className="rounded-xl border p-4 bg-orange-900/30 border-orange-800">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-400/70">Initial Payment</p>
          <p className="text-lg font-bold text-orange-400 mt-1">
            {dpNum > 0 ? `$${fmt(dpNum)}` : '—'}
          </p>
        </div>
        <div className="rounded-xl border p-4 bg-red-900/30 border-red-800">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400/70">Payment Amount</p>
          <p className="text-lg font-bold text-red-400 mt-1">
            {pmtNum > 0 ? `$${fmt(pmtNum)}` : '—'}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {!cardInfo?.has_card && (
          <button onClick={() => setShowCardForm(true)} className="bg-[#1a4d2e] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#256b3e] transition-colors">
            Add Card
          </button>
        )}
        <button onClick={() => setShowPlanForm(true)} className="bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
          {payments.length > 0 ? 'Restructure' : 'Create Plan'}
        </button>
        <button onClick={() => setShowRecordForm(true)} className="bg-[#d4af37] text-gray-900 text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#e5c55a] transition-colors">
          Record Payment
        </button>
        <a
          href={`/api/onboard/generate-pdf?id=${applicationId}`}
          target="_blank"
          className="bg-gray-700 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          PDF
        </a>
        {pendingPayments.length > 0 && (
          <button onClick={deletePlan} className="bg-red-800 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            Delete Pending
          </button>
        )}
      </div>

      {actionMsg && (
        <p className="text-sm text-green-400">{actionMsg}</p>
      )}

      {/* Warnings */}
      {!cardLoading && !cardInfo?.has_card && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm text-red-300 font-medium">No Card on File — Customer does not have a card on file.</span>
        </div>
      )}
      {hasOverdue && (
        <div className="bg-orange-900/30 border border-orange-800 rounded-lg p-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-orange-300 font-medium">Payment Overdue — One or more payments are past due.</span>
        </div>
      )}

      {/* Record Payment Form */}
      {showRecordForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#d4af37] mb-3">Record Manual Payment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Amount ($)</label>
              <input type="number" step="0.01" value={recordAmount} onChange={(e) => setRecordAmount(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Method</label>
              <select value={recordMethod} onChange={(e) => setRecordMethod(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]">
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <input type="text" value={recordDesc} onChange={(e) => setRecordDesc(e.target.value)} placeholder="Optional" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={recordManualPayment} disabled={recordingPayment} className="bg-[#d4af37] text-gray-900 text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#e5c55a] transition-colors disabled:opacity-50">
              {recordingPayment ? 'Saving...' : 'Save Payment'}
            </button>
            <button onClick={() => setShowRecordForm(false)} className="text-xs text-gray-400 hover:text-white px-3 py-2 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Create/Restructure Plan Form */}
      {showPlanForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#d4af37] mb-3">
            {payments.length > 0 ? 'Restructure Payment Plan' : 'Create Payment Plan'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Total Amount ($)</label>
              <input type="number" value={planTotal} onChange={(e) => setPlanTotal(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Down Payment ($)</label>
              <input type="number" value={planDown} onChange={(e) => setPlanDown(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Per Payment ($)</label>
              <input type="number" value={planPayment} onChange={(e) => setPlanPayment(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Frequency</label>
              <select value={planFreq} onChange={(e) => setPlanFreq(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Start Date</label>
              <input type="date" value={planStart} onChange={(e) => setPlanStart(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={createPlan} disabled={planCreating} className="bg-[#d4af37] text-gray-900 text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#e5c55a] transition-colors disabled:opacity-50">
              {planCreating ? 'Creating...' : 'Create Plan'}
            </button>
            <button onClick={() => setShowPlanForm(false)} className="text-xs text-gray-400 hover:text-white px-3 py-2 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Card section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#d4af37] mb-4">Card on File</h2>
        {cardLoading ? (
          <p className="text-sm text-gray-500">Loading card info...</p>
        ) : cardInfo?.has_card ? (
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="text-sm font-semibold text-white capitalize">{cardInfo.brand} ending in {cardInfo.last4}</span>
              <span className="text-xs text-gray-400">exp {cardInfo.exp_month}/{cardInfo.exp_year}</span>
            </div>
            <button onClick={() => setShowCardForm(true)} className="text-xs text-[#d4af37] hover:text-[#e5c55a] transition-colors">Replace Card</button>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-gray-500">No card on file</p>
            {!showCardForm && (
              <button onClick={() => setShowCardForm(true)} className="text-xs bg-[#d4af37] text-gray-900 font-bold px-3 py-1.5 rounded-lg hover:bg-[#e5c55a] transition-colors">Add Card</button>
            )}
          </div>
        )}

        {showCardForm && (
          <div className="mb-4 max-w-md">
            <CardCollectForm applicationId={applicationId} variant="dark" onSuccess={onCardSuccess} />
            <button onClick={() => setShowCardForm(false)} className="text-xs text-gray-500 hover:text-gray-300 mt-2 transition-colors">Cancel</button>
          </div>
        )}

        {cardInfo?.has_card && (
          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Charge Card</h3>
            <div className="flex items-end gap-3 max-w-md">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Amount ($)</label>
                <input type="number" step="0.01" min="0.50" value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} placeholder={paymentAmount || '0.00'} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4af37]" />
              </div>
              <button onClick={onChargeCard} disabled={charging} className="bg-[#d4af37] text-gray-900 font-bold text-sm px-5 py-2 rounded-lg hover:bg-[#e5c55a] transition-colors disabled:opacity-50">
                {charging ? 'Charging...' : 'Charge Now'}
              </button>
            </div>
            {chargeMsg && (
              <p className={`text-sm mt-2 ${chargeMsg.startsWith('Error') || chargeMsg === 'Charge failed' || chargeMsg === 'Enter a valid amount' ? 'text-red-400' : 'text-green-400'}`}>
                {chargeMsg}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Payment Line Items */}
      {payments.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#d4af37] mb-4">Payments</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
                  <th className="text-left py-2 pr-4">Due Date</th>
                  <th className="text-left py-2 pr-4">Description</th>
                  <th className="text-right py-2 pr-4">Amount</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">Method</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const isOverdue = p.status === 'pending' && p.due_date && new Date(p.due_date + 'T00:00:00') < new Date();
                  return (
                    <tr key={p.id} className={`border-b border-gray-800/50 ${isOverdue ? 'bg-red-900/10' : ''}`}>
                      <td className="py-2.5 pr-4 text-gray-300">
                        {p.due_date ? new Date(p.due_date + 'T00:00:00').toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-400">{p.description || '—'}</td>
                      <td className="py-2.5 pr-4 text-right text-white font-medium">${fmt(Number(p.amount))}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${statusBadgeClass(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        {p.payment_method && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${methodBadgeClass(p.payment_method)}`}>
                            {p.payment_method}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        {p.status === 'pending' && (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => markPaymentPaid(p.id)} className="text-xs text-green-400 hover:text-green-300 transition-colors">
                              Mark Paid
                            </button>
                            <button onClick={() => cancelPayment(p.id)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Balance summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Due</p>
            <p className="text-lg font-bold text-white">
              {premNum > 0 ? `$${fmt(premNum)}` : payments.length > 0 ? `$${fmt(totalScheduled)}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Amount Paid</p>
            <p className="text-lg font-bold text-white">${fmt(amountPaid)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Balance</p>
            <p className={`text-lg font-bold ${balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
              ${fmt(balance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Unaccounted For</p>
            <p className="text-lg font-bold text-white">$0.00</p>
          </div>
        </div>
      </div>
    </div>
  );
}
