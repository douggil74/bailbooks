import type { LucideIcon } from 'lucide-react';

export default function KPICard({
  label,
  value,
  icon: Icon,
  format = 'currency',
  colorClass = 'border-gray-800',
}: {
  label: string;
  value: number | null;
  icon?: LucideIcon;
  format?: 'currency' | 'number';
  colorClass?: string;
}) {
  const formatted =
    value == null
      ? '—'
      : format === 'currency'
        ? `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : Number(value).toLocaleString('en-US');

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 ${colorClass}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </p>
        {Icon && <Icon className="w-4 h-4 text-gray-600" />}
      </div>
      <p className="text-xl font-bold text-white">{formatted}</p>
    </div>
  );
}
