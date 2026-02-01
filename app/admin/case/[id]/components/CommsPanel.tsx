import { useState, useRef, useEffect } from 'react';
import type { SmsLogEntry, Indemnitor } from '@/lib/bail-types';

interface CommsPanelProps {
  applicationId: string;
  smsLog: SmsLogEntry[];
  defendantName: string;
  defendantPhone: string | null;
  indemnitors: Indemnitor[];
  smsConsent: boolean;
  onRefresh: () => void;
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(d: string) {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDate(messages: SmsLogEntry[]) {
  const groups: { date: string; messages: SmsLogEntry[] }[] = [];
  const sorted = [...messages].sort(
    (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime(),
  );
  for (const msg of sorted) {
    const dateKey = new Date(msg.sent_at).toDateString();
    const last = groups[groups.length - 1];
    if (last && new Date(last.messages[0].sent_at).toDateString() === dateKey) {
      last.messages.push(msg);
    } else {
      groups.push({ date: dateKey, messages: [msg] });
    }
  }
  return groups;
}

export default function CommsPanel({
  applicationId,
  smsLog,
  defendantName,
  defendantPhone,
  indemnitors,
  smsConsent,
  onRefresh,
}: CommsPanelProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [recipient, setRecipient] = useState<'defendant' | string>('defendant');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [smsLog.length]);

  // Build recipient options
  const recipients: { id: string; label: string; phone: string | null }[] = [
    { id: 'defendant', label: defendantName || 'Defendant', phone: defendantPhone },
  ];
  for (const ind of indemnitors) {
    if (ind.phone) {
      recipients.push({
        id: `ind-${ind.id}`,
        label: `${ind.first_name} ${ind.last_name}`,
        phone: ind.phone,
      });
    }
  }

  const selectedRecipient = recipients.find((r) => r.id === recipient) || recipients[0];

  async function handleSend() {
    if (!message.trim() || !selectedRecipient?.phone) return;
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/admin/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          phone: selectedRecipient.phone,
          message: message.trim(),
          recipient_label: selectedRecipient.label,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSendError(json.error || 'Send failed');
      } else {
        setMessage('');
        onRefresh();
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send');
    }
    setSending(false);
  }

  const groups = groupByDate(smsLog);

  return (
    <div className="hidden xl:flex flex-col w-80 flex-shrink-0 self-start sticky top-4 h-[calc(100vh-120px)]">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#fbbf24]">Communications</h3>
            <div className="flex items-center gap-1.5">
              {smsConsent ? (
                <span className="text-[10px] font-semibold bg-green-900/60 text-green-400 px-2 py-0.5 rounded-full">
                  SMS Consent
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-red-900/60 text-red-400 px-2 py-0.5 rounded-full">
                  No Consent
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Message list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-h-0">
          {smsLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <svg className="w-10 h-10 text-zinc-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-xs text-zinc-500">
                {smsConsent
                  ? 'No messages yet. Send the first message below.'
                  : 'Communications log will appear here after SMS consent is granted.'}
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                    {formatDate(group.messages[0].sent_at)}
                  </span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>

                {/* Messages */}
                <div className="space-y-2">
                  {group.messages.map((sms) => (
                    <div
                      key={sms.id}
                      className={`flex flex-col ${sms.direction === 'outbound' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                          sms.direction === 'outbound'
                            ? 'bg-[#fbbf24]/15 border border-[#fbbf24]/20 text-zinc-200'
                            : 'bg-zinc-800 border border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <p className="break-words leading-relaxed">{sms.message || '(no content)'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 px-1">
                        <span className="text-[10px] text-zinc-600">
                          {formatTime(sms.sent_at)}
                        </span>
                        <span className="text-[10px] text-zinc-700">
                          {sms.direction === 'outbound' ? 'Sent' : 'Received'}
                        </span>
                        {sms.status && sms.status !== 'sent' && sms.status !== 'received' && (
                          <span className={`text-[10px] ${sms.status === 'skipped' ? 'text-yellow-600' : 'text-zinc-700'}`}>
                            ({sms.status})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Compose area */}
        <div className="border-t border-zinc-800 px-3 py-3 flex-shrink-0 space-y-2">
          {/* Recipient selector */}
          {recipients.length > 1 && (
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#fbbf24]"
            >
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  To: {r.label} {r.phone ? `(${r.phone})` : ''}
                </option>
              ))}
            </select>
          )}

          {/* Single recipient label */}
          {recipients.length === 1 && (
            <div className="text-[10px] text-zinc-500 px-1">
              To: {selectedRecipient.label} {selectedRecipient.phone ? `(${selectedRecipient.phone})` : '— no phone'}
            </div>
          )}

          {sendError && (
            <p className="text-[10px] text-red-400 px-1">{sendError}</p>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={selectedRecipient?.phone ? 'Type a message...' : 'No phone number on file'}
              disabled={!selectedRecipient?.phone || sending}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#fbbf24] disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || !selectedRecipient?.phone || sending}
              className="bg-[#fbbf24] text-[#0a0a0a] px-3 py-2 rounded-lg hover:bg-[#fcd34d] transition-colors disabled:opacity-30 flex-shrink-0"
            >
              {sending ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
