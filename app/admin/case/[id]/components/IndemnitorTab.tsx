'use client';

import { useState } from 'react';
import type { ApplicationReference, Signature, Indemnitor, Document } from '@/lib/bail-types';
import { usePhoneVerify } from '@/hooks/usePhoneVerify';
import type { PhoneStatus } from '@/hooks/usePhoneVerify';

interface DocumentWithUrl extends Document {
  signed_url: string | null;
}

interface WizardField {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
}

interface WizardStep {
  title: string;
  description: string;
  fields: WizardField[];
}

const INDEMNITOR_WIZARD_STEPS: WizardStep[] = [
  {
    title: 'Contact Info',
    description: "How can we reach the co-signer?",
    fields: [
      { key: 'first_name', label: 'First Name', placeholder: 'First name' },
      { key: 'last_name', label: 'Last Name', placeholder: 'Last name' },
      { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '(985) 555-1234' },
      { key: 'email', label: 'Email Address', type: 'email', placeholder: 'name@example.com' },
    ],
  },
  {
    title: 'Personal Details',
    description: 'Date of birth and identification.',
    fields: [
      { key: 'dob', label: 'Date of Birth', type: 'date' },
      { key: 'ssn_last4', label: 'SSN (last 4)', placeholder: '1234' },
      { key: 'dl_number', label: "Driver's License #", placeholder: 'DL number' },
    ],
  },
  {
    title: 'Home Address',
    description: "Co-signer's residential address.",
    fields: [
      { key: 'address', label: 'Street Address', placeholder: '123 Main St' },
      { key: 'city', label: 'City', placeholder: 'Covington' },
      { key: 'state', label: 'State', placeholder: 'LA' },
      { key: 'zip', label: 'Zip', placeholder: '70433' },
    ],
  },
  {
    title: 'Vehicle',
    description: 'Vehicle information for the co-signer.',
    fields: [
      { key: 'car_make', label: 'Make', placeholder: 'Ford' },
      { key: 'car_model', label: 'Model', placeholder: 'F-150' },
      { key: 'car_year', label: 'Year', placeholder: '2020' },
      { key: 'car_color', label: 'Color', placeholder: 'White' },
    ],
  },
  {
    title: 'Employment',
    description: 'Where does the co-signer work?',
    fields: [
      { key: 'employer_name', label: 'Employer', placeholder: 'Company name' },
      { key: 'employer_phone', label: 'Employer Phone', type: 'tel', placeholder: '(985) 555-5678' },
    ],
  },
];

function statusBadge(status: string) {
  switch (status) {
    case 'complete': return 'bg-green-900/60 text-green-400';
    case 'in_progress': return 'bg-yellow-900/60 text-yellow-400';
    default: return 'bg-zinc-700 text-zinc-400';
  }
}

export default function IndemnitorTab({
  applicationId,
  indemnitors,
  references,
  signatures,
  documents,
  onRefresh,
}: {
  applicationId: string;
  indemnitors: Indemnitor[];
  references: ApplicationReference[];
  signatures: Signature[];
  documents: DocumentWithUrl[];
  onRefresh: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingField, setSavingField] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Inline edit state per field
  const [editValues, setEditValues] = useState<Record<string, Record<string, string>>>({});

  // Wizard state
  const { verify: verifyPhone, getStatus: getPhoneStatus } = usePhoneVerify();

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState<Record<string, string>>({});
  const [wizardSaving, setWizardSaving] = useState(false);

  const currentWizardStep = INDEMNITOR_WIZARD_STEPS[wizardStep];
  const isLastWizardStep = wizardStep === INDEMNITOR_WIZARD_STEPS.length - 1;

  function getEditValue(indId: string, field: string, fallback: string) {
    return editValues[indId]?.[field] ?? fallback;
  }

  function setEditValue(indId: string, field: string, value: string) {
    setEditValues(prev => ({
      ...prev,
      [indId]: { ...prev[indId], [field]: value },
    }));
  }

  async function saveIndemnitorField(indId: string, field: string, value: string | null) {
    setSavingField(true);
    try {
      await fetch('/api/admin/indemnitors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: indId, [field]: value }),
      });
      onRefresh();
    } catch { /* ignore */ }
    setSavingField(false);
  }

  async function sendInvite(indId: string) {
    setActionMsg('Sending invite...');
    try {
      const res = await fetch('/api/admin/indemnitors/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indemnitor_id: indId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(data.error || 'Failed to send');
      } else {
        setActionMsg('Invite sent!');
        onRefresh();
      }
    } catch { setActionMsg('Failed to send invite'); }
    setTimeout(() => setActionMsg(''), 4000);
  }

  async function deleteIndemnitor(indId: string) {
    try {
      await fetch(`/api/admin/indemnitors?id=${indId}`, { method: 'DELETE' });
      setConfirmDeleteId(null);
      onRefresh();
    } catch { /* ignore */ }
  }

  // Wizard handlers
  function openWizard() {
    setWizardData({});
    setWizardStep(0);
    setShowWizard(true);
  }

  async function wizardNext() {
    if (isLastWizardStep) {
      await wizardFinish();
    } else {
      setWizardStep(s => s + 1);
    }
  }

  function wizardBack() {
    setWizardStep(s => Math.max(0, s - 1));
  }

  function wizardSkip() {
    if (isLastWizardStep) {
      wizardFinish();
    } else {
      setWizardStep(s => s + 1);
    }
  }

  async function wizardFinish() {
    const first = (wizardData.first_name || '').trim();
    const last = (wizardData.last_name || '').trim();
    if (!first || !last) {
      setActionMsg('First and last name are required');
      setWizardStep(0);
      setTimeout(() => setActionMsg(''), 3000);
      return;
    }
    setWizardSaving(true);
    try {
      // Create indemnitor with name + phone first
      const res = await fetch('/api/admin/indemnitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          first_name: first,
          last_name: last,
          phone: (wizardData.phone || '').trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(data.error || 'Failed to add');
      } else {
        // Now save all extra fields on the newly created indemnitor
        const newId = data.id || data.indemnitor?.id;
        if (newId) {
          const extraFields: Record<string, string | null> = {};
          for (const step of INDEMNITOR_WIZARD_STEPS) {
            for (const f of step.fields) {
              if (f.key === 'first_name' || f.key === 'last_name' || f.key === 'phone') continue;
              const val = (wizardData[f.key] || '').trim() || null;
              if (val) extraFields[f.key] = val;
            }
          }
          if (Object.keys(extraFields).length > 0) {
            await fetch('/api/admin/indemnitors', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: newId, ...extraFields }),
            });
          }
        }
        setShowWizard(false);
        setWizardData({});
        setWizardStep(0);
        onRefresh();
      }
    } catch {
      setActionMsg('Failed to add indemnitor');
    }
    setWizardSaving(false);
    setTimeout(() => setActionMsg(''), 3000);
  }

  const DOT_COLORS: Record<PhoneStatus, string> = {
    idle: '',
    checking: 'bg-zinc-400 animate-pulse',
    valid: 'bg-green-500',
    voip: 'bg-red-500',
    error: 'bg-yellow-500',
  };

  // Render helper for field (inline, not a component — avoids re-render bug)
  function renderField(indId: string, label: string, field: string, value: string | null, type = 'text') {
    return (
      <div key={`${indId}-${field}`}>
        <label className="block text-xs text-zinc-300 mb-1">{label}</label>
        <input
          type={type}
          value={getEditValue(indId, field, value || '')}
          onChange={(e) => setEditValue(indId, field, e.target.value)}
          onBlur={() => {
            const val = getEditValue(indId, field, value || '').trim() || null;
            if (val !== (value || null)) saveIndemnitorField(indId, field, val);
          }}
          disabled={savingField}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#fbbf24] disabled:opacity-50"
        />
      </div>
    );
  }

  function renderPhoneField(indId: string, label: string, field: string, value: string | null) {
    const key = `${indId}-${field}`;
    const { status, detail } = getPhoneStatus(key);
    return (
      <div key={key}>
        <label className="block text-xs text-zinc-300 mb-1">{label}</label>
        <div className="relative">
          <input
            type="tel"
            value={getEditValue(indId, field, value || '')}
            onChange={(e) => setEditValue(indId, field, e.target.value)}
            onBlur={() => {
              const val = getEditValue(indId, field, value || '').trim() || null;
              if (val !== (value || null)) saveIndemnitorField(indId, field, val);
              const phone = getEditValue(indId, field, value || '');
              if (phone) verifyPhone(phone, key);
            }}
            disabled={savingField}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#fbbf24] disabled:opacity-50"
          />
          {status !== 'idle' && (
            <span
              className={`absolute right-2 bottom-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                status === 'checking' ? 'bg-zinc-700 text-zinc-400 animate-pulse' :
                status === 'valid' ? 'bg-green-900/60 text-green-400' :
                status === 'voip' ? 'bg-red-900/60 text-red-400' :
                'bg-yellow-900/60 text-yellow-400'
              }`}
              title={detail || status}
            >
              {status === 'checking' ? '...' : status === 'valid' ? 'Verified' : status === 'voip' ? 'VOIP' : 'Error'}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indemnitors Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#fbbf24]">Indemnitors / Co-Signers</h2>
          <button
            onClick={openWizard}
            disabled={indemnitors.length >= 3}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#fbbf24] text-[#0a0a0a] hover:bg-[#fcd34d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add Indemnitor
          </button>
        </div>

        {actionMsg && (
          <p className={`text-sm mb-3 ${actionMsg.includes('Failed') || actionMsg.includes('error') || actionMsg.includes('required') ? 'text-red-400' : 'text-green-400'}`}>
            {actionMsg}
          </p>
        )}

        {indemnitors.length === 0 && !showWizard ? (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <p className="text-sm text-zinc-400">No indemnitors on file.</p>
            <p className="text-xs text-zinc-600 mt-1">
              Add a co-signer and send them a link to complete their information.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {indemnitors.map((ind) => {
              const isExpanded = expandedId === ind.id;
              const indSigs = signatures.filter(s => s.indemnitor_id === ind.id);
              const indDocs = documents.filter(d => d.indemnitor_id === ind.id) as DocumentWithUrl[];

              return (
                <div key={ind.id} className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ind.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-[#fbbf24]">
                        {ind.first_name[0]}{ind.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{ind.first_name} {ind.last_name}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span>{ind.phone || 'No phone'}</span>
                          {ind.email && (
                            <>
                              <span className="text-zinc-600">|</span>
                              <span className="truncate max-w-[150px]">{ind.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ind.status !== 'complete' && ind.phone && (
                        <span
                          onClick={(e) => { e.stopPropagation(); sendInvite(ind.id); }}
                          className="text-[10px] font-bold px-2 py-1 rounded bg-[#fbbf24] text-zinc-900 hover:bg-[#fcd34d] transition-colors cursor-pointer"
                        >
                          {ind.invite_sent_at ? 'Resend' : 'Invite'}
                        </span>
                      )}
                      {ind.invite_sent_at && !isExpanded && (
                        <span className="text-[10px] text-zinc-600 hidden sm:inline">
                          Invited {new Date(ind.invite_sent_at).toLocaleDateString()}
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${statusBadge(ind.status)}`}>
                        {ind.status.replace('_', ' ')}
                      </span>
                      <svg className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-zinc-700 p-4 space-y-5">
                      {/* Personal Info */}
                      <div>
                        <p className="text-xs font-semibold text-[#fbbf24] mb-3">Personal Information</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {renderField(ind.id, 'First Name', 'first_name', ind.first_name)}
                          {renderField(ind.id, 'Last Name', 'last_name', ind.last_name)}
                          {renderField(ind.id, 'Date of Birth', 'dob', ind.dob, 'date')}
                          {renderPhoneField(ind.id, 'Phone', 'phone', ind.phone)}
                          {renderField(ind.id, 'Email', 'email', ind.email, 'email')}
                          {renderField(ind.id, 'SSN (last 4)', 'ssn_last4', ind.ssn_last4)}
                          {renderField(ind.id, 'DL Number', 'dl_number', ind.dl_number)}
                        </div>
                      </div>

                      {/* Address */}
                      <div>
                        <p className="text-xs font-semibold text-[#fbbf24] mb-3">Address</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div className="sm:col-span-2 lg:col-span-3">
                            {renderField(ind.id, 'Street Address', 'address', ind.address)}
                          </div>
                          {renderField(ind.id, 'City', 'city', ind.city)}
                          {renderField(ind.id, 'State', 'state', ind.state)}
                          {renderField(ind.id, 'Zip', 'zip', ind.zip)}
                        </div>
                      </div>

                      {/* Vehicle */}
                      <div>
                        <p className="text-xs font-semibold text-[#fbbf24] mb-3">Vehicle</p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {renderField(ind.id, 'Make', 'car_make', ind.car_make)}
                          {renderField(ind.id, 'Model', 'car_model', ind.car_model)}
                          {renderField(ind.id, 'Year', 'car_year', ind.car_year)}
                          {renderField(ind.id, 'Color', 'car_color', ind.car_color)}
                        </div>
                      </div>

                      {/* Employment */}
                      <div>
                        <p className="text-xs font-semibold text-[#fbbf24] mb-3">Employment</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {renderField(ind.id, 'Employer', 'employer_name', ind.employer_name)}
                          {renderPhoneField(ind.id, 'Employer Phone', 'employer_phone', ind.employer_phone)}
                        </div>
                      </div>

                      {/* Documents */}
                      {indDocs.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#fbbf24] mb-3">Documents</p>
                          <div className="grid grid-cols-3 gap-3">
                            {indDocs.map(doc => (
                              <div key={doc.id} className="bg-zinc-700 rounded-lg overflow-hidden">
                                {doc.signed_url ? (
                                  <img src={doc.signed_url} alt={doc.doc_type.replace(/_/g, ' ')} className="w-full h-24 object-cover" />
                                ) : (
                                  <div className="w-full h-24 flex items-center justify-center text-zinc-500 text-xs">No preview</div>
                                )}
                                <p className="text-[10px] text-zinc-400 p-1.5 capitalize text-center">{doc.doc_type.replace(/_/g, ' ')}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Signature */}
                      {indSigs.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#fbbf24] mb-3">Signature</p>
                          {indSigs.map(sig => (
                            <div key={sig.id} className="flex items-center gap-3">
                              {sig.signature_data ? (
                                <img src={sig.signature_data} alt="signature" className="h-12 bg-white rounded px-2" />
                              ) : (
                                <span className="text-xs text-zinc-500">No signature image</span>
                              )}
                              <div>
                                <p className="text-xs text-zinc-300">{sig.signer_name}</p>
                                <p className="text-[10px] text-zinc-500">{new Date(sig.signed_at).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-zinc-700">
                        <button
                          onClick={() => sendInvite(ind.id)}
                          disabled={!ind.phone}
                          className="text-xs font-bold px-4 py-2 rounded-lg bg-[#fbbf24] text-zinc-900 hover:bg-[#fcd34d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {ind.invite_sent_at ? 'Resend Invite' : 'Send Invite'}
                        </button>
                        {ind.invite_sent_at && (
                          <span className="text-[10px] text-zinc-500 self-center">
                            Sent {new Date(ind.invite_sent_at).toLocaleDateString()}
                          </span>
                        )}
                        <div className="flex-1" />
                        {confirmDeleteId === ind.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-400">Delete?</span>
                            <button onClick={() => deleteIndemnitor(ind.id)} className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors">Yes</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(ind.id)} className="text-xs text-red-500 hover:text-red-400 transition-colors">Delete</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* References Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#fbbf24] mb-4">References</h2>

        {references.length === 0 ? (
          <p className="text-sm text-zinc-500">No references on file.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {references.map((ref) => (
              <div key={ref.id} className="bg-zinc-800 rounded-lg p-4">
                <p className="text-sm font-semibold">{ref.full_name}</p>
                <p className="text-xs text-zinc-400">{ref.relationship}</p>
                <p className="text-xs text-zinc-400 mt-1">{ref.phone}</p>
                {ref.address && <p className="text-xs text-zinc-500 mt-0.5">{ref.address}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Indemnitor Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-5">
              {INDEMNITOR_WIZARD_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === wizardStep ? 'bg-[#fbbf24]' : i < wizardStep ? 'bg-[#fbbf24]/40' : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{currentWizardStep.title}</h3>
            <p className="text-sm text-zinc-400 mb-5">{currentWizardStep.description}</p>
            <div className="space-y-3">
              {currentWizardStep.fields.map((f, i) => (
                <div key={f.key}>
                  <label className="block text-xs text-zinc-400 mb-1">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    value={wizardData[f.key] || ''}
                    onChange={(e) => setWizardData(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    autoFocus={i === 0}
                    onKeyDown={(e) => { if (e.key === 'Enter') wizardNext(); }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              {wizardStep > 0 && (
                <button onClick={wizardBack} className="px-4 py-2.5 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors text-sm">
                  Back
                </button>
              )}
              <button onClick={wizardSkip} className="px-4 py-2.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
                {isLastWizardStep ? 'Skip & Finish' : 'Skip'}
              </button>
              <button
                onClick={wizardNext}
                disabled={wizardSaving}
                className="flex-1 px-4 py-2.5 bg-[#fbbf24] text-[#0a0a0a] font-bold rounded-lg hover:bg-[#fcd34d] transition-colors text-sm disabled:opacity-50"
              >
                {wizardSaving ? 'Saving...' : isLastWizardStep ? 'Done' : 'Next'}
              </button>
            </div>
            <button
              onClick={() => { setShowWizard(false); setWizardStep(0); setWizardData({}); }}
              className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 mt-4 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
