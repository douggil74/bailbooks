'use client';

import { useState, useEffect } from 'react';
import EditField from '@/app/admin/components/EditField';
import FinanceCard from '@/app/admin/components/FinanceCard';
import type { CardInfoResponse, Payment } from '@/lib/bail-types';
import CardCollectForm from '@/app/components/CardCollectForm';

interface OpenPower {
  id: string;
  power_number: string;
  amount: number;
  surety: string;
}

interface AssignedPower {
  id: string;
  power_number: string;
  amount: number;
  surety: string;
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'paid': return 'bg-green-900/60 text-green-400';
    case 'pending': return 'bg-yellow-900/60 text-yellow-400';
    case 'failed': return 'bg-red-900/60 text-red-400';
    case 'cancelled': return 'bg-zinc-700 text-zinc-400';
    default: return 'bg-zinc-700 text-zinc-400';
  }
}

function methodBadgeClass(method: string | null) {
  switch (method) {
    case 'card': return 'bg-violet-900/60 text-violet-400';
    case 'cash': return 'bg-green-900/60 text-green-400';
    case 'check': return 'bg-purple-900/60 text-purple-400';
    default: return 'bg-zinc-700 text-zinc-400';
  }
}

export default function FinancesTab({
  applicationId,
  powerNumber,
  setPowerNumber,
  premium,
  setPremium,
  downPayment,
  setDownPayment,
  paymentAmount,
  setPaymentAmount,
  nextPaymentDate,
  setNextPaymentDate,
  saveField,
  saving,
  bondAmount,
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
  payments,
  onRefresh,
}: {
  applicationId: string;
  powerNumber: string;
  setPowerNumber: (v: string) => void;
  premium: string;
  setPremium: (v: string) => void;
  downPayment: string;
  setDownPayment: (v: string) => void;
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  nextPaymentDate: string;
  setNextPaymentDate: (v: string) => void;
  saveField: (fields: Record<string, unknown>) => Promise<void>;
  saving: boolean;
  bondAmount: number | null;
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
  payments: Payment[];
  onRefresh: () => void;
}) {
  const [paymentMode, setPaymentMode] = useState<'full' | 'plan'>(
    payments.length > 0 || (paymentAmount && parseFloat(paymentAmount) > 0) ? 'plan' : 'full'
  );
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
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
  const [openPowers, setOpenPowers] = useState<OpenPower[]>([]);
  const [assignedPower, setAssignedPower] = useState<AssignedPower | null>(null);
  const [powerLoading, setPowerLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    async function loadPowers() {
      try {
        // Fetch all powers to find which is assigned to this case + available open ones
        const res = await fetch('/api/admin/powers');
        const data = await res.json();
        const all = data.powers || [];
        const assigned = all.find(
          (p: { application_id: string | null; status: string }) =>
            p.application_id === applicationId && p.status === 'active'
        );
        if (assigned) {
          setAssignedPower({
            id: assigned.id,
            power_number: assigned.power_number,
            amount: assigned.amount,
            surety: assigned.surety,
          });
        }
        setOpenPowers(
          all
            .filter((p: { status: string }) => p.status === 'open')
            .map((p: { id: string; power_number: string; amount: number; surety: string }) => ({
              id: p.id,
              power_number: p.power_number,
              amount: p.amount,
              surety: p.surety,
            }))
        );
      } catch { /* ignore */ }
      setPowerLoading(false);
    }
    loadPowers();
  }, [applicationId]);

  async function assignPower(powerId: string) {
    setAssigning(true);
    try {
      const res = await fetch('/api/admin/powers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: powerId, application_id: applicationId }),
      });
      if (res.ok) {
        const selected = openPowers.find((p) => p.id === powerId);
        if (selected) {
          setAssignedPower(selected);
          setOpenPowers((prev) => prev.filter((p) => p.id !== powerId));
          // Also save the power_number to the application record
          setPowerNumber(selected.power_number);
          await saveField({ power_number: selected.power_number });
        }
      }
    } catch { /* ignore */ }
    setAssigning(false);
  }

  async function unassignPower() {
    if (!assignedPower) return;
    setAssigning(true);
    try {
      const res = await fetch('/api/admin/powers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignedPower.id }),
      });
      if (res.ok) {
        setOpenPowers((prev) => [
          { id: assignedPower.id, power_number: assignedPower.power_number, amount: assignedPower.amount, surety: assignedPower.surety },
          ...prev,
        ]);
        setAssignedPower(null);
        setPowerNumber('');
        await saveField({ power_number: null });
      }
    } catch { /* ignore */ }
    setAssigning(false);
  }

  const premNum = premium ? parseFloat(premium) : null;
  const dpNum = downPayment ? parseFloat(downPayment) : 0;

  // Compute from actual payment records
  const paidPayments = payments.filter((p) => p.status === 'paid');
  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const amountPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalScheduled = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalDue = premNum ?? 0;
  const balance = totalDue > 0 ? totalDue - amountPaid : totalScheduled - amountPaid;
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
      {/* Finance summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <FinanceCard label="Bond Amount" amount={bondAmount} colorClass="bg-green-900/30 border-green-800 text-green-400" />
        <FinanceCard label="Total Due" amount={totalDue || null} colorClass="bg-teal-900/30 border-teal-800 text-teal-400" />
        <FinanceCard label="Premium" amount={premNum} colorClass="bg-zinc-800 border-zinc-700 text-zinc-300" />
        <FinanceCard label="Amount Paid" amount={amountPaid || null} colorClass="bg-orange-900/30 border-orange-800 text-orange-400" />
        <FinanceCard label="Balance" amount={balance || null} colorClass="bg-red-900/30 border-red-800 text-red-400" />
      </div>

      {/* Agent Fields */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-6 h-6 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
          <h2 className="text-lg font-bold text-[#fbbf24]">Agent Financial Fields</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Power Number</label>
            {powerLoading ? (
              <p className="text-xs text-zinc-500 py-2">Loading powers...</p>
            ) : assignedPower ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white">
                  <span className="font-medium">{assignedPower.power_number}</span>
                  <span className="text-zinc-400 ml-2">— {assignedPower.surety} — ${Number(assignedPower.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <button
                  onClick={unassignPower}
                  disabled={assigning}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  Unassign
                </button>
              </div>
            ) : (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) assignPower(e.target.value);
                }}
                disabled={assigning || openPowers.length === 0}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#fbbf24] disabled:opacity-50"
              >
                <option value="">
                  {openPowers.length === 0 ? 'No open powers' : 'Select a power...'}
                </option>
                {openPowers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.power_number} — {p.surety} — ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
            )}
          </div>
          <EditField
            label="Premium ($)"
            value={premium}
            onChange={setPremium}
            onBlur={() => saveField({ premium: premium ? parseFloat(premium) : null })}
            disabled={saving}
            type="number"
          />
          <EditField
            label="Down Payment ($)"
            value={downPayment}
            onChange={setDownPayment}
            onBlur={() => saveField({ down_payment: downPayment ? parseFloat(downPayment) : null })}
            disabled={saving}
            type="number"
          />
        </div>
      </div>

      {/* Payment Plan Toggle */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-6 h-6 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
          <h2 className="text-lg font-bold text-[#fbbf24]">Payment Plan</h2>
        </div>

        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="paymentMode"
              checked={paymentMode === 'full'}
              onChange={() => setPaymentMode('full')}
              className="accent-[#fbbf24]"
            />
            <span className="text-sm text-zinc-300">Pay in Full</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="paymentMode"
              checked={paymentMode === 'plan'}
              onChange={() => setPaymentMode('plan')}
              className="accent-[#fbbf24]"
            />
            <span className="text-sm text-zinc-300">Pay Over Time</span>
          </label>
        </div>

        {paymentMode === 'plan' && (
          <div className="space-y-4">
            {/* Advisor hint */}
            {!showPlanForm && payments.length === 0 && (
              <div className="bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-lg px-4 py-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-[#fbbf24] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span className="text-xs text-zinc-300">
                  Use the <strong className="text-[#fbbf24]">Plan Advisor</strong> on the right to get AI-suggested payment plans, or set up a custom schedule below.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <EditField
                label="Payment Amount ($)"
                value={paymentAmount}
                onChange={setPaymentAmount}
                onBlur={() => saveField({ payment_amount: paymentAmount ? parseFloat(paymentAmount) : null })}
                disabled={saving}
                type="number"
              />
              <EditField
                label="Next Payment Due"
                value={nextPaymentDate}
                onChange={setNextPaymentDate}
                onBlur={() => saveField({ next_payment_date: nextPaymentDate || null })}
                disabled={saving}
                type="date"
              />
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setPlanTotal(premium);
                    setPlanDown(downPayment);
                    setPlanPayment(paymentAmount);
                    setShowPlanForm(true);
                  }}
                  className="bg-zinc-700 text-zinc-200 text-xs font-bold px-4 py-2 rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  {payments.length > 0 ? 'Restructure' : 'Custom Schedule'}
                </button>
              </div>
            </div>

            {/* Manual Plan Form (secondary to advisor) */}
            {showPlanForm && (
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <h3 className="text-sm font-bold text-[#fbbf24] mb-3">
                  {payments.length > 0 ? 'Restructure Payment Plan' : 'Custom Payment Schedule'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Total Amount ($)</label>
                    <input type="number" value={planTotal} onChange={(e) => setPlanTotal(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#fbbf24]" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Down Payment ($)</label>
                    <input type="number" value={planDown} onChange={(e) => setPlanDown(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#fbbf24]" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Per Payment ($)</label>
                    <input type="number" value={planPayment} onChange={(e) => setPlanPayment(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#fbbf24]" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Frequency</label>
                    <select value={planFreq} onChange={(e) => setPlanFreq(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#fbbf24]">
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Biweekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Start Date</label>
                    <input type="date" value={planStart} onChange={(e) => setPlanStart(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#fbbf24]" />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={createPlan} disabled={planCreating} className="bg-[#fbbf24] text-zinc-900 text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#fcd34d] transition-colors disabled:opacity-50">
                    {planCreating ? 'Creating...' : 'Create Plan'}
                  </button>
                  <button onClick={() => setShowPlanForm(false)} className="text-xs text-zinc-400 hover:text-white px-3 py-2 transition-colors">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Line Items */}
      {payments.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-6 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
            <h2 className="text-lg font-bold text-[#fbbf24]">Payments</h2>
            {hasOverdue && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-900/60 text-red-400 uppercase">
                {pendingPayments.filter(p => p.due_date && new Date(p.due_date + 'T00:00:00') < new Date()).length} overdue
              </span>
            )}
          </div>

          {/* Warnings */}
          {hasOverdue && (
            <div className="bg-orange-900/30 border border-orange-800 rounded-lg p-3 flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-orange-300 font-medium">Payment Overdue</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
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
                    <tr key={p.id} className={`border-b border-zinc-800/50 ${isOverdue ? 'bg-red-900/10' : ''}`}>
                      <td className="py-2.5 pr-4 text-zinc-300">
                        {p.due_date ? new Date(p.due_date + 'T00:00:00').toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-400">{p.description || '—'}</td>
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
                            <button onClick={() => cancelPayment(p.id)} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
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

      {/* Card Management */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-6 h-6 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] text-xs font-bold flex items-center justify-center flex-shrink-0">4</span>
          <h2 className="text-lg font-bold text-[#fbbf24]">Card on File</h2>
        </div>

        {!cardLoading && !cardInfo?.has_card && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-red-300 font-medium">No Card on File</span>
          </div>
        )}

        {cardLoading ? (
          <p className="text-sm text-zinc-500">Loading card info...</p>
        ) : cardInfo?.has_card ? (
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="text-sm font-semibold text-white capitalize">{cardInfo.brand} ending in {cardInfo.last4}</span>
              <span className="text-xs text-zinc-400">exp {cardInfo.exp_month}/{cardInfo.exp_year}</span>
            </div>
            <button onClick={() => setShowCardForm(true)} className="text-xs text-[#fbbf24] hover:text-[#fcd34d] transition-colors">Replace Card</button>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-zinc-500">No card on file</p>
            {!showCardForm && (
              <button onClick={() => setShowCardForm(true)} className="text-xs bg-[#fbbf24] text-zinc-900 font-bold px-3 py-1.5 rounded-lg hover:bg-[#fcd34d] transition-colors">Add Card</button>
            )}
          </div>
        )}

        {showCardForm && (
          <div className="mb-4 max-w-md">
            <CardCollectForm applicationId={applicationId} variant="dark" onSuccess={onCardSuccess} />
            <button onClick={() => setShowCardForm(false)} className="text-xs text-zinc-500 hover:text-zinc-300 mt-2 transition-colors">Cancel</button>
          </div>
        )}

        {cardInfo?.has_card && (
          <div className="border-t border-zinc-800 pt-4">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Charge Card</h3>
            <div className="flex items-end gap-3 max-w-md">
              <div className="flex-1">
                <label className="block text-xs text-zinc-400 mb-1">Amount ($)</label>
                <input type="number" step="0.01" min="0.50" value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} placeholder={paymentAmount || '0.00'} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]" />
              </div>
              <button onClick={onChargeCard} disabled={charging} className="bg-[#fbbf24] text-zinc-900 font-bold text-sm px-5 py-2 rounded-lg hover:bg-[#fcd34d] transition-colors disabled:opacity-50">
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

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setShowRecordForm(true)} className="bg-[#fbbf24] text-zinc-900 text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#fcd34d] transition-colors">
          Record Payment
        </button>
        {pendingPayments.length > 0 && (
          <button onClick={deletePlan} className="bg-red-800 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            Delete Pending
          </button>
        )}
      </div>

      {actionMsg && (
        <p className="text-sm text-green-400">{actionMsg}</p>
      )}

      {/* Record Payment Form */}
      {showRecordForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#fbbf24] mb-3">Record Manual Payment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Amount ($)</label>
              <input type="number" step="0.01" value={recordAmount} onChange={(e) => setRecordAmount(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#fbbf24]" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Method</label>
              <select value={recordMethod} onChange={(e) => setRecordMethod(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#fbbf24]">
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Description</label>
              <input type="text" value={recordDesc} onChange={(e) => setRecordDesc(e.target.value)} placeholder="Optional" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={recordManualPayment} disabled={recordingPayment} className="bg-[#fbbf24] text-zinc-900 text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#fcd34d] transition-colors disabled:opacity-50">
              {recordingPayment ? 'Saving...' : 'Save Payment'}
            </button>
            <button onClick={() => setShowRecordForm(false)} className="text-xs text-zinc-400 hover:text-white px-3 py-2 transition-colors">Cancel</button>
          </div>
        </div>
      )}

    </div>
  );
}
