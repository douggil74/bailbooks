'use client';

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import type { DashboardData } from '@/lib/books-types';

interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  detail: string;
}

function generateInsights(data: DashboardData): Insight[] {
  const insights: Insight[] = [];

  // Collection rate
  const collectionRate = data.total_premium_earned > 0
    ? (data.total_collected / data.total_premium_earned) * 100
    : 0;

  if (collectionRate >= 80) {
    insights.push({
      type: 'success',
      title: 'Strong collection rate',
      detail: `${collectionRate.toFixed(0)}% of premiums collected. Keep up the momentum.`,
    });
  } else if (collectionRate >= 50) {
    insights.push({
      type: 'info',
      title: 'Collection rate needs attention',
      detail: `${collectionRate.toFixed(0)}% collected. Consider following up on outstanding balances.`,
    });
  } else if (data.total_premium_earned > 0) {
    insights.push({
      type: 'warning',
      title: 'Low collection rate',
      detail: `Only ${collectionRate.toFixed(0)}% collected. Prioritize overdue accounts to improve cash flow.`,
    });
  }

  // Overdue payments
  if (data.overdue_payments > 5) {
    insights.push({
      type: 'warning',
      title: `${data.overdue_payments} overdue payments`,
      detail: 'High number of delinquent accounts. Consider stricter payment terms or collection efforts.',
    });
  } else if (data.overdue_payments > 0) {
    insights.push({
      type: 'info',
      title: `${data.overdue_payments} overdue payment${data.overdue_payments > 1 ? 's' : ''}`,
      detail: 'Follow up soon to prevent further delinquency.',
    });
  }

  // Net income margin
  if (data.total_collected > 0) {
    const margin = ((data.total_collected - data.total_expenses) / data.total_collected) * 100;
    if (margin >= 60) {
      insights.push({
        type: 'success',
        title: 'Healthy profit margin',
        detail: `${margin.toFixed(0)}% net margin. Expenses are well controlled.`,
      });
    } else if (margin >= 30) {
      insights.push({
        type: 'info',
        title: 'Moderate profit margin',
        detail: `${margin.toFixed(0)}% net margin. Review expenses for optimization opportunities.`,
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Thin profit margin',
        detail: `${margin.toFixed(0)}% net margin. Expenses may be eating into profitability.`,
      });
    }
  }

  // Forfeitures
  if (data.forfeitures > 0) {
    insights.push({
      type: 'warning',
      title: `${data.forfeitures} active forfeiture${data.forfeitures > 1 ? 's' : ''}`,
      detail: 'Active forfeitures require immediate attention to minimize financial exposure.',
    });
  }

  // Bond liability vs collected
  if (data.total_bond_liability > 0 && data.total_collected > 0) {
    const liabilityRatio = data.total_bond_liability / data.total_collected;
    if (liabilityRatio > 20) {
      insights.push({
        type: 'info',
        title: 'High bond-to-collection ratio',
        detail: `${liabilityRatio.toFixed(0)}x liability vs collected. Ensure surety reserves are adequate.`,
      });
    }
  }

  // Upcoming courts
  if (data.upcoming_court_dates > 3) {
    insights.push({
      type: 'info',
      title: `${data.upcoming_court_dates} upcoming court dates`,
      detail: 'Busy court schedule ahead. Ensure all defendants are notified.',
    });
  }

  // If no insights, provide a positive default
  if (insights.length === 0) {
    insights.push({
      type: 'success',
      title: 'Looking good',
      detail: 'No issues detected. Keep monitoring your dashboard for changes.',
    });
  }

  return insights;
}

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function AIAdvisor({ data }: { data: DashboardData | null }) {
  const { theme } = useTheme();
  const light = theme === 'light';
  const [expanded, setExpanded] = useState(true);

  if (!data) return null;

  const insights = generateInsights(data);

  const iconMap = {
    success: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    info: <TrendingDown className="w-3.5 h-3.5 text-blue-400" />,
  };

  const bgMap = {
    success: light ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-900/20 border-emerald-800/30',
    warning: light ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/20 border-amber-800/30',
    info: light ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800/30',
  };

  return (
    <div className={`rounded-xl border overflow-hidden ${
      light ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-4 py-3 flex items-center justify-between ${
          light ? 'hover:bg-gray-50' : 'hover:bg-gray-800/50'
        }`}
      >
        <h3 className="text-sm font-bold text-[#d4af37] flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Financial Advisor
        </h3>
        {expanded
          ? <ChevronUp className={`w-4 h-4 ${light ? 'text-gray-400' : 'text-gray-500'}`} />
          : <ChevronDown className={`w-4 h-4 ${light ? 'text-gray-400' : 'text-gray-500'}`} />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {/* Quick summary */}
          <div className={`flex items-center gap-3 text-xs rounded-lg px-3 py-2 ${
            light ? 'bg-gray-50' : 'bg-gray-800/50'
          }`}>
            <DollarSign className="w-4 h-4 text-[#d4af37]" />
            <div>
              <span className={light ? 'text-gray-700' : 'text-gray-300'}>
                {data.total_active_bonds} active bonds
              </span>
              <span className={`mx-1.5 ${light ? 'text-gray-300' : 'text-gray-600'}`}>·</span>
              <span className={light ? 'text-gray-700' : 'text-gray-300'}>
                {fmt(data.total_outstanding)} outstanding
              </span>
              <span className={`mx-1.5 ${light ? 'text-gray-300' : 'text-gray-600'}`}>·</span>
              <span className="text-emerald-400 font-medium">
                {fmt(data.net_income)} net
              </span>
            </div>
          </div>

          {/* Insights */}
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${bgMap[insight.type]}`}
            >
              <div className="mt-0.5">{iconMap[insight.type]}</div>
              <div>
                <div className={`text-xs font-semibold ${light ? 'text-gray-800' : 'text-white'}`}>
                  {insight.title}
                </div>
                <div className={`text-[11px] mt-0.5 leading-relaxed ${light ? 'text-gray-600' : 'text-gray-400'}`}>
                  {insight.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
