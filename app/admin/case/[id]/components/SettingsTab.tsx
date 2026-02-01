import type { Application } from '@/lib/bail-types';

const STATUS_FLOW: Application['status'][] = ['draft', 'submitted', 'approved', 'active', 'completed'];

function formatDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

export default function SettingsTab({
  application,
  agentNotes,
  setAgentNotes,
  saveField,
  saving,
  onChangeStatus,
  onDeleteCase,
}: {
  application: Application;
  agentNotes: string;
  setAgentNotes: (v: string) => void;
  saveField: (fields: Record<string, unknown>) => Promise<void>;
  saving: boolean;
  onChangeStatus: (status: Application['status']) => void;
  onDeleteCase: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Status Management */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#fbbf24] mb-4">Case Status</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm text-zinc-400">Current Status:</label>
          <select
            value={application.status}
            onChange={(e) => onChangeStatus(e.target.value as Application['status'])}
            className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"
          >
            {STATUS_FLOW.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Check-in Settings */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#fbbf24] mb-4">Check-in Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-zinc-400">Frequency:</label>
            <select
              value={application.checkin_frequency || 'weekly'}
              onChange={(e) => saveField({ checkin_frequency: e.target.value })}
              className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">SMS Consent</p>
              <p className="text-xs text-zinc-500">Defendant agreed to receive text messages</p>
            </div>
            <button
              onClick={() => saveField({ sms_consent: !application.sms_consent })}
              className={`relative w-11 h-6 rounded-full transition-colors ${application.sms_consent ? 'bg-green-600' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${application.sms_consent ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">GPS Consent</p>
              <p className="text-xs text-zinc-500">Defendant agreed to GPS check-in tracking</p>
            </div>
            <button
              onClick={() => saveField({ gps_consent: !application.gps_consent })}
              className={`relative w-11 h-6 rounded-full transition-colors ${application.gps_consent ? 'bg-green-600' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${application.gps_consent ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Agent Notes */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#fbbf24] mb-3">Agent Notes</h2>
        <textarea
          value={agentNotes}
          onChange={(e) => setAgentNotes(e.target.value)}
          onBlur={() => saveField({ agent_notes: agentNotes || null })}
          disabled={saving}
          rows={6}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#fbbf24] disabled:opacity-50 leading-relaxed"
          placeholder="Internal notes, observations, next steps..."
        />
        <p className="text-xs text-zinc-600 mt-2">
          Auto-saves on blur. Last updated: {application.updated_at ? formatDateTime(application.updated_at) : '—'}
        </p>
      </div>

      {/* Danger Zone */}
      <div className="bg-zinc-900 border border-red-900/50 rounded-xl p-6">
        <h2 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Permanently delete this case and all associated data. This cannot be undone.
        </p>
        <button
          onClick={onDeleteCase}
          className="bg-red-600 text-white text-sm font-bold px-5 py-2 rounded-lg hover:bg-red-500 transition-colors"
        >
          Delete Case
        </button>
      </div>
    </div>
  );
}
