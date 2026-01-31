import EditField from '@/app/admin/components/EditField';
import FinanceCard from '@/app/admin/components/FinanceCard';

export default function FinancesTab({
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
}: {
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
}) {
  const premNum = premium ? parseFloat(premium) : null;
  const dpNum = downPayment ? parseFloat(downPayment) : 0;
  const totalDue = premNum ?? 0;
  const amountPaid = dpNum;
  const balance = totalDue - amountPaid;

  return (
    <div className="space-y-6">
      {/* Finance summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <FinanceCard label="Bond Amount" amount={bondAmount} colorClass="bg-green-900/30 border-green-800 text-green-400" />
        <FinanceCard label="Total Due" amount={totalDue || null} colorClass="bg-teal-900/30 border-teal-800 text-teal-400" />
        <FinanceCard label="Premium" amount={premNum} colorClass="bg-gray-800 border-gray-700 text-gray-300" />
        <FinanceCard label="Amount Paid" amount={amountPaid || null} colorClass="bg-orange-900/30 border-orange-800 text-orange-400" />
        <FinanceCard label="Balance" amount={balance || null} colorClass="bg-red-900/30 border-red-800 text-red-400" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#d4af37] mb-4">Agent Financial Fields</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <EditField
            label="Power Number"
            value={powerNumber}
            onChange={setPowerNumber}
            onBlur={() => saveField({ power_number: powerNumber || null })}
            disabled={saving}
          />
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
        </div>
      </div>
    </div>
  );
}
