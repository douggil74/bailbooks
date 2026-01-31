'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Calculator, Save, Check, RotateCcw, Sparkles, AlertTriangle } from 'lucide-react';

export default function MobileAppPage() {
  const [name, setName] = useState('');
  const [amt, setAmt] = useState('');
  const [down, setDown] = useState('');
  const [jailFee, setJailFee] = useState('30');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recommendation, setRecommendation] = useState<{ recommendation: number; reason: string } | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [riskScore, setRiskScore] = useState<{ score: number; level: string; color: string; label: string; factors: string[] } | null>(null);

  const bondAmt = parseFloat(amt) || 0;
  const downAmt = parseFloat(down) || 0;
  const jailFeeAmt = parseFloat(jailFee) || 30;

  // Calculations
  const twelvePercent = bondAmt * 0.12;
  const elite = bondAmt * 0.06;
  const buf = bondAmt * 0.005;
  const jail = (bondAmt * 0.02) + jailFeeAmt;
  const ga = bondAmt * 0.035;

  // Auto-calculate 50% down if not manually entered
  const autoDown = twelvePercent * 0.50;
  const actualDown = downAmt > 0 ? downAmt : autoDown;
  const remain = twelvePercent - actualDown;

  // Terms based on bond amount
  const isHighBond = bondAmt >= 100000;
  const term1 = remain > 0 ? remain / (isHighBond ? 3 : 4) : 0;
  const term2 = remain > 0 ? remain / 6 : 0;
  const term3 = remain > 0 ? remain / (isHighBond ? 9 : 10) : 0;

  const term1Label = isHighBond ? '3 mo' : '4 wk';
  const term2Label = isHighBond ? '6 mo' : '6 wk';
  const term3Label = isHighBond ? '9 mo' : '10 wk';

  // Fetch AI recommendation when bond amount changes
  useEffect(() => {
    if (bondAmt > 0 && remain > 0) {
      const timer = setTimeout(() => {
        fetchRecommendation();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setRecommendation(null);
    }
  }, [bondAmt, actualDown, remain]);

  const fetchRecommendation = async () => {
    setLoadingRec(true);
    try {
      // Fetch recommendation and risk score in parallel
      const [recRes, riskRes] = await Promise.all([
        fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bondAmount: bondAmt,
            premium: twelvePercent,
            downPayment: actualDown,
            remaining: remain,
            term1: { label: term1Label, amount: term1 },
            term2: { label: term2Label, amount: term2 },
            term3: { label: term3Label, amount: term3 },
          }),
        }),
        fetch('/api/risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bondAmount: bondAmt,
            premium: twelvePercent,
            downPayment: actualDown,
          }),
        }),
      ]);
      const recData = await recRes.json();
      const riskData = await riskRes.json();
      setRecommendation(recData);
      setRiskScore(riskData);
    } catch (err) {
      console.error('Recommendation error:', err);
    } finally {
      setLoadingRec(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const handleSave = async () => {
    if (!bondAmt) return;

    setSaving(true);
    try {
      await fetch('/api/bonds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'Quick Entry',
          date: new Date().toISOString().split('T')[0],
          amt: bondAmt,
          down: actualDown,
          jailFee: jailFeeAmt,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setName('');
    setAmt('');
    setDown('');
    setJailFee('30');
    setSaved(false);
    setRecommendation(null);
    setRiskScore(null);
  };

  const getTermStyle = (termNum: number) => {
    const isRecommended = recommendation?.recommendation === termNum;
    if (isRecommended) {
      return 'bg-[#d4af37]/20 border-2 border-[#d4af37] rounded-xl p-2';
    }
    return 'p-2';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-6 pt-2">
          <Shield className="w-6 h-6 text-[#d4af37]" />
          <span className="text-lg font-bold text-white">
            Bond <span className="text-[#d4af37]">Calculator</span>
          </span>
        </div>

        {/* Input Card */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 mb-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Client Name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                className="w-full bg-[#0a0a0a] border border-white/20 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Bond Amount *</label>
              <input
                type="number"
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
                placeholder="0"
                className="w-full bg-[#0a0a0a] border border-white/20 rounded-xl px-4 py-4 text-white text-2xl font-bold focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Down Payment</label>
                <input
                  type="number"
                  value={down}
                  onChange={(e) => setDown(e.target.value)}
                  placeholder={autoDown.toFixed(0)}
                  className="w-full bg-[#0a0a0a] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]"
                />
                <p className="text-xs text-gray-500 mt-1">Auto: 50%</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Jail Fee</label>
                <input
                  type="number"
                  value={jailFee}
                  onChange={(e) => setJailFee(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Card */}
        {bondAmt > 0 && (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#d4af37]" />
                Results
              </h3>
              {riskScore && (
                <div
                  className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: `${riskScore.color}20`, color: riskScore.color }}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {riskScore.label}
                </div>
              )}
            </div>

            {/* Risk factors */}
            {riskScore && riskScore.factors.length > 0 && (
              <div className="bg-white/5 rounded-xl p-3 mb-4 text-xs text-gray-400">
                <span className="font-semibold" style={{ color: riskScore.color }}>Why:</span> {riskScore.factors.join(' • ')}
              </div>
            )}

            {/* Premium breakdown */}
            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-gray-400">12% Premium</span>
                <span className="text-white font-bold text-lg">{formatCurrency(twelvePercent)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#d4af37]/20 rounded-xl p-3">
                  <div className="text-[#d4af37] text-xs uppercase">Elite (6%)</div>
                  <div className="text-[#d4af37] font-bold text-lg">{formatCurrency(elite)}</div>
                </div>
                <div className="bg-[#0f3620] rounded-xl p-3">
                  <div className="text-green-400 text-xs uppercase">GA (3.5%)</div>
                  <div className="text-white font-bold text-lg">{formatCurrency(ga)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-gray-400 text-xs uppercase">BUF (0.5%)</div>
                  <div className="text-white font-bold">{formatCurrency(buf)}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-gray-400 text-xs uppercase">Jail (2% + fee)</div>
                  <div className="text-white font-bold">{formatCurrency(jail)}</div>
                </div>
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Down (50%)</span>
                <span className="text-white font-semibold">{formatCurrency(actualDown)}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Remaining</span>
                <span className="text-white font-semibold">{formatCurrency(remain)}</span>
              </div>

              {/* Payment terms with AI recommendation */}
              <div className="bg-[#0a0a0a] rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase mb-3 flex items-center justify-between">
                  <span>Payment Options {isHighBond ? '(Monthly)' : '(Weekly)'}</span>
                  {loadingRec && <Sparkles className="w-3 h-3 text-[#d4af37] animate-pulse" />}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className={`text-center ${getTermStyle(1)}`}>
                    <div className="text-xs text-gray-500">{term1Label}</div>
                    <div className={`font-bold ${recommendation?.recommendation === 1 ? 'text-[#d4af37]' : 'text-white'}`}>
                      {formatCurrency(term1)}
                    </div>
                    {recommendation?.recommendation === 1 && (
                      <Sparkles className="w-3 h-3 text-[#d4af37] mx-auto mt-1" />
                    )}
                  </div>
                  <div className={`text-center ${getTermStyle(2)}`}>
                    <div className="text-xs text-gray-500">{term2Label}</div>
                    <div className={`font-bold ${recommendation?.recommendation === 2 ? 'text-[#d4af37]' : 'text-white'}`}>
                      {formatCurrency(term2)}
                    </div>
                    {recommendation?.recommendation === 2 && (
                      <Sparkles className="w-3 h-3 text-[#d4af37] mx-auto mt-1" />
                    )}
                  </div>
                  <div className={`text-center ${getTermStyle(3)}`}>
                    <div className="text-xs text-gray-500">{term3Label}</div>
                    <div className={`font-bold ${recommendation?.recommendation === 3 ? 'text-[#d4af37]' : 'text-green-400'}`}>
                      {formatCurrency(term3)}
                    </div>
                    {recommendation?.recommendation === 3 && (
                      <Sparkles className="w-3 h-3 text-[#d4af37] mx-auto mt-1" />
                    )}
                  </div>
                </div>
                {recommendation && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-center">
                    <p className="text-xs text-[#d4af37] flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI: {recommendation.reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {bondAmt > 0 && (
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-4 rounded-xl transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Clear
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1a4d2e] hover:bg-[#2d6b45] text-white py-4 rounded-xl transition-colors disabled:opacity-70"
            >
              {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save to Tracker'}
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-gray-600 text-xs mt-6 text-center">
          {isHighBond ? '$100k+ bond = monthly terms' : 'Under $100k = weekly terms'}
        </p>

        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap justify-center gap-3 text-xs">
          <a href="/Elite-Bail-Bonds-Application.pdf" target="_blank" className="text-gray-500 hover:text-[#d4af37] transition-colors">Application</a>
          <span className="text-gray-700">|</span>
          <span className="text-[#d4af37]">Calculator</span>
          <span className="text-gray-700">|</span>
          <a href="/tracker" className="text-gray-500 hover:text-[#d4af37] transition-colors">Tracker</a>
          <span className="text-gray-700">|</span>
          <a href="/quote" className="text-gray-500 hover:text-[#d4af37] transition-colors">Quote</a>
        </div>
      </div>
    </div>
  );
}
