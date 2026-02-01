import type { Application, Signature, Payment, Indemnitor } from '@/lib/bail-types';
import FinanceCard from '@/app/admin/components/FinanceCard';
import type { TabId } from './CaseSidebar';

interface ChecklistItem {
  label: string;
  description: string;
  complete: boolean;
  actionLabel: string;
  targetTab: TabId;
}

function computeChecklist(
  app: Application,
  hasDefendantSig: boolean,
  indemnitors: Indemnitor[],
  hasCard: boolean,
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
      label: quoteSet ? 'Quote Confirmed' : 'Confirm Quote',
      description: quoteSet
        ? `Bond $${Number(app.bond_amount).toLocaleString()} · Premium $${Number(app.premium).toLocaleString()}`
        : 'Set the bond amount and premium.',
      complete: quoteSet,
      actionLabel: quoteSet ? 'Update' : 'Set Up',
      targetTab: 'finances',
    },
    {
      label: planSet ? 'Payment Plan Set' : 'Set Up Payment Plan',
      description: planSet
        ? `$${Number(app.payment_amount).toLocaleString()} per period · Next due ${app.next_payment_date}`
        : 'Configure payment amount and schedule.',
      complete: planSet,
      actionLabel: planSet ? 'Review' : 'Set Up',
      targetTab: 'finances',
    },
    {
      label: defComplete ? 'Defendant Info Complete' : 'Complete Defendant Info',
      description: defComplete
        ? 'All personal details, address, and identification on file.'
        : 'Enter phone, email, DOB, address, and DL number.',
      complete: defComplete,
      actionLabel: defComplete ? 'View' : 'Complete',
      targetTab: 'defendant',
    },
    {
      label: allIndemnitorsComplete ? 'Indemnitor Info Complete' : 'Add Indemnitor Info',
      description: allIndemnitorsComplete
        ? `All ${indemnitorCount} indemnitor${indemnitorCount > 1 ? 's' : ''} complete.`
        : indemnitorCount === 0
          ? 'No indemnitors added yet.'
          : someInProgress
            ? `${indemnitors.filter(i => i.status === 'complete').length}/${indemnitorCount} indemnitor${indemnitorCount > 1 ? 's' : ''} complete.`
            : `${indemnitorCount} indemnitor${indemnitorCount > 1 ? 's' : ''} pending.`,
      complete: allIndemnitorsComplete,
      actionLabel: allIndemnitorsComplete ? 'View' : indemnitorCount === 0 ? 'Add' : 'Pending',
      targetTab: 'indemnitors',
    },
    {
      label: dpReceived ? 'Initial Payment Received' : 'Collect Initial Payment',
      description: dpReceived
        ? `Down payment of $${Number(app.down_payment).toLocaleString()} recorded.`
        : 'No down payment recorded yet.',
      complete: dpReceived,
      actionLabel: dpReceived ? 'View Payments' : 'View Payments',
      targetTab: 'finances',
    },
    {
      label: hasCard ? 'Card on File' : 'Collect Card',
      description: hasCard
        ? 'A payment card is stored for this customer.'
        : 'No card on file yet.',
      complete: hasCard,
      actionLabel: hasCard ? 'View' : 'Add Card',
      targetTab: 'finances',
    },
  ];
}

export default function OverviewTab({
  application,
  signatures,
  payments,
  indemnitors,
  onNavigateTab,
}: {
  application: Application;
  signatures: Signature[];
  payments: Payment[];
  indemnitors: Indemnitor[];
  onNavigateTab: (tab: TabId) => void;
}) {
  const hasDefendantSig = signatures.some((s) => s.signer_role === 'defendant');
  const hasCard = !!application.stripe_payment_method_id;

  const checklist = computeChecklist(application, hasDefendantSig, indemnitors, hasCard);
  const completedCount = checklist.filter((c) => c.complete).length;
  const allComplete = completedCount === checklist.length;

  const premNum = application.premium ? Number(application.premium) : null;
  const totalDue = premNum ?? 0;
  const amountPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = totalDue - amountPaid;

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
        <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {allComplete ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          )}
        </svg>
        <div>
          <p className="font-bold text-sm">
            {allComplete ? 'Case Ready — All steps complete' : `${checklist.length - completedCount} step${checklist.length - completedCount > 1 ? 's' : ''} to complete before posting bond`}
          </p>
          <p className="text-xs opacity-70 mt-0.5">
            {allComplete
              ? 'All case requirements have been met. This bond can be posted.'
              : 'Complete each item below. Gold buttons show next actions.'}
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
          {checklist.map((item) => (
            <div
              key={item.label}
              className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${
                item.complete
                  ? 'bg-green-900/10 border-green-900/30'
                  : 'bg-amber-900/10 border-amber-900/30'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.complete ? (
                  <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
                  </svg>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{item.description}</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab(item.targetTab)}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  item.complete
                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                    : 'bg-[#fbbf24] text-zinc-900 hover:bg-[#fcd34d]'
                }`}
              >
                {item.actionLabel}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
