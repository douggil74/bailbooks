export default function FinanceCard({
  label,
  amount,
  colorClass,
}: {
  label: string;
  amount: number | null;
  colorClass: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${colorClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-xl font-bold mt-1">
        {amount != null ? `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
      </p>
    </div>
  );
}
