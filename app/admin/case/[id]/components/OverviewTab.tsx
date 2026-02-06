import { useState } from 'react';
import type { Application, Signature, Payment, Indemnitor } from '@/lib/bail-types';
import FinanceCard from '@/app/admin/components/FinanceCard';
import type { TabId } from './CaseSidebar';
import { CheckCircle, Circle, ChevronRight, FileSignature, Send } from 'lucide-react';

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  complete: boolean;
  actionLabel: string;
  targetTab: TabId;
  overridable: boolean;
}

function computeChecklist(
  app: Application,
  hasDefendantSig: boolean,
  indemnitors: Indemnitor[],
  hasCard: boolean,
  overrides: Record<string, boolean>,
): ChecklistItem[] {
  const allIndemnitorsComplete = indemnitors.length > 0 && indemnitors.every(i => i.status === 'complete');
  const someInProgress = indemnitors.some(i => i.status === 'in_progress');
  const indemnitorCount = indemnitors.length;

  const quoteSet = !!(app.bond_amount && app.premium);
  const planSet = !!(app.payment_amount && app.next_payment_date);
  const defComplete = !!(app.defendant_phone && app.defendant_email && app.defendant_dob && app.defendant_address && app.defendant_dl_number);
  const dpReceived = !!(app.down_payment && Number(app.down_payment) > 0);

  return [
    {
      key: 'quote',
      label: quoteSet ? 'Quote Confirmed' : 'Confirm Quote',
      description: quoteSet
        ? `Bond $${Number(app.bond_amount).toLocaleString()} · Premium $${Number(app.premium).toLocaleString()}`
        : 'Set the bond amount and premium.',
      complete: quoteSet || !!overrides.quote,
      actionLabel: quoteSet ? 'Update' : 'Set Up',
      targetTab: 'finances',
      overridable: !quoteSet,
    },
    {
      key: 'plan',
      label: planSet ? 'Payment Plan Set' : 'Set Up Payment Plan',
      description: planSet
        ? `$${Number(app.payment_amount).toLocaleString()} per period · Next due ${app.next_payment_date}`
        : 'Configure payment amount and schedule.',
      complete: planSet || !!overrides.plan,
      actionLabel: planSet ? 'Review' : 'Set Up',
      targetTab: 'finances',
      overridable: !planSet,
    },
    {
      key: 'defendant',
      label: defComplete ? 'Defendant Info Complete' : 'Complete Defendant Info',
      description: defComplete
        ? 'All personal details, address, and identification on file.'
        : 'Enter phone, email, DOB, address, and DL number.',
      complete: defComplete || !!overrides.defendant,
      actionLabel: defComplete ? 'View' : 'Complete',
      targetTab: 'defendant',
      overridable: !defComplete,
    },
    {
      key: 'indemnitor',
      label: allIndemnitorsComplete ? 'Indemnitor Info Complete' : 'Add Indemnitor Info',
      description: allIndemnitorsComplete
        ? `All ${indemnitorCount} indemnitor${indemnitorCount > 1 ? 's' : ''} complete.`
        : indemnitorCount === 0
          ? 'No indemnitors added yet.'
          : someInProgress
            ? `${indemnitors.filter(i => i.status === 'complete').length}/${indemnitorCount} indemnitor${indemnitorCount > 1 ? 's' : ''} complete.`
            : `${indemnitorCount} indemnitor${indemnitorCount > 1 ? 's' : ''} pending.`,
      complete: allIndemnitorsComplete || !!overrides.indemnitor,
      actionLabel: allIndemnitorsComplete ? 'View' : indemnitorCount === 0 ? 'Add' : 'Pending',
      targetTab: 'indemnitors',
      overridable: !allIndemnitorsComplete,
    },
    {
      key: 'payment',
      label: dpReceived ? 'Initial Payment Received' : 'Collect Initial Payment',
      description: dpReceived
        ? `Down payment of $${Number(app.down_payment).toLocaleString()} recorded.`
        : 'No down payment recorded yet.',
      complete: dpReceived || !!overrides.payment,
      actionLabel: dpReceived ? 'View Payments' : 'View Payments',
      targetTab: 'finances',
      overridable: !dpReceived,
    },
    {
      key: 'card',
      label: hasCard ? 'Card on File' : 'Collect Card',
      description: hasCard
        ? 'A payment card is stored for this customer.'
        : 'No card on file yet.',
      complete: hasCard || !!overrides.card,
      actionLabel: hasCard ? 'View' : 'Add Card',
      targetTab: 'finances',
      overridable: !hasCard,
    },
    {
      key: 'signatures',
      label: hasDefendantSig ? 'Defendant Signed' : 'Collect Defendant Signature',
      description: hasDefendantSig
        ? 'Defendant signature on file.'
        : 'Defendant has not yet signed.',
      complete: hasDefendantSig || !!overrides.signatures,
      actionLabel: hasDefendantSig ? 'View' : 'Send Link',
      targetTab: 'files',
      overridable: !hasDefendantSig,
    },
    {
      key: 'originals',
      label: app.originals_signed ? 'Originals Signed' : 'Originals Not Signed',
      description: app.originals_signed
        ? 'Physical original documents have been signed.'
        : 'Original paperwork has not been signed yet.',
      complete: !!app.originals_signed,
      actionLabel: app.originals_signed ? 'Signed' : 'Mark Signed',
      targetTab: 'overview',
      overridable: true,
    },
  ];
}

export default function OverviewTab({
  application,
  signatures,
  payments,
  indemnitors,
  onNavigateTab,
  onSaveField,
  onRefresh,
}: {
  application: Application;
  signatures: Signature[];
  payments: Payment[];
  indemnitors: Indemnitor[];
  onNavigateTab: (tab: TabId) => void;
  onSaveField: (fields: Record<string, unknown>) => Promise<void>;
  onRefresh: () => void;
}) {
  const hasDefendantSig = signatures.some((s) => s.signer_role === 'defendant');
  const hasCard = !!application.stripe_payment_method_id;

  // Parse checklist overrides from JSON
  const overrides: Record<string, boolean> = (() => {
    try {
      return application.checklist_overrides ? JSON.parse(application.checklist_overrides) : {};
    } catch {
      return {};
    }
  })();

  const [saving, setSaving] = useState<string | null>(null);

  const checklist = computeChecklist(application, hasDefendantSig, indemnitors, hasCard, overrides);
  const completedCount = checklist.filter((c) => c.complete).length;
  const allComplete = completedCount === checklist.length;

  const premNum = application.premium ? Number(application.premium) : null;
  const totalDue = premNum ?? 0;
  const amountPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = totalDue - amountPaid;

  async function toggleOverride(key: string) {
    setSaving(key);
    const newOverrides = { ...overrides, [key]: !overrides[key] };
    // Remove false entries to keep JSON clean
    if (!newOverrides[key]) delete newOverrides[key];
    await onSaveField({ checklist_overrides: JSON.stringify(newOverrides) });
    onRefresh();
    setSaving(null);
  }

  async function toggleOriginalsSigned() {
    setSaving('originals');
    await onSaveField({ originals_signed: !application.originals_signed });
    onRefresh();
    setSaving(null);
  }

  async function handleAction(item: ChecklistItem) {
    if (item.key === 'originals') {
      await toggleOriginalsSigned();
    } else if (item.targetTab !== 'overview') {
      onNavigateTab(item.targetTab);
    }
  }

  return (
    <div className="space-y-6">
      {/* Finance Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <FinanceCard label="Bond Amount" amount={application.bond_amount} colorClass="bg-green-900/30 border-green-800 text-green-400" />
        <FinanceCard label="Total Due" amount={totalDue || null} colorClass="bg-teal-900/30 border-teal-800 text-teal-400" />
        <FinanceCard label="Premium" amount={premNum} colorClass="bg-zinc-800 border-zinc-700 text-zinc-300" />
        <FinanceCard label="Amount Paid" amount={amountPaid || null} colorClass="bg-orange-900/30 border-orange-800 text-orange-400" />
        <FinanceCard label="Balance" amount={balance || null} colorClass="bg-red-900/30 border-red-800 text-red-400" />
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${
        allComplete
          ? 'bg-green-900/20 border-green-800 text-green-400'
          : 'bg-amber-900/20 border-amber-800 text-amber-400'
      }`}>
        {allComplete ? (
          <CheckCircle className="w-6 h-6 flex-shrink-0" />
        ) : (
          <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )}
        <div>
          <p className="font-bold text-sm">
            {allComplete ? 'Case Ready — All steps complete' : `${checklist.length - completedCount} step${checklist.length - completedCount > 1 ? 's' : ''} to complete before posting bond`}
          </p>
          <p className="text-xs opacity-70 mt-0.5">
            {allComplete
              ? 'All case requirements have been met. This bond can be posted.'
              : 'Complete each item below. Use action buttons or manually mark complete.'}
          </p>
        </div>
      </div>

      {/* Activity Checklist */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#fbbf24]">Overview</h2>
          <span className="text-xs text-zinc-500">{completedCount}/{checklist.length} complete</span>
        </div>
        <div className="space-y-3">
          {checklist.map((item) => {
            const isOverridden = item.key !== 'originals' && !!overrides[item.key];
            const isSaving = saving === item.key;

            return (
              <div
                key={item.key}
                className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${
                  item.complete
                    ? 'bg-green-900/10 border-green-900/30'
                    : 'bg-amber-900/10 border-amber-900/30'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.complete ? (
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      {isOverridden && (
                        <span className="text-[10px] bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">Manual</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Manual mark complete button */}
                  {item.overridable && item.key !== 'originals' && (
                    <button
                      onClick={() => toggleOverride(item.key)}
                      disabled={isSaving}
                      title={item.complete && isOverridden ? 'Undo manual completion' : 'Manually mark complete'}
                      className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-colors disabled:opacity-50 ${
                        item.complete && isOverridden
                          ? 'border-green-800 text-green-400 bg-green-900/30 hover:bg-red-900/30 hover:border-red-800 hover:text-red-400'
                          : 'border-zinc-700 text-zinc-500 hover:text-[#fbbf24] hover:border-[#fbbf24]/50'
                      }`}
                    >
                      {isSaving ? '...' : item.complete && isOverridden ? '✓ Done' : 'Mark Done'}
                    </button>
                  )}

                  {/* Originals signed toggle */}
                  {item.key === 'originals' && (
                    <button
                      onClick={toggleOriginalsSigned}
                      disabled={isSaving}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
                        application.originals_signed
                          ? 'bg-green-900/40 text-green-400 border border-green-800 hover:bg-red-900/30 hover:border-red-800 hover:text-red-400'
                          : 'bg-[#fbbf24] text-zinc-900 hover:bg-[#fcd34d]'
                      }`}
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      {isSaving ? 'Saving...' : application.originals_signed ? 'Signed ✓' : 'Mark Signed'}
                    </button>
                  )}

                  {/* Navigate / Action button */}
                  {item.key !== 'originals' && (
                    <button
                      onClick={() => handleAction(item)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                        item.complete
                          ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                          : 'bg-[#fbbf24] text-zinc-900 hover:bg-[#fcd34d]'
                      }`}
                    >
                      {item.key === 'signatures' && !hasDefendantSig && (
                        <Send className="w-3 h-3" />
                      )}
                      {item.actionLabel}
                      {item.targetTab !== 'overview' && (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
