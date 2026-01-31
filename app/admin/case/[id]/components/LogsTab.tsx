import type { Checkin, SmsLogEntry, ReminderSent, Application, Signature, Document } from '@/lib/bail-types';

interface DocumentWithUrl extends Document {
  signed_url: string | null;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  detail: string;
  color: string;
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

function buildTimeline(
  app: Application,
  signatures: Signature[],
  documents: DocumentWithUrl[],
  checkins: Checkin[],
  reminders_sent: ReminderSent[],
  sms_log: SmsLogEntry[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    id: `created-${app.id}`,
    timestamp: app.created_at,
    type: 'created',
    title: 'Application created',
    detail: `${app.defendant_first} ${app.defendant_last} — status: ${app.status}`,
    color: 'bg-gray-500',
  });

  for (const sig of signatures) {
    events.push({
      id: `sig-${sig.id}`,
      timestamp: sig.signed_at,
      type: 'signature',
      title: `Signature — ${sig.signer_role}`,
      detail: `${sig.signer_name} signed (${sig.signer_role})`,
      color: 'bg-purple-500',
    });
  }

  for (const doc of documents) {
    events.push({
      id: `doc-${doc.id}`,
      timestamp: doc.uploaded_at,
      type: 'document',
      title: 'Document uploaded',
      detail: doc.doc_type.replace(/_/g, ' '),
      color: 'bg-gray-400',
    });
  }

  for (const ci of checkins) {
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

  for (const rem of reminders_sent) {
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

  for (const sms of sms_log) {
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

export default function LogsTab({
  application,
  checkins,
  sms_log,
  reminders_sent,
  signatures,
  documents,
  checkinSending,
  onSendCheckin,
}: {
  application: Application;
  checkins: Checkin[];
  sms_log: SmsLogEntry[];
  reminders_sent: ReminderSent[];
  signatures: Signature[];
  documents: DocumentWithUrl[];
  checkinSending: boolean;
  onSendCheckin: () => void;
}) {
  const timeline = buildTimeline(application, signatures, documents, checkins, reminders_sent, sms_log);

  return (
    <div className="space-y-6">
      {/* Check-in Schedule */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#d4af37]">Check-in Schedule & History</h2>
          <button
            onClick={onSendCheckin}
            disabled={checkinSending}
            className="bg-[#1a4d2e] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#256b3e] transition-colors disabled:opacity-50"
          >
            {checkinSending ? 'Sending...' : 'Send Check-in Now'}
          </button>
        </div>

        <div className="flex flex-wrap gap-6 text-sm mb-4">
          <div>
            <span className="text-gray-500">Frequency:</span>{' '}
            <span className="capitalize font-semibold">{application.checkin_frequency || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Next Due:</span>{' '}
            <span className="font-semibold">{nextCheckinDate(checkins, application.checkin_frequency)}</span>
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
                    <td className="py-2 pr-4 text-gray-300">{formatDateTime(ci.checked_in_at)}</td>
                    <td className="py-2 pr-4 text-gray-400 font-mono text-xs">
                      {ci.latitude && ci.longitude ? `${ci.latitude.toFixed(4)}, ${ci.longitude.toFixed(4)}` : '—'}
                    </td>
                    <td className="py-2 pr-4 text-gray-400">{ci.accuracy ? `${ci.accuracy.toFixed(0)}m` : '—'}</td>
                    <td className="py-2 pr-4 text-gray-400 capitalize">{ci.method?.replace(/_/g, ' ') || '—'}</td>
                    <td className={`py-2 font-semibold ${ci.latitude && ci.longitude ? 'text-green-400' : 'text-yellow-400'}`}>
                      {ci.latitude && ci.longitude ? 'Responded' : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reminders Sent */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
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
                    <td className="py-2 pr-4 text-gray-300">{formatDateTime(rem.sent_at)}</td>
                    <td className="py-2 pr-4 text-gray-400">{rem.reminder_type}</td>
                    <td className="py-2 text-gray-400 capitalize">{rem.channel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#d4af37] mb-4">Activity Log</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-gray-500">No activity recorded.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gray-800" />
            <div className="space-y-4">
              {timeline.map((ev) => (
                <div key={ev.id} className="flex gap-4 relative">
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
      </div>

      {/* SMS Log */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
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
                  <span className="text-xs text-gray-600">{formatDateTime(sms.sent_at)}</span>
                </div>
                <p className="text-gray-300">{sms.message || '(no content)'}</p>
                {sms.status && <p className="text-xs text-gray-600 mt-1">Status: {sms.status}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
