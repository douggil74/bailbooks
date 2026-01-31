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

  return [
    {
      label: 'Quote has been Confirmed',
      description: app.bond_amount && app.premium
        ? 'Bond amount and premium are set.'
        : 'Set the bond amount and premium in the Finances tab.',
      complete: !!(app.bond_amount && app.premium),
      actionLabel: app.bond_amount && app.premium ? 'Update' : 'Set Up',
      targetTab: 'finances',
    },
    {
      label: 'Review and Confirm your Payment Plan',
      description: app.payment_plan && app.payment_amount && app.next_payment_date
        ? 'Payment plan is configured.'
        : 'Configure payment amount and schedule.',
      complete: !!(app.payment_amount && app.next_payment_date),
      actionLabel: app.payment_amount ? 'Review' : 'Set Up',
      targetTab: 'finances',
    },
    {
      label: "Defendant's Information is Complete",
      description: 'All personal details, address, and identification on file.',
      complete: !!(app.defendant_phone && app.defendant_email && app.defendant_dob && app.defendant_address && app.defendant_dl_number),
      actionLabel: app.defendant_phone ? 'View' : 'Complete',
      targetTab: 'defendant',
    },
    {
      label: "Indemnitor's Information is Complete",
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
      label: 'Initial Payment Received',
      description: app.down_payment && Number(app.down_payment) > 0
        ? `Down payment of $${Number(app.down_payment).toLocaleString()} recorded.`
        : 'No down payment recorded yet.',
      complete: !!(app.down_payment && Number(app.down_payment) > 0),
      actionLabel: 'View Payments',
      targetTab: 'finances',
    },
    {
      label: 'Card on File',
      description: hasCard
        ? 'A payment card is stored for this customer.'
        : 'No card on file. Collect a card in the Finances tab.',
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
        <FinanceCard label="Premium" amount={premNum} colorClass="bg-gray-800 border-gray-700 text-gray-300" />
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
            {allComplete ? 'Status: Good to go!' : `Action Needed — ${checklist.length - completedCount} item${checklist.length - completedCount > 1 ? 's' : ''} remaining`}
          </p>
          <p className="text-xs opacity-70 mt-0.5">
            {allComplete
              ? 'All case requirements have been met.'
              : 'Complete the items below to finalize this case.'}
          </p>
        </div>
      </div>

      {/* Activity Checklist */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#d4af37] mb-4">Overview</h2>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab(item.targetTab)}
                className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-800 text-[#d4af37] hover:bg-gray-700 transition-colors"
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
