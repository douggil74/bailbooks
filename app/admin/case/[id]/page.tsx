'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Shield } from 'lucide-react';
import type {
  Application,
  ApplicationReference,
  Signature,
  Document,
  Checkin,
  SmsLogEntry,
  ReminderSent,
  CardInfoResponse,
  Payment,
  Indemnitor,
} from '@/lib/bail-types';
import { EMPTY_CASE_INFO } from '@/app/admin/components/CaseField';
import type { CaseInfoFields } from '@/app/admin/components/CaseField';
import CaseSidebar from './components/CaseSidebar';
import type { TabId } from './components/CaseSidebar';
import OverviewTab from './components/OverviewTab';
import DefendantTab from './components/DefendantTab';
import IndemnitorTab from './components/IndemnitorTab';
import FinancesTab from './components/FinancesTab';
import FilesTab from './components/FilesTab';
import LogsTab from './components/LogsTab';
import SettingsTab from './components/SettingsTab';

interface DocumentWithUrl extends Document {
  signed_url: string | null;
}

interface CheckinWithUrl extends Checkin {
  selfie_url: string | null;
}

interface CaseData {
  application: Application;
  references: ApplicationReference[];
  signatures: Signature[];
  documents: DocumentWithUrl[];
  checkins: CheckinWithUrl[];
  sms_log: SmsLogEntry[];
  reminders_sent: ReminderSent[];
  payments: Payment[];
  indemnitors: Indemnitor[];
}

interface WizardField {
  key: keyof CaseInfoFields;
  label: string;
  type?: string;
  placeholder?: string;
}

interface WizardFieldStep {
  type: 'fields';
  title: string;
  description: string;
  fields: WizardField[];
}

interface WizardUploadStep {
  type: 'uploads';
  title: string;
  description: string;
  uploads: { docType: string; label: string }[];
}

interface WizardIndemnitorStep {
  type: 'indemnitor';
  title: string;
  description: string;
}

interface WizardConsentStep {
  type: 'consent';
  title: string;
  description: string;
}

type WizardStepDef = WizardFieldStep | WizardUploadStep | WizardIndemnitorStep | WizardConsentStep;

const WIZARD_STEPS: WizardStepDef[] = [
  {
    type: 'fields',
    title: 'Contact Info',
    description: "How can we reach the defendant?",
    fields: [
      { key: 'defendant_phone', label: 'Phone Number', type: 'tel', placeholder: '(985) 555-1234' },
      { key: 'defendant_email', label: 'Email Address', type: 'email', placeholder: 'name@example.com' },
    ],
  },
  {
    type: 'consent',
    title: 'Consent',
    description: 'Does the defendant consent to SMS and GPS check-ins?',
  },
  {
    type: 'fields',
    title: 'Personal Details',
    description: 'Date of birth and identification.',
    fields: [
      { key: 'defendant_dob', label: 'Date of Birth', type: 'date' },
      { key: 'defendant_ssn_last4', label: 'SSN (last 4)', placeholder: '1234' },
      { key: 'defendant_dl_number', label: "Driver's License #", placeholder: 'DL number' },
    ],
  },
  {
    type: 'uploads',
    title: 'ID & Photo',
    description: 'Upload driver\'s license and a selfie for identification.',
    uploads: [
      { docType: 'dl_front', label: "Driver's License (Front)" },
      { docType: 'dl_back', label: "Driver's License (Back)" },
      { docType: 'selfie', label: 'Selfie' },
    ],
  },
  {
    type: 'indemnitor',
    title: 'Co-Signer',
    description: 'Add a co-signer (indemnitor) for this bond.',
  },
  {
    type: 'fields',
    title: 'Home Address',
    description: "Defendant's residential address.",
    fields: [
      { key: 'defendant_address', label: 'Street Address', placeholder: '123 Main St' },
      { key: 'defendant_city', label: 'City', placeholder: 'Covington' },
      { key: 'defendant_state', label: 'State', placeholder: 'LA' },
      { key: 'defendant_zip', label: 'Zip', placeholder: '70433' },
    ],
  },
  {
    type: 'fields',
    title: 'Charges & Bond',
    description: 'What are the charges and bond amount?',
    fields: [
      { key: 'charge_description', label: 'Charges', placeholder: 'Description of charges' },
      { key: 'bond_amount', label: 'Bond Amount ($)', type: 'number', placeholder: '5000' },
    ],
  },
  {
    type: 'fields',
    title: 'Court Information',
    description: 'Court and case details.',
    fields: [
      { key: 'court_name', label: 'Court Name', placeholder: '22nd JDC' },
      { key: 'court_date', label: 'Court Date', type: 'date' },
      { key: 'case_number', label: 'Case Number', placeholder: 'Case #' },
    ],
  },
  {
    type: 'fields',
    title: 'Jail & Employer',
    description: 'Where is the defendant and where do they work?',
    fields: [
      { key: 'jail_location', label: 'Jail Location', placeholder: 'Jail name' },
      { key: 'employer_name', label: 'Employer', placeholder: 'Company name' },
      { key: 'employer_phone', label: 'Employer Phone', type: 'tel', placeholder: '(985) 555-5678' },
    ],
  },
];

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    submitted: 'bg-yellow-900 text-yellow-300',
    approved: 'bg-green-900 text-green-300',
    active: 'bg-blue-900 text-blue-300',
    completed: 'bg-gray-700 text-gray-300',
    draft: 'bg-gray-800 text-gray-400',
  };
  return styles[status] || styles.draft;
}

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [fromOverview, setFromOverview] = useState(false);
  const [data, setData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Case info editable fields
  const [caseInfo, setCaseInfo] = useState<CaseInfoFields>({ ...EMPTY_CASE_INFO });

  // Agent-only fields
  const [powerNumber, setPowerNumber] = useState('');
  const [premium, setPremium] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [agentNotes, setAgentNotes] = useState('');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [lastSavedField, setLastSavedField] = useState<string | null>(null);
  const [checkinSending, setCheckinSending] = useState(false);

  // Wizard
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardSaving, setWizardSaving] = useState(false);

  // Wizard: uploads
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  // Wizard: indemnitor
  const [indemnitorFirst, setIndemnitorFirst] = useState('');
  const [indemnitorLast, setIndemnitorLast] = useState('');
  const [indemnitorPhone, setIndemnitorPhone] = useState('');
  const [indemnitorEmail, setIndemnitorEmail] = useState('');
  const [indemnitorAdded, setIndemnitorAdded] = useState(false);

  // Wizard: info categories for indemnitor portal
  const [infoCategories, setInfoCategories] = useState<Record<string, boolean>>({
    personal: true,
    address: true,
    vehicle: false,
    employer: true,
    id_photos: true,
  });

  // Card & Payment
  const [cardInfo, setCardInfo] = useState<CardInfoResponse | null>(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [showCardForm, setShowCardForm] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('');
  const [charging, setCharging] = useState(false);
  const [chargeMsg, setChargeMsg] = useState('');

  // Modals
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxLabel, setLightboxLabel] = useState('');

  function updateCaseInfo(key: keyof CaseInfoFields, value: string) {
    setCaseInfo((prev) => ({ ...prev, [key]: value }));
  }

  const fetchCase = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/case/detail?id=${id}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load case');
        setLoading(false);
        return;
      }
      setData(json);
      const app = json.application;

      setCaseInfo({
        defendant_first: app.defendant_first || '',
        defendant_last: app.defendant_last || '',
        defendant_phone: app.defendant_phone || '',
        defendant_email: app.defendant_email || '',
        defendant_dob: app.defendant_dob || '',
        defendant_address: app.defendant_address || '',
        defendant_city: app.defendant_city || '',
        defendant_state: app.defendant_state || '',
        defendant_zip: app.defendant_zip || '',
        defendant_ssn_last4: app.defendant_ssn_last4 || '',
        defendant_dl_number: app.defendant_dl_number || '',
        employer_name: app.employer_name || '',
        employer_phone: app.employer_phone || '',
        bond_amount: app.bond_amount != null ? String(app.bond_amount) : '',
        charge_description: app.charge_description || '',
        court_name: app.court_name || '',
        court_date: app.court_date || '',
        case_number: app.case_number || '',
        jail_location: app.jail_location || '',
        county: app.county || '',
        bond_date: app.bond_date || '',
        car_make: app.car_make || '',
        car_model: app.car_model || '',
        car_year: app.car_year || '',
        car_color: app.car_color || '',
      });

      setPowerNumber(app.power_number || '');
      setPremium(app.premium != null ? String(app.premium) : '');
      setDownPayment(app.down_payment != null ? String(app.down_payment) : '');
      setPaymentAmount(app.payment_amount != null ? String(app.payment_amount) : '');
      setAgentNotes(app.agent_notes || '');
      setNextPaymentDate(app.next_payment_date || '');

      // Parse info categories from DB
      if (app.indemnitor_info_categories != null) {
        const cats = app.indemnitor_info_categories.split(',').map((s: string) => s.trim()).filter(Boolean);
        setInfoCategories({
          personal: cats.includes('personal'),
          address: cats.includes('address'),
          vehicle: cats.includes('vehicle'),
          employer: cats.includes('employer'),
          id_photos: cats.includes('id_photos'),
        });
      }

      if (app.status === 'draft' && !app.defendant_phone && !app.bond_amount) {
        setShowWizard(true);
      }

      setLoading(false);
    } catch {
      setError('Failed to load case');
      setLoading(false);
    }
  }, [id]);

  const fetchCardInfo = useCallback(async () => {
    setCardLoading(true);
    try {
      const res = await fetch(`/api/payment/card-info?application_id=${id}`);
      const json = await res.json();
      if (res.ok) setCardInfo(json);
    } catch { /* ignore */ }
    setCardLoading(false);
  }, [id]);

  useEffect(() => {
    fetchCase();
    fetchCardInfo();
  }, [fetchCase, fetchCardInfo]);

  async function saveField(fields: Record<string, unknown>) {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/admin/case', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: id, ...fields }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSaveMsg(`Error: ${json.error}`);
      } else {
        setSaveMsg('Saved');
        setData((prev) => (prev ? { ...prev, application: json.application } : prev));
        setTimeout(() => setSaveMsg(''), 2000);
      }
    } catch {
      setSaveMsg('Save failed');
    }
    setSaving(false);
  }

  function blurSaveCaseInfo(key: keyof CaseInfoFields) {
    const val = caseInfo[key]?.trim() || null;
    const apiVal = key === 'bond_amount' ? (val ? parseFloat(val) : null) : val;
    saveField({ [key]: apiVal }).then(() => {
      setLastSavedField(key);
      setTimeout(() => setLastSavedField(null), 2000);
    });
  }

  async function saveWizardStep() {
    const step = WIZARD_STEPS[wizardStep];
    if (step.type !== 'fields') return;
    const updates: Record<string, unknown> = {};
    for (const f of step.fields) {
      const val = caseInfo[f.key]?.trim();
      if (val) {
        updates[f.key] = f.type === 'number' ? parseFloat(val) : val;
      }
    }
    if (Object.keys(updates).length > 0) {
      setWizardSaving(true);
      await saveField(updates);
      setWizardSaving(false);
    }
  }

  async function handleWizardUpload(docType: string, file: File) {
    setUploading(docType);
    try {
      const formData = new FormData();
      formData.append('application_id', id);
      formData.append('file', file);
      formData.append('doc_type', docType);
      const res = await fetch('/api/onboard/upload', { method: 'POST', body: formData });
      if (res.ok) {
        setUploadedDocs((prev) => ({ ...prev, [docType]: true }));
      }
    } catch { /* ignore upload errors */ }
    setUploading(null);
  }

  async function saveIndemnitorStep() {
    // Always save info categories
    const cats = Object.entries(infoCategories)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(',');
    await saveField({ indemnitor_info_categories: cats });

    const first = indemnitorFirst.trim();
    const last = indemnitorLast.trim();
    if (!first || !last) return;
    setWizardSaving(true);
    try {
      const res = await fetch('/api/admin/indemnitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: id,
          first_name: first,
          last_name: last,
          phone: indemnitorPhone.trim() || null,
          email: indemnitorEmail.trim() || null,
        }),
      });
      if (res.ok) {
        setIndemnitorAdded(true);
        fetchCase();
      }
    } catch { /* ignore */ }
    setWizardSaving(false);
  }

  async function wizardNext() {
    const step = WIZARD_STEPS[wizardStep];
    if (step.type === 'fields') {
      await saveWizardStep();
    } else if (step.type === 'indemnitor') {
      await saveIndemnitorStep();
    }
    // uploads save individually on file select

    if (wizardStep < WIZARD_STEPS.length - 1) {
      setWizardStep(wizardStep + 1);
    } else {
      setShowWizard(false);
      setWizardStep(0);
      fetchCase();
    }
  }

  function wizardSkip() {
    if (wizardStep < WIZARD_STEPS.length - 1) {
      setWizardStep(wizardStep + 1);
    } else {
      setShowWizard(false);
      setWizardStep(0);
    }
  }

  function wizardBack() {
    if (wizardStep > 0) setWizardStep(wizardStep - 1);
  }

  async function deleteCase() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/case?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/admin';
        return;
      }
      const json = await res.json();
      setSaveMsg(`Delete failed: ${json.error}`);
    } catch {
      setSaveMsg('Delete failed');
    }
    setDeleting(false);
    setConfirmDelete(false);
  }

  async function changeStatus(newStatus: Application['status']) {
    await saveField({ status: newStatus });
  }

  async function chargeCard() {
    const amt = parseFloat(chargeAmount);
    if (!amt || amt <= 0) {
      setChargeMsg('Enter a valid amount');
      return;
    }
    setCharging(true);
    setChargeMsg('');
    try {
      const res = await fetch('/api/payment/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: id, amount: amt }),
      });
      const json = await res.json();
      if (!res.ok) {
        setChargeMsg(`Error: ${json.error}`);
      } else {
        setChargeMsg(`Charged $${json.amount_charged.toFixed(2)} successfully`);
        if (json.new_next_payment_date) {
          setNextPaymentDate(json.new_next_payment_date);
        }
        fetchCase();
        setTimeout(() => setChargeMsg(''), 5000);
      }
    } catch {
      setChargeMsg('Charge failed');
    }
    setCharging(false);
  }

  async function sendCheckin() {
    setCheckinSending(true);
    try {
      const res = await fetch('/api/checkin/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSaveMsg(`Check-in error: ${json.error}`);
      } else {
        const channels = (json.channels_sent as string[]).join(' + ');
        setSaveMsg(`Check-in sent via ${channels}`);
        setTimeout(() => setSaveMsg(''), 3000);
        fetchCase();
      }
    } catch {
      setSaveMsg('Failed to send check-in');
    }
    setCheckinSending(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading case...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Case not found'}</p>
          <a href="/admin" className="text-[#d4af37] underline">Back to cases</a>
        </div>
      </div>
    );
  }

  const { application: app } = data;
  const currentWizardStep = WIZARD_STEPS[wizardStep];
  const isLastWizardStep = wizardStep === WIZARD_STEPS.length - 1;

  // Navigate from overview checklist → set flag so "Back to Overview" shows
  function navigateFromOverview(tab: TabId) {
    setFromOverview(true);
    setActiveTab(tab);
  }

  // Navigate via sidebar or back button → clear the flag
  function navigateTab(tab: TabId) {
    setFromOverview(false);
    setActiveTab(tab);
  }

  function backToOverview() {
    setFromOverview(false);
    setActiveTab('overview');
  }

  function OverviewBackBar() {
    if (!fromOverview || activeTab === 'overview') return null;
    return (
      <button
        onClick={backToOverview}
        className="w-full flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-sm font-semibold hover:bg-[#d4af37]/20 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Overview
      </button>
    );
  }

  function renderActiveTab() {
    if (!data) return null;
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            application={data.application}
            signatures={data.signatures}
            payments={data.payments}
            indemnitors={data.indemnitors}
            onNavigateTab={navigateFromOverview}
          />
        );
      case 'defendant':
        return (
          <DefendantTab
            caseInfo={caseInfo}
            updateCaseInfo={updateCaseInfo}
            blurSaveCaseInfo={blurSaveCaseInfo}
            saving={saving}
            isDraft={data.application.status === 'draft'}
            onRunWizard={() => { setShowWizard(true); setWizardStep(0); }}
            checkinSending={checkinSending}
            onSendCheckin={sendCheckin}
            lastSavedField={lastSavedField}
          />
        );
      case 'indemnitors':
        return (
          <IndemnitorTab
            applicationId={id}
            indemnitors={data.indemnitors}
            references={data.references}
            signatures={data.signatures}
            documents={data.documents}
            onRefresh={fetchCase}
          />
        );
      case 'finances':
        return (
          <FinancesTab
            applicationId={id}
            powerNumber={powerNumber}
            setPowerNumber={setPowerNumber}
            premium={premium}
            setPremium={setPremium}
            downPayment={downPayment}
            setDownPayment={setDownPayment}
            paymentAmount={paymentAmount}
            setPaymentAmount={setPaymentAmount}
            nextPaymentDate={nextPaymentDate}
            setNextPaymentDate={setNextPaymentDate}
            saveField={saveField}
            saving={saving}
            bondAmount={data.application.bond_amount}
            cardInfo={cardInfo}
            cardLoading={cardLoading}
            showCardForm={showCardForm}
            setShowCardForm={setShowCardForm}
            chargeAmount={chargeAmount}
            setChargeAmount={setChargeAmount}
            charging={charging}
            chargeMsg={chargeMsg}
            onChargeCard={chargeCard}
            onCardSuccess={(pmId, last4, brand) => {
              setShowCardForm(false);
              setCardInfo({ has_card: true, brand, last4, exp_month: null, exp_year: null });
              fetchCardInfo();
            }}
            payments={data.payments}
            onRefresh={fetchCase}
          />
        );
      case 'files':
        return (
          <FilesTab
            documents={data.documents}
            signatures={data.signatures}
            applicationId={id}
            indemnitors={data.indemnitors}
            onOpenLightbox={(url, label) => {
              setLightboxUrl(url);
              setLightboxLabel(label);
            }}
          />
        );
      case 'logs':
        return (
          <LogsTab
            application={data.application}
            checkins={data.checkins}
            sms_log={data.sms_log}
            reminders_sent={data.reminders_sent}
            signatures={data.signatures}
            documents={data.documents}
            checkinSending={checkinSending}
            onSendCheckin={sendCheckin}
          />
        );
      case 'settings':
        return (
          <SettingsTab
            application={data.application}
            agentNotes={agentNotes}
            setAgentNotes={setAgentNotes}
            saveField={saveField}
            saving={saving}
            onChangeStatus={changeStatus}
            onDeleteCase={() => setConfirmDelete(true)}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-10 right-0 text-gray-400 hover:text-white text-sm"
            >
              Close
            </button>
            <img src={lightboxUrl} alt={lightboxLabel} className="w-full rounded-lg shadow-2xl" />
            <p className="text-center text-sm text-gray-400 mt-3 capitalize">{lightboxLabel}</p>
          </div>
        </div>
      )}

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center gap-2 mb-5">
              {WIZARD_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === wizardStep ? 'bg-[#d4af37]' : i < wizardStep ? 'bg-[#d4af37]/40' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{currentWizardStep.title}</h3>
            <p className="text-sm text-gray-400 mb-5">{currentWizardStep.description}</p>
            <div className="space-y-3">
              {currentWizardStep.type === 'fields' && currentWizardStep.fields.map((f, i) => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    value={caseInfo[f.key]}
                    onChange={(e) => updateCaseInfo(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    autoFocus={i === 0}
                    onKeyDown={(e) => { if (e.key === 'Enter') wizardNext(); }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                  />
                </div>
              ))}
              {currentWizardStep.type === 'uploads' && currentWizardStep.uploads.map((u) => (
                <div key={u.docType} className="flex items-center gap-3">
                  <label className="flex-1 flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 cursor-pointer hover:border-gray-500 transition-colors">
                    {uploadedDocs[u.docType] ? (
                      <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : uploading === u.docType ? (
                      <svg className="w-5 h-5 text-[#d4af37] shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    <span className={`text-sm ${uploadedDocs[u.docType] ? 'text-green-400' : 'text-gray-300'}`}>
                      {uploadedDocs[u.docType] ? `${u.label} ✓` : u.label}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleWizardUpload(u.docType, file);
                      }}
                    />
                  </label>
                </div>
              ))}
              {currentWizardStep.type === 'consent' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm text-white font-medium">SMS Consent</p>
                      <p className="text-xs text-gray-500">Allow text messages for reminders & check-ins</p>
                    </div>
                    <button
                      onClick={() => saveField({ sms_consent: !data?.application.sms_consent })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${data?.application.sms_consent ? 'bg-green-600' : 'bg-gray-600'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${data?.application.sms_consent ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm text-white font-medium">GPS Consent</p>
                      <p className="text-xs text-gray-500">Allow GPS location tracking for check-ins</p>
                    </div>
                    <button
                      onClick={() => saveField({ gps_consent: !data?.application.gps_consent })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${data?.application.gps_consent ? 'bg-green-600' : 'bg-gray-600'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${data?.application.gps_consent ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                </div>
              )}
              {currentWizardStep.type === 'indemnitor' && (
                <>
                  {indemnitorAdded && (
                    <div className="bg-green-900/50 border border-green-800 rounded-lg px-3 py-2 text-sm text-green-300">
                      Co-signer added successfully
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">First Name</label>
                    <input
                      type="text"
                      value={indemnitorFirst}
                      onChange={(e) => setIndemnitorFirst(e.target.value)}
                      placeholder="First name"
                      autoFocus
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={indemnitorLast}
                      onChange={(e) => setIndemnitorLast(e.target.value)}
                      placeholder="Last name"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={indemnitorPhone}
                      onChange={(e) => setIndemnitorPhone(e.target.value)}
                      placeholder="(985) 555-1234"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={indemnitorEmail}
                      onChange={(e) => setIndemnitorEmail(e.target.value)}
                      placeholder="name@example.com"
                      onKeyDown={(e) => { if (e.key === 'Enter') wizardNext(); }}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                    />
                  </div>

                  {/* Information to Collect */}
                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">Information to Collect</p>
                    <p className="text-xs text-gray-500 mb-3">What should the co-signer provide?</p>
                    <div className="space-y-2">
                      {([
                        { key: 'personal', label: 'Personal Details', desc: 'DOB, SSN, DL#' },
                        { key: 'address', label: 'Home Address', desc: 'Street, city, state, zip' },
                        { key: 'vehicle', label: 'Vehicle Info', desc: 'Make, model, year, color' },
                        { key: 'employer', label: 'Current Employer', desc: 'Name, phone' },
                        { key: 'id_photos', label: 'ID & Photos', desc: 'DL front/back, selfie' },
                      ] as const).map((cat) => (
                        <div key={cat.key} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5">
                          <div>
                            <p className="text-sm text-white">{cat.label}</p>
                            <p className="text-xs text-gray-500">{cat.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setInfoCategories((prev) => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                            className={`relative w-11 h-6 rounded-full transition-colors ${infoCategories[cat.key] ? 'bg-[#d4af37]' : 'bg-gray-600'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${infoCategories[cat.key] ? 'translate-x-5' : ''}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-gray-500">&#10003; Name &amp; contact &mdash; always required</p>
                      <p className="text-xs text-gray-500">&#10003; Signature &mdash; always required</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              {wizardStep > 0 && (
                <button onClick={wizardBack} className="px-4 py-2.5 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm">
                  Back
                </button>
              )}
              <button onClick={wizardSkip} className="px-4 py-2.5 text-gray-500 hover:text-gray-300 transition-colors text-sm">
                {isLastWizardStep ? 'Skip & Finish' : 'Skip'}
              </button>
              <button
                onClick={wizardNext}
                disabled={wizardSaving}
                className="flex-1 px-4 py-2.5 bg-[#d4af37] text-[#0a0a0a] font-bold rounded-lg hover:bg-[#e5c55a] transition-colors text-sm disabled:opacity-50"
              >
                {wizardSaving ? 'Saving...' : isLastWizardStep ? 'Done' : 'Next'}
              </button>
            </div>
            <button
              onClick={() => { setShowWizard(false); setWizardStep(0); }}
              className="w-full text-center text-xs text-gray-600 hover:text-gray-400 mt-4 transition-colors"
            >
              Fill in later
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete Case</h3>
            <p className="text-sm text-gray-400 mb-5">
              Permanently delete <strong>{app.defendant_first} {app.defendant_last}</strong> and all associated data? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={deleteCase}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition-colors text-sm disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#1a4d2e] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/admin" className="flex items-center gap-2 text-sm text-green-200 hover:underline">
              <Shield className="w-6 h-6 text-[#d4af37]" />
              <span>&larr; All Cases</span>
            </a>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">
                {app.defendant_first} {app.defendant_last}
              </h1>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusBadge(app.status)}`}>
                {app.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/api/onboard/generate-pdf?id=${id}`}
              target="_blank"
              className="bg-[#d4af37] text-gray-900 text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#e5c55a] transition-colors"
            >
              PDF
            </a>
          </div>
        </div>
      </header>

      {/* Fixed save toast */}
      {saveMsg && (
        <div
          className={`fixed bottom-4 right-4 z-40 text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg ${
            saveMsg.startsWith('Error') || saveMsg.includes('failed')
              ? 'bg-red-900 text-red-200 border border-red-800'
              : 'bg-green-900 text-green-200 border border-green-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {saveMsg.startsWith('Error') || saveMsg.includes('failed') ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {saveMsg}
          </div>
        </div>
      )}

      {/* Main layout: sidebar + content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <CaseSidebar
            activeTab={activeTab}
            onTabChange={navigateTab}
            defendantName={`${app.defendant_first} ${app.defendant_last}`}
            defendantDob={app.defendant_dob}
            defendantPhone={app.defendant_phone}
            selfieUrl={
              data.documents.find((d) => d.doc_type === 'selfie' && !d.indemnitor_id)?.signed_url
              || data.checkins.find((c) => c.selfie_url)?.selfie_url
              || null
            }
          />
          <main className="flex-1 min-w-0">
            <OverviewBackBar />
            {renderActiveTab()}
          </main>
        </div>
      </div>
    </div>
  );
}
