import type { ApplicationReference, Signature } from '@/lib/bail-types';

function formatDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

export default function IndemnitorTab({
  references,
  signatures,
}: {
  references: ApplicationReference[];
  signatures: Signature[];
}) {
  const indemnitorSigs = signatures.filter((s) => s.signer_role === 'indemnitor');

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#d4af37] mb-4">Indemnitors</h2>

        {indemnitorSigs.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">No indemnitor signatures on file.</p>
            <p className="text-xs text-gray-600 mt-1">
              An indemnitor (co-signer) will appear here once they sign the agreement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {indemnitorSigs.map((sig) => (
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
                  <p className="text-xs text-gray-400">Indemnitor / Co-Signer</p>
                  <p className="text-xs text-gray-600">{formatDateTime(sig.signed_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#d4af37] mb-4">References</h2>

        {references.length === 0 ? (
          <p className="text-sm text-gray-500">No references on file.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {references.map((ref) => (
              <div key={ref.id} className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm font-semibold">{ref.full_name}</p>
                <p className="text-xs text-gray-400">{ref.relationship}</p>
                <p className="text-xs text-gray-400 mt-1">{ref.phone}</p>
                {ref.address && <p className="text-xs text-gray-500 mt-0.5">{ref.address}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
