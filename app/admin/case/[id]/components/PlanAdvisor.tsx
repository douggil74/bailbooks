import { useState, useEffect, useCallback } from 'react';

interface PlanAdvisorProps {
  bondAmount: number | null;
  premium: string;
  downPayment: string;
  onApplyPlan: (plan: {
    totalAmount: number;
    downPayment: number;
    paymentAmount: number;
    frequency: string;
  }) => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function PlanAdvisor({
  bondAmount,
  premium: premiumStr,
  downPayment: downStr,
  onApplyPlan,
}: PlanAdvisorProps) {
  const [recommendation, setRecommendation] = useState<{ recommendation: number; reason: string } | null>(null);
  const [riskScore, setRiskScore] = useState<{ score: number; level: string; color: string; label: string; factors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);

  const bond = bondAmount ?? 0;
  const computedPremium = bond * 0.12;
  const premNum = premiumStr ? parseFloat(premiumStr) : 0;
  const actualPremium = premNum > 0 ? premNum : computedPremium;
  const downNum = downStr ? parseFloat(downStr) : 0;
  const autoDown = actualPremium * 0.5;
  const actualDown = downNum > 0 ? downNum : autoDown;
  const remaining = actualPremium - actualDown;

  // Commission breakdown
  const elite = bond * 0.06;
  const ga = bond * 0.035;
  const buf = bond * 0.005;

  // Terms based on bond amount
  const isHighBond = bond >= 100000;
  const term1Amt = remaining > 0 ? remaining / (isHighBond ? 3 : 4) : 0;
  const term2Amt = remaining > 0 ? remaining / 6 : 0;
  const term3Amt = remaining > 0 ? remaining / (isHighBond ? 9 : 10) : 0;

  const term1Label = isHighBond ? '3 mo' : '4 wk';
  const term2Label = isHighBond ? '6 mo' : '6 wk';
  const term3Label = isHighBond ? '9 mo' : '10 wk';
  const frequency = isHighBond ? 'monthly' : 'weekly';

  const terms = [
    { num: 1, label: term1Label, amount: term1Amt },
    { num: 2, label: term2Label, amount: term2Amt },
    { num: 3, label: term3Label, amount: term3Amt },
  ];

  const fetchAdvice = useCallback(async () => {
    if (bond <= 0 || remaining <= 0) {
      setRecommendation(null);
      setRiskScore(null);
      return;
    }
    setLoading(true);
    try {
      const [recRes, riskRes] = await Promise.all([
        fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bondAmount: bond,
            premium: actualPremium,
            downPayment: actualDown,
            remaining,
            term1: { label: term1Label, amount: term1Amt },
            term2: { label: term2Label, amount: term2Amt },
            term3: { label: term3Label, amount: term3Amt },
          }),
        }),
        fetch('/api/risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bondAmount: bond,
            premium: actualPremium,
            downPayment: actualDown,
          }),
        }),
      ]);
      const recData = await recRes.json();
      const riskData = await riskRes.json();
      setRecommendation(recData);
      setRiskScore(riskData);
      if (recData.recommendation) setSelectedTerm(recData.recommendation);
    } catch { /* ignore */ }
    setLoading(false);
  }, [bond, actualPremium, actualDown, remaining, term1Amt, term2Amt, term3Amt, term1Label, term2Label, term3Label]);

  useEffect(() => {
    const timer = setTimeout(fetchAdvice, 400);
    return () => clearTimeout(timer);
  }, [fetchAdvice]);

  function handleApply() {
    if (!selectedTerm) return;
    const term = terms[selectedTerm - 1];
    setApplying(true);
    onApplyPlan({
      totalAmount: actualPremium,
      downPayment: actualDown,
      paymentAmount: Math.round(term.amount * 100) / 100,
      frequency,
    });
    setTimeout(() => setApplying(false), 1000);
  }

  if (bond <= 0) {
    return (
      <div className="hidden xl:block w-80 flex-shrink-0 self-start sticky top-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-[#fbbf24] mb-3">Plan Advisor</h3>
          <p className="text-xs text-zinc-500">Enter a bond amount on the case to get AI-suggested payment plans.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden xl:flex flex-col w-80 flex-shrink-0 self-start sticky top-4 gap-4">
      {/* Advisor widget */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#fbbf24] flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Plan Advisor
          </h3>
          {riskScore && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${riskScore.color}20`, color: riskScore.color }}
            >
              {riskScore.label}
            </span>
          )}
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Premium breakdown — compact */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">12% Premium</span>
              <span className="text-white font-semibold">{fmt(actualPremium)}</span>
            </div>
            <div className="flex gap-2 text-[10px]">
              <span className="bg-[#fbbf24]/10 text-[#fbbf24] px-1.5 py-0.5 rounded">Elite 6%: {fmt(elite)}</span>
              <span className="bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded">GA 3.5%: {fmt(ga)}</span>
              <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">BUF: {fmt(buf)}</span>
            </div>
          </div>

          {/* Down + Remaining */}
          <div className="bg-zinc-800/50 rounded-lg p-2.5 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Down Payment</span>
              <span className="text-white font-medium">{fmt(actualDown)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Remaining</span>
              <span className="text-[#fbbf24] font-semibold">{fmt(remaining)}</span>
            </div>
          </div>

          {/* Risk factors */}
          {riskScore && riskScore.factors.length > 0 && (
            <div className="text-[10px] text-zinc-500 leading-relaxed">
              {riskScore.factors.join(' \u2022 ')}
            </div>
          )}

          {/* Payment terms */}
          {remaining > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  Suggested Plans {isHighBond ? '(Monthly)' : '(Weekly)'}
                </span>
                {loading && (
                  <svg className="w-3 h-3 text-[#fbbf24] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
              </div>

              <div className="space-y-1.5">
                {terms.map((t) => {
                  const isRec = recommendation?.recommendation === t.num;
                  const isSel = selectedTerm === t.num;
                  return (
                    <button
                      key={t.num}
                      onClick={() => setSelectedTerm(t.num)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all ${
                        isSel
                          ? 'bg-[#fbbf24]/15 border-2 border-[#fbbf24] text-white'
                          : 'bg-zinc-800/50 border border-zinc-700 text-zinc-300 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSel ? 'border-[#fbbf24]' : 'border-zinc-600'
                        }`}>
                          {isSel && <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />}
                        </span>
                        <span className="font-medium">{t.label}</span>
                        {isRec && (
                          <span className="text-[9px] font-bold text-[#fbbf24] bg-[#fbbf24]/10 px-1.5 py-0.5 rounded-full uppercase">
                            AI Pick
                          </span>
                        )}
                      </div>
                      <span className={`font-bold ${isSel ? 'text-[#fbbf24]' : ''}`}>
                        {fmt(t.amount)}
                        <span className="text-zinc-500 font-normal">{isHighBond ? '/mo' : '/wk'}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* AI reason */}
              {recommendation && (
                <div className="flex items-start gap-1.5 text-[10px] text-[#fbbf24]/80 bg-[#fbbf24]/5 rounded-lg px-2.5 py-2">
                  <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  {recommendation.reason}
                </div>
              )}

              {/* Apply button */}
              <button
                onClick={handleApply}
                disabled={!selectedTerm || applying}
                className="w-full bg-[#fbbf24] text-[#0a0a0a] text-xs font-bold py-2.5 rounded-lg hover:bg-[#fcd34d] transition-colors disabled:opacity-40"
              >
                {applying ? 'Applied!' : 'Apply Selected Plan'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
        <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">Quick Reference</h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Bond</span>
            <span className="text-white font-medium">{fmt(bond)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Premium Rate</span>
            <span className="text-zinc-300">12%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Down % of Premium</span>
            <span className="text-zinc-300">{actualPremium > 0 ? Math.round((actualDown / actualPremium) * 100) : 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Term Style</span>
            <span className="text-zinc-300">{isHighBond ? 'Monthly ($100k+)' : 'Weekly'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
