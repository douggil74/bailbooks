'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import type {
  Application,
  ApplicationReference,
  Signature,
  Document,
  Checkin,
  SmsLogEntry,
  ReminderSent,
} from '@/lib/bail-types';

interface DocumentWithUrl extends Document {
  signed_url: string | null;
}

interface CaseData {
  application: Application;
  references: ApplicationReference[];
  signatures: Signature[];
  documents: DocumentWithUrl[];
  checkins: Checkin[];
  sms_log: SmsLogEntry[];
  reminders_sent: ReminderSent[];
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'created' | 'signature' | 'document' | 'checkin' | 'sms_out' | 'sms_in' | 'reminder';
  title: string;
  detail: string;
  color: string;
}

const STATUS_FLOW: Application['status'][] = ['submitted', 'approved', 'active', 'completed'];

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

function checkinStatusColor(checkin: Checkin) {
  if (checkin.latitude && checkin.longitude) return 'text-green-400';
  return 'text-yellow-400';
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
}

function formatDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

function relativeTime(d: string): string {
  const now = Date.now();
  const then = new Date(d).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString();
}

function nextCheckinDate(checkins: Checkin[], frequency: string | null): string {
  if (!frequency || checkins.length === 0) return '—';
  const last = new Date(checkins[0].checked_in_at);
  const days = frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 14 : 30;
  const next = new Date(last.getTime() + days * 24 * 60 * 60 * 1000);
  const now = new Date();
  if (next < now) return `Overdue (was ${next.toLocaleDateString()})`;
  return next.toLocaleDateString();
}

function buildTimeline(data: CaseData): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Application created
  events.push({
    id: `created-${data.application.id}`,
    timestamp: data.application.created_at,
    type: 'created',
    title: 'Application created',
    detail: `${data.application.defendant_first} ${data.application.defendant_last} — status: ${data.application.status}`,
    color: 'bg-gray-500',
  });

  // Signatures
  for (const sig of data.signatures) {
    events.push({
      id: `sig-${sig.id}`,
      timestamp: sig.signed_at,
      type: 'signature',
      title: `Signature — ${sig.signer_role}`,
      detail: `${sig.signer_name} signed (${sig.signer_role})`,
      color: 'bg-purple-500',
    });
  }

  // Documents
  for (const doc of data.documents) {
    events.push({
      id: `doc-${doc.id}`,
      timestamp: doc.uploaded_at,
      type: 'document',
      title: `Document uploaded`,
      detail: doc.doc_type.replace(/_/g, ' '),
      color: 'bg-blue-500',
    });
  }

  // Check-ins
  for (const ci of data.checkins) {
    const hasLocation = ci.latitude && ci.longitude;
    events.push({
      id: `ci-${ci.id}`,
      timestamp: ci.checked_in_at,
      type: 'checkin',
      title: hasLocation ? 'Check-in recorded' : 'Check-in (no GPS)',
      detail: hasLocation
        ? `${ci.latitude!.toFixed(4)}, ${ci.longitude!.toFixed(4)} (${ci.accuracy ? ci.accuracy.toFixed(0) + 'm' : '?'})`
        : `Method: ${ci.method}`,
      color: hasLocation ? 'bg-green-500' : 'bg-yellow-500',
    });
  }

  // Reminders
  for (const rem of data.reminders_sent) {
    const typeLabel = rem.reminder_type.startsWith('court') ? 'Court' :
      rem.reminder_type.startsWith('payment') ? 'Payment' : 'Check-in';
    events.push({
      id: `rem-${rem.id}`,
      timestamp: rem.sent_at,
      type: 'reminder',
      title: `${typeLabel} reminder sent`,
      detail: `${rem.channel.toUpperCase()} — ${rem.reminder_type}`,
      color: 'bg-amber-500',
    });
  }

  // SMS
  for (const sms of data.sms_log) {
    events.push({
      id: `sms-${sms.id}`,
      timestamp: sms.sent_at,
      type: sms.direction === 'outbound' ? 'sms_out' : 'sms_in',
      title: sms.direction === 'outbound' ? 'SMS sent' : 'SMS received',
      detail: sms.message || '(no content)',
      color: sms.direction === 'outbound' ? 'bg-[#1a4d2e]' : 'bg-orange-500',
    });
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return events;
}

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editable fields
  const [powerNumber, setPowerNumber] = useState('');
  const [premium, setPremium] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [agentNotes, setAgentNotes] = useState('');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [checkinSending, setCheckinSending] = useState(false);

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxLabel, setLightboxLabel] = useState('');

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
      setPowerNumber(app.power_number || '');
      setPremium(app.premium != null ? String(app.premium) : '');
      setDownPayment(app.down_payment != null ? String(app.down_payment) : '');
      setPaymentAmount(app.payment_amount != null ? String(app.payment_amount) : '');
      setAgentNotes(app.agent_notes || '');
      setNextPaymentDate(app.next_payment_date || '');
      setLoading(false);
    } catch {
      setError('Failed to load case');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const timeline = useMemo(() => (data ? buildTimeline(data) : []), [data]);

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

  async function changeStatus(newStatus: Application['status']) {
    await saveField({ status: newStatus });
  }

  async function sendCheckin() {
    setCheckinSending(true);
    try {
      const res = await fetch('/api/checkin/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSaveMsg(`Check-in error: ${json.error}`);
      } else {
        setSaveMsg('Check-in request sent');
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
          <a href="/admin" className="text-[#d4af37] underline">
            Back to cases
          </a>
        </div>
      </div>
    );
  }

  const { application: app, references, signatures, documents, checkins, sms_log, reminders_sent } = data;

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
            <img
              src={lightboxUrl}
              alt={lightboxLabel}
              className="w-full rounded-lg shadow-2xl"
            />
            <p className="text-center text-sm text-gray-400 mt-3 capitalize">{lightboxLabel}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#1a4d2e] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <a href="/admin" className="text-sm text-green-200 hover:underline">
              &larr; All Cases
            </a>
            <h1 className="text-xl font-bold mt-1">
              {app.defendant_first} {app.defendant_last}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusBadge(app.status)}`}>
              {app.status}
            </span>
            <select
              value={app.status}
              onChange={(e) => changeStatus(e.target.value as Application['status'])}
              className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
            >
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Save indicator */}
      {saveMsg && (
        <div
          className={`text-center text-sm py-2 ${
            saveMsg.startsWith('Error') || saveMsg.includes('failed')
              ? 'bg-red-900/50 text-red-300'
              : 'bg-green-900/50 text-green-300'
          }`}
        >
          {saveMsg}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* ── CASE INFO ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4 text-[#d4af37]">Case Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Field label="Phone" value={app.defendant_phone} />
            <Field label="Email" value={app.defendant_email} />
            <Field label="DOB" value={formatDate(app.defendant_dob)} />
            <Field label="Address" value={app.defendant_address} />
            <Field
              label="City / State / Zip"
              value={`${app.defendant_city || ''}, ${app.defendant_state || ''} ${app.defendant_zip || ''}`}
            />
            <Field label="SSN (last 4)" value={app.defendant_ssn_last4 ? `***-**-${app.defendant_ssn_last4}` : null} />
            <Field label="DL Number" value={app.defendant_dl_number} />
            <Field label="Employer" value={app.employer_name} />
            <Field label="Employer Phone" value={app.employer_phone} />
            <Field label="Charges" value={app.charge_description} />
            <Field
              label="Bond Amount"
              value={app.bond_amount ? `$${Number(app.bond_amount).toLocaleString()}` : null}
            />
            <Field label="Court" value={app.court_name} />
            <Field label="Court Date" value={formatDate(app.court_date)} />
            <Field label="Case Number" value={app.case_number} />
            <Field label="Jail Location" value={app.jail_location} />
          </div>

          {/* Editable agent fields */}
          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Agent Fields</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <EditField
                label="Power Number"
                value={powerNumber}
                onChange={setPowerNumber}
                onBlur={() => saveField({ power_number: powerNumber || null })}
                disabled={saving}
              />
              <EditField
                label="Premium ($)"
                value={premium}
                onChange={setPremium}
                onBlur={() => saveField({ premium: premium ? parseFloat(premium) : null })}
                disabled={saving}
                type="number"
              />
              <EditField
                label="Down Payment ($)"
                value={downPayment}
                onChange={setDownPayment}
                onBlur={() => saveField({ down_payment: downPayment ? parseFloat(downPayment) : null })}
                disabled={saving}
                type="number"
              />
              <EditField
                label="Payment Amount ($)"
                value={paymentAmount}
                onChange={setPaymentAmount}
                onBlur={() => saveField({ payment_amount: paymentAmount ? parseFloat(paymentAmount) : null })}
                disabled={saving}
                type="number"
              />
              <EditField
                label="Next Payment Due"
                value={nextPaymentDate}
                onChange={setNextPaymentDate}
                onBlur={() => saveField({ next_payment_date: nextPaymentDate || null })}
                disabled={saving}
                type="date"
              />
            </div>
          </div>

          {/* References */}
          {references.length > 0 && (
            <div className="border-t border-gray-800 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">References</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {references.map((ref) => (
                  <div key={ref.id} className="bg-gray-800 rounded-lg p-3">
                    <p className="text-sm font-semibold">{ref.full_name}</p>
                    <p className="text-xs text-gray-400">{ref.relationship}</p>
                    <p className="text-xs text-gray-400">{ref.phone}</p>
                    {ref.address && <p className="text-xs text-gray-500">{ref.address}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── DOCUMENTS & ID ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#d4af37]">Files & ID</h2>
            <a
              href={`/api/onboard/generate-pdf?id=${id}`}
              target="_blank"
              className="bg-[#d4af37] text-gray-900 text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#e5c55a] transition-colors"
            >
              Download Full PDF
            </a>
          </div>

          {documents.length === 0 && signatures.length === 0 ? (
            <p className="text-sm text-gray-500">No documents uploaded yet.</p>
          ) : (
            <>
              {/* Photo thumbnails — grid with click-to-expand */}
              {documents.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {documents.map((doc) => {
                    const label = doc.doc_type.replace(/_/g, ' ');
                    return (
                      <button
                        key={doc.id}
                        onClick={() => {
                          if (doc.signed_url) {
                            setLightboxUrl(doc.signed_url);
                            setLightboxLabel(label);
                          }
                        }}
                        className="text-left bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-500 transition-colors group"
                      >
                        {doc.signed_url ? (
                          <div className="relative">
                            <img
                              src={doc.signed_url}
                              alt={label}
                              className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                              <span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                                View full size
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-48 flex items-center justify-center text-gray-600 text-sm">
                            No preview available
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-sm font-semibold capitalize">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDateTime(doc.uploaded_at)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Signatures inline */}
              {signatures.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Signatures</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {signatures.map((sig) => (
                      <div
                        key={sig.id}
                        className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex items-center gap-4"
                      >
                        {sig.signature_data ? (
                          <img
                            src={sig.signature_data}
                            alt={`${sig.signer_name} signature`}
                            className="h-14 bg-white rounded px-2 flex-shrink-0"
                          />
                        ) : (
                          <div className="h-14 w-28 flex items-center justify-center text-gray-600 text-xs bg-gray-700 rounded flex-shrink-0">
                            No image
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{sig.signer_name}</p>
                          <p className="text-xs text-gray-400 capitalize">{sig.signer_role}</p>
                          <p className="text-xs text-gray-600">{formatDateTime(sig.signed_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── NOTES ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#d4af37] mb-3">Agent Notes</h2>
          <textarea
            value={agentNotes}
            onChange={(e) => setAgentNotes(e.target.value)}
            onBlur={() => saveField({ agent_notes: agentNotes || null })}
            disabled={saving}
            rows={5}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1a4d2e] disabled:opacity-50 leading-relaxed"
            placeholder="Internal notes, observations, next steps..."
          />
          <p className="text-xs text-gray-600 mt-2">
            Auto-saves on blur. Last updated: {app.updated_at ? formatDateTime(app.updated_at) : '—'}
          </p>
        </section>

        {/* ── CHECK-IN SCHEDULE & HISTORY ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#d4af37]">Check-in Schedule & History</h2>
            <button
              onClick={sendCheckin}
              disabled={checkinSending}
              className="bg-[#1a4d2e] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#256b3e] transition-colors disabled:opacity-50"
            >
              {checkinSending ? 'Sending...' : 'Send Check-in Now'}
            </button>
          </div>

          <div className="flex flex-wrap gap-6 text-sm mb-4">
            <div>
              <span className="text-gray-500">Frequency:</span>{' '}
              <span className="capitalize font-semibold">{app.checkin_frequency || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Next Due:</span>{' '}
              <span className="font-semibold">
                {nextCheckinDate(checkins, app.checkin_frequency)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total Check-ins:</span>{' '}
              <span className="font-semibold">{checkins.length}</span>
            </div>
          </div>

          {checkins.length === 0 ? (
            <p className="text-sm text-gray-500">No check-ins recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
                    <th className="text-left py-2 pr-4">Date / Time</th>
                    <th className="text-left py-2 pr-4">Location</th>
                    <th className="text-left py-2 pr-4">Accuracy</th>
                    <th className="text-left py-2 pr-4">Method</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {checkins.map((ci) => (
                    <tr key={ci.id} className="border-b border-gray-800/50">
                      <td className="py-2 pr-4 text-gray-300">
                        {formatDateTime(ci.checked_in_at)}
                      </td>
                      <td className="py-2 pr-4 text-gray-400 font-mono text-xs">
                        {ci.latitude && ci.longitude
                          ? `${ci.latitude.toFixed(4)}, ${ci.longitude.toFixed(4)}`
                          : '—'}
                      </td>
                      <td className="py-2 pr-4 text-gray-400">
                        {ci.accuracy ? `${ci.accuracy.toFixed(0)}m` : '—'}
                      </td>
                      <td className="py-2 pr-4 text-gray-400 capitalize">
                        {ci.method?.replace(/_/g, ' ') || '—'}
                      </td>
                      <td className={`py-2 font-semibold ${checkinStatusColor(ci)}`}>
                        {ci.latitude && ci.longitude ? 'Responded' : 'Pending'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── REMINDERS SENT ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#d4af37] mb-4">Reminders Sent</h2>

          {reminders_sent.length === 0 ? (
            <p className="text-sm text-gray-500">No reminders sent yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-left py-2 pr-4">Type</th>
                    <th className="text-left py-2">Channel</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders_sent.map((rem) => (
                    <tr key={rem.id} className="border-b border-gray-800/50">
                      <td className="py-2 pr-4 text-gray-300">
                        {formatDateTime(rem.sent_at)}
                      </td>
                      <td className="py-2 pr-4 text-gray-400">{rem.reminder_type}</td>
                      <td className="py-2 text-gray-400 capitalize">{rem.channel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── ACTIVITY LOG ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#d4af37] mb-4">Activity Log</h2>

          {timeline.length === 0 ? (
            <p className="text-sm text-gray-500">No activity recorded.</p>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gray-800" />

              <div className="space-y-4">
                {timeline.map((ev) => (
                  <div key={ev.id} className="flex gap-4 relative">
                    {/* Dot */}
                    <div className={`w-[15px] h-[15px] rounded-full flex-shrink-0 mt-0.5 ${ev.color} ring-2 ring-gray-900`} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">{ev.title}</p>
                        <time className="text-xs text-gray-600" title={formatDateTime(ev.timestamp)}>
                          {relativeTime(ev.timestamp)}
                        </time>
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5 break-words">{ev.detail}</p>
                      <p className="text-xs text-gray-700 mt-0.5">{formatDateTime(ev.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── SMS LOG ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#d4af37] mb-4">SMS Log</h2>

          {sms_log.length === 0 ? (
            <p className="text-sm text-gray-500">No SMS messages recorded.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sms_log.map((sms) => (
                <div
                  key={sms.id}
                  className={`rounded-lg p-3 text-sm ${
                    sms.direction === 'outbound'
                      ? 'bg-[#1a4d2e]/30 border border-green-900/50 ml-8'
                      : 'bg-gray-800 border border-gray-700 mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-400 capitalize">
                      {sms.direction === 'outbound' ? 'Sent' : 'Received'} — {sms.phone}
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatDateTime(sms.sent_at)}
                    </span>
                  </div>
                  <p className="text-gray-300">{sms.message || '(no content)'}</p>
                  {sms.status && (
                    <p className="text-xs text-gray-600 mt-1">Status: {sms.status}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ── Helper Components ── */

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-white">{value || '—'}</p>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  onBlur,
  disabled,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  disabled: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1a4d2e] disabled:opacity-50"
      />
    </div>
  );
}
