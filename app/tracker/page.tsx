'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Plus, Trash2, Download, Save, FileText, X, Check, Sparkles, CheckCircle, Phone, Star, ArrowRight } from 'lucide-react';
import CommandBar from '@/app/command/components/CommandBar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BondRow {
  id: number;
  name: string;
  phone: string;
  date: string;
  amt: number;
  down: number;
  jailFee: number;
  status: 'active' | 'paid_off';
}

export default function TrackerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<BondRow[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [recommendations, setRecommendations] = useState<Record<number, { recommendation: number; reason: string }>>({});
  const [showThankYou, setShowThankYou] = useState<BondRow | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paid_off'>('active');
  const [creatingCase, setCreatingCase] = useState<number | null>(null);

  // Load data from database on mount
  useEffect(() => {
    fetchBonds();
  }, []);

  // Auto-refresh every 5 seconds to sync across devices
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchBondsQuiet();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Quiet fetch (no loading state) for background sync
  const fetchBondsQuiet = async () => {
    try {
      const res = await fetch('/api/bonds');
      if (res.ok) {
        const data = await res.json();
        setRows(data);
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
  };

  const fetchBonds = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/bonds');
      if (res.ok) {
        const data = await res.json();
        setRows(data);
      }
    } catch (err) {
      console.error('Failed to fetch bonds:', err);
    } finally {
      setLoading(false);
    }
  };


  const addRow = async () => {
    const newRow: BondRow = {
      id: Date.now(), // Temporary ID
      name: '',
      phone: '',
      date: new Date().toISOString().split('T')[0],
      amt: 0,
      down: 0,
      jailFee: 30,
      status: 'active',
    };

    // Optimistic update
    setRows([newRow, ...rows]);

    try {
      const res = await fetch('/api/bonds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRow),
      });

      if (res.ok) {
        const savedRow = await res.json();
        // Replace temp row with saved row (has real ID)
        setRows(prev => prev.map(r => r.id === newRow.id ? savedRow : r));
      }
    } catch (err) {
      console.error('Failed to add bond:', err);
    }
  };

  // Auto-save timeout ref
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  const updateRow = (id: number, field: keyof BondRow, value: string | number) => {
    setRows(prevRows => {
      const newRows = prevRows.map(row => {
        if (row.id !== id) return row;

        const updated = { ...row, [field]: value };

        // Auto-calculate 50% down when amt changes
        if (field === 'amt') {
          const amt = parseFloat(value as string) || 0;
          const twelvePercent = amt * 0.12;
          const fiftyPercentDown = twelvePercent * 0.50;
          // Only auto-set if down is 0 or was previously auto-calculated
          const oldTwelvePercent = row.amt * 0.12;
          const wasAutoCalculated = row.down === 0 || Math.abs(row.down - (oldTwelvePercent * 0.50)) < 1;
          if (wasAutoCalculated) {
            updated.down = fiftyPercentDown;
          }
        }

        // Auto-save this row after short delay
        if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
        autoSaveTimeout.current = setTimeout(() => {
          saveRowToDb(updated);
          setSaveMessage('Synced');
          setTimeout(() => setSaveMessage(''), 1500);
        }, 1000);

        // Fetch AI recommendation when amt or down changes
        if (field === 'amt' || field === 'down') {
          if (recTimeout.current[id]) clearTimeout(recTimeout.current[id]);
          recTimeout.current[id] = setTimeout(() => {
            fetchRecommendation(updated);
          }, 800);
        }

        return updated;
      });
      return newRows;
    });
  };

  // Debounced save to database
  const saveRowToDb = async (row: BondRow) => {
    try {
      await fetch('/api/bonds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
    } catch (err) {
      console.error('Failed to update bond:', err);
    }
  };

  // Fetch AI recommendation for a row
  const fetchRecommendation = async (row: BondRow) => {
    if (row.amt <= 0) return;

    const calc = calculateValues(row.amt, row.down, row.jailFee);
    if (calc.remain <= 0) return;

    const term1Label = calc.isHighBond ? '3 mo' : '4 wk';
    const term2Label = calc.isHighBond ? '6 mo' : '6 wk';
    const term3Label = calc.isHighBond ? '9 mo' : '10 wk';

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bondAmount: row.amt,
          premium: calc.twelvePercent,
          downPayment: row.down || calc.twelvePercent * 0.5,
          remaining: calc.remain,
          term1: { label: term1Label, amount: calc.term1 },
          term2: { label: term2Label, amount: calc.term2 },
          term3: { label: term3Label, amount: calc.term3 },
        }),
      });
      const data = await res.json();
      setRecommendations(prev => ({ ...prev, [row.id]: data }));
    } catch (err) {
      console.error('Recommendation error:', err);
    }
  };

  // Recommendation timeout ref
  const recTimeout = useRef<Record<number, NodeJS.Timeout>>({});

  const deleteRow = async (id: number) => {
    // Optimistic update
    setRows(rows.filter(row => row.id !== id));

    try {
      await fetch(`/api/bonds?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete bond:', err);
      // Revert on error
      fetchBonds();
    }
  };

  const markAsPaidOff = async (row: BondRow) => {
    const updatedRow = { ...row, status: 'paid_off' as const };

    // Optimistic update
    setRows(rows.map(r => r.id === row.id ? updatedRow : r));

    try {
      await fetch('/api/bonds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRow),
      });
      // Show thank you modal
      setShowThankYou(updatedRow);
    } catch (err) {
      console.error('Failed to mark as paid off:', err);
      fetchBonds();
    }
  };

  const startCase = async (row: BondRow) => {
    setCreatingCase(row.id);
    try {
      // Split name into first/last
      const parts = row.name.trim().split(/\s+/);
      const first = parts[0] || 'Unknown';
      const last = parts.slice(1).join(' ') || 'Unknown';

      // 1. Create the case
      const res = await fetch('/api/onboard/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defendant_first: first, defendant_last: last }),
      });
      const data = await res.json();
      if (!res.ok || !data.id) {
        alert('Failed to create case');
        setCreatingCase(null);
        return;
      }

      // 2. Populate with tracker data
      const calc = calculateValues(row.amt, row.down, row.jailFee);
      await fetch('/api/admin/case', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: data.id,
          bond_amount: row.amt,
          premium: calc.twelvePercent,
          down_payment: row.down,
          defendant_phone: row.phone || null,
          bond_date: row.date || null,
        }),
      });

      // 3. Navigate to the new case
      window.location.href = `/admin/case/${data.id}`;
    } catch {
      alert('Failed to create case');
      setCreatingCase(null);
    }
  };

  const calculateValues = (amt: number, down: number, jailFee: number) => {
    const twelvePercent = amt * 0.12;
    const elite = amt * 0.06;   // 6%
    const buf = amt * 0.005;    // 0.5% Build Up Fund
    const jail = (amt * 0.02) + jailFee;  // 2% + fee
    const ga = amt * 0.035;     // 3.5%
    const remain = twelvePercent - down;
    const isHighBond = amt >= 100000;

    // Payment terms: weekly for bonds < $100k, monthly for bonds >= $100k
    let term1 = 0, term2 = 0, term3 = 0;
    if (remain > 0) {
      if (isHighBond) {
        // Monthly: 3, 6, 9 months (convert to ~4.33 weeks per month)
        term1 = remain / 3;   // 3 months
        term2 = remain / 6;   // 6 months
        term3 = remain / 9;   // 9 months
      } else {
        // Weekly: 4, 6, 10 weeks
        term1 = remain / 4;
        term2 = remain / 6;
        term3 = remain / 10;
      }
    }
    const totalCollected = down + remain;

    return { twelvePercent, elite, buf, jail, ga, remain, term1, term2, term3, totalCollected, jailFee, isHighBond };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Date of Bond', 'Amt', '12%', 'Jail', 'Jail Fee', 'Down', 'Remain', 'Term1', 'Term2', 'Term3', 'TermType', 'Elite', 'BUF', 'GA'];
    const csvRows = rows.map(row => {
      const calc = calculateValues(row.amt, row.down, row.jailFee);
      return [
        row.name,
        row.date,
        row.amt,
        calc.twelvePercent.toFixed(2),
        calc.jail.toFixed(2),
        row.jailFee.toFixed(2),
        row.down.toFixed(2),
        calc.remain.toFixed(2),
        calc.term1.toFixed(2),
        calc.term2.toFixed(2),
        calc.term3.toFixed(2),
        calc.isHighBond ? 'Monthly(3/6/9)' : 'Weekly(4/6/10)',
        calc.elite.toFixed(2),
        calc.buf.toFixed(2),
        calc.ga.toFixed(2),
      ].join(',');
    });

    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bailbonds-tracker-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleSave = async () => {
    setSyncing(true);
    setSaveMessage('Saving...');

    try {
      // Save all rows to database
      await Promise.all(rows.map(row => saveRowToDb(row)));
      setSaveMessage('Saved!');
    } catch (err) {
      setSaveMessage('Error!');
      console.error('Failed to save:', err);
    } finally {
      setSyncing(false);
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  const openPdfModal = () => {
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setDateFrom(firstDay);
    setDateTo(lastDay);
    setShowPdfModal(true);
  };

  const exportToPdf = () => {
    // Filter rows by date range
    const filteredRows = rows.filter(row => {
      if (!row.date) return false;
      const rowDate = new Date(row.date);
      const from = dateFrom ? new Date(dateFrom) : new Date('1900-01-01');
      const to = dateTo ? new Date(dateTo) : new Date('2100-01-01');
      return rowDate >= from && rowDate <= to;
    });

    if (filteredRows.length === 0) {
      alert('No bonds found in selected date range');
      return;
    }

    const doc = new jsPDF('landscape');

    // Company name
    doc.setFontSize(22);
    doc.setTextColor(212, 175, 55); // Gold color
    doc.setFont('helvetica', 'bold');
    doc.text('BailBonds Financed', 14, 18);

    // Address and contact
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.setFont('helvetica', 'normal');
    doc.text('St. Tammany Parish, Louisiana', 14, 24);
    doc.text('Phone: 985-264-9519 | Affiliate of Louisiana Bail Agents', 14, 29);

    // Report info - right aligned
    doc.setFontSize(10);
    doc.setTextColor(100);
    const pageWidth = doc.internal.pageSize.getWidth();
    const dateRangeText = `Report Period: ${dateFrom || 'All Dates'} to ${dateTo || 'All Dates'}`;
    doc.text(dateRangeText, pageWidth - 14, 18, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 24, { align: 'right' });

    // Divider line
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(14, 34, pageWidth - 14, 34);

    // Table data
    const tableData = filteredRows.map(row => {
      const calc = calculateValues(row.amt, row.down, row.jailFee);
      const t1Label = calc.isHighBond ? '3mo' : '4wk';
      const t2Label = calc.isHighBond ? '6mo' : '6wk';
      const t3Label = calc.isHighBond ? '9mo' : '10wk';
      return [
        row.name,
        row.date,
        formatCurrency(row.amt),
        formatCurrency(calc.twelvePercent),
        formatCurrency(calc.jail),
        formatCurrency(row.jailFee),
        formatCurrency(row.down),
        formatCurrency(calc.remain),
        `${t1Label} ${formatCurrency(calc.term1)}`,
        `${t2Label} ${formatCurrency(calc.term2)}`,
        `${t3Label} ${formatCurrency(calc.term3)}`,
        formatCurrency(calc.elite),
        formatCurrency(calc.buf),
        formatCurrency(calc.ga),
      ];
    });

    // Calculate totals (Elite 6%, GA 3.5%, BUF 0.5%, Jail 2% + fees)
    const totals = filteredRows.reduce((acc, row) => {
      const calc = calculateValues(row.amt, row.down, row.jailFee);
      return {
        amt: acc.amt + row.amt,
        twelvePercent: acc.twelvePercent + calc.twelvePercent,
        elite: acc.elite + calc.elite,
        buf: acc.buf + calc.buf,
        jail: acc.jail + calc.jail,
        jailFee: acc.jailFee + row.jailFee,
        ga: acc.ga + calc.ga,
        down: acc.down + row.down,
        remain: acc.remain + calc.remain,
      };
    }, { amt: 0, twelvePercent: 0, elite: 0, buf: 0, jail: 0, jailFee: 0, ga: 0, down: 0, remain: 0 });

    // Add totals row
    tableData.push([
      'TOTALS',
      '',
      formatCurrency(totals.amt),
      formatCurrency(totals.twelvePercent),
      formatCurrency(totals.jail),
      formatCurrency(totals.jailFee),
      formatCurrency(totals.down),
      formatCurrency(totals.remain),
      '',
      '',
      '',
      formatCurrency(totals.elite),
      formatCurrency(totals.buf),
      formatCurrency(totals.ga),
    ]);

    autoTable(doc, {
      head: [['Name', 'Date', 'Amt', '12%', 'Jail', '+Fee', 'Down', 'Remain', 'Term 1', 'Term 2', 'Term 3', 'Elite', 'BUF', 'GA']],
      body: tableData,
      startY: 40,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 77, 46], textColor: [255, 255, 255] },
      footStyles: { fillColor: [40, 40, 40], textColor: [212, 175, 55], fontStyle: 'bold' },
      didParseCell: function(data) {
        // Style the totals row
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fillColor = [40, 40, 40];
          data.cell.styles.textColor = [212, 175, 55];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // Summary box at bottom
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFillColor(26, 77, 46);
    doc.rect(14, finalY, 100, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 18, finalY + 8);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`GA: ${formatCurrency(totals.ga)}`, 18, finalY + 16);
    doc.text(`Elite: ${formatCurrency(totals.elite)}`, 18, finalY + 23);
    doc.text(`BUF: ${formatCurrency(totals.buf)}`, 60, finalY + 16);
    doc.text(`Jail: ${formatCurrency(totals.jail)}`, 60, finalY + 23);
    doc.text(`Total 12%: ${formatCurrency(totals.twelvePercent)}`, 18, finalY + 30);

    // Certification footer
    const certY = finalY + 45;
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(14, certY, pageWidth - 14, certY);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('This report is certified accurate by BailBonds Financed, St. Tammany Parish, Louisiana.', 14, certY + 6);
    doc.text('Licensed Louisiana Bail Bond Agent | Affiliate of Louisiana Bail Agents | 985-264-9519', 14, certY + 11);

    // Save PDF
    const fileName = `bailbonds-report-${dateFrom || 'all'}-to-${dateTo || 'all'}.pdf`;
    doc.save(fileName);
    setShowPdfModal(false);
  };

  // Main tracker
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <CommandBar />
      <div className="max-w-full mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#d4af37]" />
            <span className="text-lg font-bold text-white">
              Bond <span className="text-[#d4af37]">Tracker</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSave}
              disabled={syncing}
              className="flex items-center gap-2 bg-[#1a4d2e] hover:bg-[#2d6b45] text-white px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {saveMessage === 'Saved!' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveMessage || 'Save All'}
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-white/10 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={openPdfModal}
              className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-white/10 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={addRow}
              className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#e5c55a] text-[#0a0a0a] font-bold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Bond
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'active' ? 'bg-[#1a4d2e] text-white' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            Active ({rows.filter(r => r.status === 'active').length})
          </button>
          <button
            onClick={() => setFilterStatus('paid_off')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'paid_off' ? 'bg-green-600 text-white' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-1" />
            Paid Off ({rows.filter(r => r.status === 'paid_off').length})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-[#d4af37] text-black' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            All ({rows.length})
          </button>
        </div>

        {/* Spreadsheet */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0f0f0f] border-b border-white/10">
                  <th className="px-3 py-3 text-left text-gray-400 font-semibold whitespace-nowrap">Name</th>
                  <th className="px-3 py-3 text-left text-gray-400 font-semibold whitespace-nowrap">Date</th>
                  <th className="px-3 py-3 text-right text-gray-400 font-semibold whitespace-nowrap">Amt</th>
                  <th className="px-3 py-3 text-right text-gray-400 font-semibold whitespace-nowrap">12%</th>
                  <th className="px-3 py-3 text-right text-gray-400 font-semibold whitespace-nowrap">Jail</th>
                  <th className="px-3 py-3 text-right text-gray-400 font-semibold whitespace-nowrap">+Fee</th>
                  <th className="px-3 py-3 text-right text-gray-400 font-semibold whitespace-nowrap">Down</th>
                  <th className="px-3 py-3 text-right text-gray-400 font-semibold whitespace-nowrap">Remain</th>
                  <th className="px-3 py-3 text-right text-gray-400 font-semibold whitespace-nowrap">Term 1</th>
                  <th className="px-3 py-3 text-right text-gray-400 font-semibold whitespace-nowrap">Term 2</th>
                  <th className="px-3 py-3 text-right text-gray-400 font-semibold whitespace-nowrap">Term 3</th>
                  <th className="px-3 py-3 text-right text-[#d4af37] font-semibold whitespace-nowrap">Elite</th>
                  <th className="px-3 py-3 text-right text-gray-400 font-semibold whitespace-nowrap">BUF</th>
                  <th className="px-3 py-3 text-right text-gray-400 font-semibold whitespace-nowrap">GA</th>
                  <th className="px-3 py-3 text-center text-gray-400 font-semibold w-12"></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="px-4 py-12 text-center text-gray-500">
                      {loading ? 'Loading from cloud...' : 'No bonds yet. Click "Add Bond" to get started.'}
                    </td>
                  </tr>
                ) : (
                  rows
                    .filter(row => filterStatus === 'all' || row.status === filterStatus)
                    .map((row) => {
                    const calc = calculateValues(row.amt, row.down, row.jailFee);
                    const isPaidOff = row.status === 'paid_off';
                    return (
                      <tr key={row.id} className={`border-b border-white/5 hover:bg-white/5 ${isPaidOff ? 'opacity-60' : ''}`}>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                            placeholder="Client name"
                            className="w-full min-w-[120px] bg-transparent border border-transparent hover:border-white/20 focus:border-[#d4af37] rounded px-2 py-1 text-white focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="date"
                            value={row.date}
                            onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                            className="bg-transparent border border-transparent hover:border-white/20 focus:border-[#d4af37] rounded px-2 py-1 text-white focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={row.amt || ''}
                            onChange={(e) => updateRow(row.id, 'amt', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-24 bg-transparent border border-transparent hover:border-white/20 focus:border-[#d4af37] rounded px-2 py-1 text-white text-right focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-gray-300 whitespace-nowrap">
                          {formatCurrency(calc.twelvePercent)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-300 whitespace-nowrap">
                          {formatCurrency(calc.jail)}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={row.jailFee}
                            onChange={(e) => updateRow(row.id, 'jailFee', parseFloat(e.target.value) || 0)}
                            className="w-16 bg-transparent border border-transparent hover:border-white/20 focus:border-[#d4af37] rounded px-2 py-1 text-white text-right focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={row.down || ''}
                            onChange={(e) => updateRow(row.id, 'down', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-24 bg-transparent border border-transparent hover:border-white/20 focus:border-[#d4af37] rounded px-2 py-1 text-white text-right focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-gray-300 whitespace-nowrap">
                          {formatCurrency(calc.remain)}
                        </td>
                        <td className={`px-3 py-2 text-right whitespace-nowrap ${recommendations[row.id]?.recommendation === 1 ? 'bg-[#d4af37]/20 text-[#d4af37] font-bold' : 'text-gray-300'}`}>
                          <span className="text-xs text-gray-500">{calc.isHighBond ? '3mo' : '4wk'}</span> {formatCurrency(calc.term1)}
                          {recommendations[row.id]?.recommendation === 1 && <Sparkles className="w-3 h-3 inline ml-1 text-[#d4af37]" />}
                        </td>
                        <td className={`px-3 py-2 text-right whitespace-nowrap ${recommendations[row.id]?.recommendation === 2 ? 'bg-[#d4af37]/20 text-[#d4af37] font-bold' : 'text-gray-300'}`}>
                          <span className="text-xs text-gray-500">{calc.isHighBond ? '6mo' : '6wk'}</span> {formatCurrency(calc.term2)}
                          {recommendations[row.id]?.recommendation === 2 && <Sparkles className="w-3 h-3 inline ml-1 text-[#d4af37]" />}
                        </td>
                        <td className={`px-3 py-2 text-right whitespace-nowrap ${recommendations[row.id]?.recommendation === 3 ? 'bg-[#d4af37]/20 text-[#d4af37] font-bold' : 'text-green-400 font-medium'}`}>
                          <span className="text-xs text-gray-500">{calc.isHighBond ? '9mo' : '10wk'}</span> {formatCurrency(calc.term3)}
                          {recommendations[row.id]?.recommendation === 3 && <Sparkles className="w-3 h-3 inline ml-1 text-[#d4af37]" />}
                        </td>
                        <td className="px-3 py-2 text-right text-[#d4af37] font-semibold whitespace-nowrap">
                          {formatCurrency(calc.elite)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-300 whitespace-nowrap">
                          {formatCurrency(calc.buf)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-300 whitespace-nowrap">
                          {formatCurrency(calc.ga)}
                        </td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          {!isPaidOff && row.name && (
                            <button
                              onClick={() => startCase(row)}
                              disabled={creatingCase === row.id}
                              className="text-gray-500 hover:text-[#d4af37] transition-colors p-1 mr-1"
                              title="Start Case in Case Management"
                            >
                              {creatingCase === row.id ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                              ) : (
                                <ArrowRight className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {!isPaidOff && (
                            <button
                              onClick={() => markAsPaidOff(row)}
                              className="text-gray-500 hover:text-green-500 transition-colors p-1 mr-1"
                              title="Mark as Paid Off"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {isPaidOff && (
                            <span className="text-green-500 text-xs font-semibold mr-2">PAID</span>
                          )}
                          <button
                            onClick={() => deleteRow(row.id)}
                            className="text-gray-500 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        {rows.length > 0 && (() => {
          const filteredRows = rows.filter(row => filterStatus === 'all' || row.status === filterStatus);
          return (
          <div className="mt-6 bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">Totals</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-[#0f3620] rounded-lg p-3">
                <div className="text-gray-300 text-xs uppercase">GA Owed (3.5%)</div>
                <div className="text-white font-bold text-xl">
                  {formatCurrency(filteredRows.reduce((sum, row) => sum + (row.amt * 0.035), 0))}
                </div>
              </div>
              <div className="bg-[#d4af37]/20 rounded-lg p-3">
                <div className="text-[#d4af37] text-xs uppercase">Elite (6%)</div>
                <div className="text-[#d4af37] font-bold text-xl">
                  {formatCurrency(filteredRows.reduce((sum, row) => sum + (row.amt * 0.06), 0))}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">BUF (0.5%)</div>
                <div className="text-white font-bold">
                  {formatCurrency(filteredRows.reduce((sum, row) => sum + (row.amt * 0.005), 0))}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Jail (2% + fees)</div>
                <div className="text-white font-bold">
                  {formatCurrency(filteredRows.reduce((sum, row) => sum + (row.amt * 0.02) + row.jailFee, 0))}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Total 12%</div>
                <div className="text-white font-bold">
                  {formatCurrency(filteredRows.reduce((sum, row) => sum + (row.amt * 0.12), 0))}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-500">
              <span className="text-green-400">Terms:</span> 50% down (auto) | Under $100k: 4/6/10 weeks | $100k+: 3/6/9 months
            </div>
          </div>
          );
        })()}

        <p className="text-gray-600 text-xs mt-4 text-center flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Cloud synced - access from any device
        </p>

        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap justify-center gap-3 text-xs">
          <a href="/Elite-Bail-Bonds-Application.pdf" target="_blank" className="text-gray-500 hover:text-[#d4af37] transition-colors">Application</a>
          <span className="text-gray-700">|</span>
          <a href="/app" className="text-gray-500 hover:text-[#d4af37] transition-colors">Calculator</a>
          <span className="text-gray-700">|</span>
          <span className="text-[#d4af37]">Tracker</span>
          <span className="text-gray-700">|</span>
          <a href="/quote" className="text-gray-500 hover:text-[#d4af37] transition-colors">Quote</a>
        </div>
      </div>

      {/* PDF Export Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Export to PDF</h3>
              <button
                onClick={() => setShowPdfModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-3 rounded-lg transition-colors"
                >
                  All Dates
                </button>
                <button
                  onClick={exportToPdf}
                  className="flex-1 bg-[#d4af37] hover:bg-[#e5c55a] text-[#0a0a0a] font-bold py-3 rounded-lg transition-colors"
                >
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Bond Paid Off!</h3>
            <p className="text-gray-400 mb-4">
              {showThankYou.name || 'Client'} has completed all payments.
            </p>
            <p className="text-[#d4af37] font-semibold mb-6">
              Consider asking for a Google Review!
            </p>

            <div className="space-y-3">
              {/* Placeholder for Google Review link - replace YOUR_GOOGLE_REVIEW_LINK */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Add your Google Business review link in settings');
                }}
                className="flex items-center justify-center gap-2 w-full bg-[#d4af37] hover:bg-[#e5c55a] text-[#0a0a0a] font-bold py-3 rounded-xl transition-colors"
              >
                <Star className="w-5 h-5" />
                Send Review Request
              </a>
              <button
                onClick={() => setShowThankYou(null)}
                className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-3 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
