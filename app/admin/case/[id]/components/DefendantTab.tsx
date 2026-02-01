'use client';

import { useState } from 'react';
import CaseField from '@/app/admin/components/CaseField';
import type { CaseInfoFields } from '@/app/admin/components/CaseField';
import { usePhoneVerify } from '@/hooks/usePhoneVerify';
import type { PhoneStatus } from '@/hooks/usePhoneVerify';

const PILL_STYLES: Record<PhoneStatus, string> = {
  idle: '',
  checking: 'bg-zinc-700 text-zinc-400 animate-pulse',
  valid: 'bg-green-900/60 text-green-400',
  voip: 'bg-red-900/60 text-red-400',
  error: 'bg-yellow-900/60 text-yellow-400',
};
const PILL_LABELS: Record<PhoneStatus, string> = {
  idle: '',
  checking: '...',
  valid: 'Verified',
  voip: 'VOIP',
  error: 'Error',
};

export default function DefendantTab({
  caseInfo,
  updateCaseInfo,
  blurSaveCaseInfo,
  saving,
  isDraft,
  onRunWizard,
  checkinSending,
  onSendCheckin,
  lastSavedField,
}: {
  caseInfo: CaseInfoFields;
  updateCaseInfo: (key: keyof CaseInfoFields, val: string) => void;
  blurSaveCaseInfo: (key: keyof CaseInfoFields) => void;
  saving: boolean;
  isDraft: boolean;
  onRunWizard: () => void;
  checkinSending?: boolean;
  onSendCheckin?: () => void;
  lastSavedField?: string | null;
}) {
  const { verify, getStatus } = usePhoneVerify();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    address: true,
    employment: true,
    vehicle: true,
  });

  function handlePhoneBlur(field: keyof CaseInfoFields) {
    blurSaveCaseInfo(field);
    verify(caseInfo[field], field);
  }

  function phonePill(field: keyof CaseInfoFields) {
    const { status, detail } = getStatus(field);
    if (status === 'idle') return undefined;
    return (
      <span
        className={`absolute right-2 bottom-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PILL_STYLES[status]}`}
        title={detail || status}
      >
        {PILL_LABELS[status]}
      </span>
    );
  }

  function fieldState(field: string): 'idle' | 'saving' | 'saved' {
    if (saving) return 'idle';
    return lastSavedField === field ? 'saved' : 'idle';
  }

  function toggleSection(key: string) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function SectionHeader({ id, title }: { id: string; title: string }) {
    return (
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between mb-4"
      >
        <h3 className="text-sm font-bold text-[#fbbf24]">{title}</h3>
        <svg className={`w-4 h-4 text-zinc-500 transition-transform ${collapsed[id] ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Defendant Information — primary, always open */}
      <div className="bg-zinc-900 border border-zinc-800 border-l-2 border-l-[#fbbf24] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#fbbf24]">Defendant Information</h2>
          {isDraft && (
            <button
              onClick={onRunWizard}
              className="text-xs text-[#fbbf24] hover:text-[#fcd34d] transition-colors"
            >
              Run Setup Wizard
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CaseField label="First Name" value={caseInfo.defendant_first} field="defendant_first" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="First" required fieldSaveState={fieldState('defendant_first')} />
          <CaseField label="Last Name" value={caseInfo.defendant_last} field="defendant_last" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Last" required fieldSaveState={fieldState('defendant_last')} />
          <div className="relative">
            <CaseField label="Phone" value={caseInfo.defendant_phone} field="defendant_phone" onChange={updateCaseInfo} onBlur={handlePhoneBlur} disabled={saving} type="tel" placeholder="(985) 555-1234" statusDot={phonePill('defendant_phone')} required fieldSaveState={fieldState('defendant_phone')} />
            {onSendCheckin && caseInfo.defendant_phone && (
              <button
                onClick={onSendCheckin}
                disabled={checkinSending}
                className="absolute right-0 -bottom-5 text-[10px] text-[#fbbf24] hover:text-[#fcd34d] font-semibold transition-colors disabled:opacity-50"
              >
                {checkinSending ? 'Sending...' : 'Send Check-in'}
              </button>
            )}
          </div>
          <CaseField label="Email" value={caseInfo.defendant_email} field="defendant_email" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} type="email" placeholder="email@example.com" fieldSaveState={fieldState('defendant_email')} />
          <CaseField label="Date of Birth" value={caseInfo.defendant_dob} field="defendant_dob" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} type="date" fieldSaveState={fieldState('defendant_dob')} />
          <CaseField label="SSN (last 4)" value={caseInfo.defendant_ssn_last4} field="defendant_ssn_last4" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="1234" fieldSaveState={fieldState('defendant_ssn_last4')} />
          <CaseField label="DL Number" value={caseInfo.defendant_dl_number} field="defendant_dl_number" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Driver's License #" fieldSaveState={fieldState('defendant_dl_number')} />
        </div>
      </div>

      {/* Address — collapsible */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <SectionHeader id="address" title="Address" />
        {!collapsed.address && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <CaseField label="Street Address" value={caseInfo.defendant_address} field="defendant_address" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="123 Main St" fieldSaveState={fieldState('defendant_address')} />
            </div>
            <CaseField label="City" value={caseInfo.defendant_city} field="defendant_city" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Covington" fieldSaveState={fieldState('defendant_city')} />
            <CaseField label="State" value={caseInfo.defendant_state} field="defendant_state" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="LA" fieldSaveState={fieldState('defendant_state')} />
            <CaseField label="Zip" value={caseInfo.defendant_zip} field="defendant_zip" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="70433" fieldSaveState={fieldState('defendant_zip')} />
          </div>
        )}
      </div>

      {/* Employment — collapsible */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <SectionHeader id="employment" title="Employment" />
        {!collapsed.employment && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CaseField label="Employer" value={caseInfo.employer_name} field="employer_name" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Company name" fieldSaveState={fieldState('employer_name')} />
            <CaseField label="Employer Phone" value={caseInfo.employer_phone} field="employer_phone" onChange={updateCaseInfo} onBlur={handlePhoneBlur} disabled={saving} type="tel" placeholder="(985) 555-5678" statusDot={phonePill('employer_phone')} fieldSaveState={fieldState('employer_phone')} />
          </div>
        )}
      </div>

      {/* Vehicle — collapsible */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <SectionHeader id="vehicle" title="Vehicle Information" />
        {!collapsed.vehicle && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CaseField label="Make" value={caseInfo.car_make} field="car_make" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="e.g. Toyota" fieldSaveState={fieldState('car_make')} />
            <CaseField label="Model" value={caseInfo.car_model} field="car_model" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="e.g. Camry" fieldSaveState={fieldState('car_model')} />
            <CaseField label="Year" value={caseInfo.car_year} field="car_year" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="e.g. 2020" fieldSaveState={fieldState('car_year')} />
            <CaseField label="Color" value={caseInfo.car_color} field="car_color" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="e.g. Silver" fieldSaveState={fieldState('car_color')} />
          </div>
        )}
      </div>

      {/* Charges & Court — primary, always open */}
      <div className="bg-zinc-900 border border-zinc-800 border-l-2 border-l-[#fbbf24] rounded-xl p-6">
        <h3 className="text-sm font-bold text-[#fbbf24] mb-4">Charges & Court</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <CaseField label="Charges" value={caseInfo.charge_description} field="charge_description" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Description of charges" required fieldSaveState={fieldState('charge_description')} />
          </div>
          <CaseField label="Bond Amount ($)" value={caseInfo.bond_amount} field="bond_amount" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} type="number" placeholder="5000" required fieldSaveState={fieldState('bond_amount')} />
          <CaseField label="Court" value={caseInfo.court_name} field="court_name" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Court name" fieldSaveState={fieldState('court_name')} />
          <CaseField label="Court Date" value={caseInfo.court_date} field="court_date" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} type="date" fieldSaveState={fieldState('court_date')} />
          <CaseField label="Case Number" value={caseInfo.case_number} field="case_number" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Case #" fieldSaveState={fieldState('case_number')} />
          <CaseField label="Jail Location" value={caseInfo.jail_location} field="jail_location" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Jail name" fieldSaveState={fieldState('jail_location')} />
          <CaseField label="County" value={caseInfo.county} field="county" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="St. Tammany" fieldSaveState={fieldState('county')} />
          <CaseField label="Bond Date" value={caseInfo.bond_date} field="bond_date" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} type="date" fieldSaveState={fieldState('bond_date')} />
        </div>
      </div>
    </div>
  );
}
