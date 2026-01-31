'use client';

import CaseField from '@/app/admin/components/CaseField';
import type { CaseInfoFields } from '@/app/admin/components/CaseField';
import { usePhoneVerify } from '@/hooks/usePhoneVerify';
import type { PhoneStatus } from '@/hooks/usePhoneVerify';

const DOT_COLORS: Record<PhoneStatus, string> = {
  idle: '',
  checking: 'bg-gray-400 animate-pulse',
  valid: 'bg-green-500',
  voip: 'bg-red-500',
  error: 'bg-yellow-500',
};

export default function DefendantTab({
  caseInfo,
  updateCaseInfo,
  blurSaveCaseInfo,
  saving,
  isDraft,
  onRunWizard,
}: {
  caseInfo: CaseInfoFields;
  updateCaseInfo: (key: keyof CaseInfoFields, val: string) => void;
  blurSaveCaseInfo: (key: keyof CaseInfoFields) => void;
  saving: boolean;
  isDraft: boolean;
  onRunWizard: () => void;
}) {
  const { verify, getStatus } = usePhoneVerify();

  function handlePhoneBlur(field: keyof CaseInfoFields) {
    blurSaveCaseInfo(field);
    verify(caseInfo[field], field);
  }

  function phoneDot(field: keyof CaseInfoFields) {
    const { status, detail } = getStatus(field);
    if (status === 'idle') return undefined;
    return (
      <span
        className={`w-2 h-2 rounded-full absolute right-3 bottom-[11px] ${DOT_COLORS[status]}`}
        title={detail || status}
      />
    );
  }
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#d4af37]">Defendant Information</h2>
          {isDraft && (
            <button
              onClick={onRunWizard}
              className="text-xs text-[#d4af37] hover:text-[#e5c55a] transition-colors"
            >
              Run Setup Wizard
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CaseField label="First Name" value={caseInfo.defendant_first} field="defendant_first" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="First" />
          <CaseField label="Last Name" value={caseInfo.defendant_last} field="defendant_last" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Last" />
          <CaseField label="Phone" value={caseInfo.defendant_phone} field="defendant_phone" onChange={updateCaseInfo} onBlur={handlePhoneBlur} disabled={saving} type="tel" placeholder="(985) 555-1234" statusDot={phoneDot('defendant_phone')} />
          <CaseField label="Email" value={caseInfo.defendant_email} field="defendant_email" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} type="email" placeholder="email@example.com" />
          <CaseField label="Date of Birth" value={caseInfo.defendant_dob} field="defendant_dob" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} type="date" />
          <CaseField label="SSN (last 4)" value={caseInfo.defendant_ssn_last4} field="defendant_ssn_last4" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="1234" />
          <CaseField label="DL Number" value={caseInfo.defendant_dl_number} field="defendant_dl_number" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Driver's License #" />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-bold text-[#d4af37] mb-4">Address</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <CaseField label="Street Address" value={caseInfo.defendant_address} field="defendant_address" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="123 Main St" />
          </div>
          <CaseField label="City" value={caseInfo.defendant_city} field="defendant_city" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Covington" />
          <CaseField label="State" value={caseInfo.defendant_state} field="defendant_state" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="LA" />
          <CaseField label="Zip" value={caseInfo.defendant_zip} field="defendant_zip" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="70433" />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-bold text-[#d4af37] mb-4">Employment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CaseField label="Employer" value={caseInfo.employer_name} field="employer_name" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Company name" />
          <CaseField label="Employer Phone" value={caseInfo.employer_phone} field="employer_phone" onChange={updateCaseInfo} onBlur={handlePhoneBlur} disabled={saving} type="tel" placeholder="(985) 555-5678" statusDot={phoneDot('employer_phone')} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-bold text-[#d4af37] mb-4">Vehicle Information</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CaseField label="Make" value={caseInfo.car_make} field="car_make" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="e.g. Toyota" />
          <CaseField label="Model" value={caseInfo.car_model} field="car_model" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="e.g. Camry" />
          <CaseField label="Year" value={caseInfo.car_year} field="car_year" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="e.g. 2020" />
          <CaseField label="Color" value={caseInfo.car_color} field="car_color" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="e.g. Silver" />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-bold text-[#d4af37] mb-4">Charges & Court</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <CaseField label="Charges" value={caseInfo.charge_description} field="charge_description" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Description of charges" />
          </div>
          <CaseField label="Bond Amount ($)" value={caseInfo.bond_amount} field="bond_amount" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} type="number" placeholder="5000" />
          <CaseField label="Court" value={caseInfo.court_name} field="court_name" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Court name" />
          <CaseField label="Court Date" value={caseInfo.court_date} field="court_date" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} type="date" />
          <CaseField label="Case Number" value={caseInfo.case_number} field="case_number" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Case #" />
          <CaseField label="Jail Location" value={caseInfo.jail_location} field="jail_location" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="Jail name" />
          <CaseField label="County" value={caseInfo.county} field="county" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} placeholder="St. Tammany" />
          <CaseField label="Bond Date" value={caseInfo.bond_date} field="bond_date" onChange={updateCaseInfo} onBlur={blurSaveCaseInfo} disabled={saving} type="date" />
        </div>
      </div>
    </div>
  );
}
