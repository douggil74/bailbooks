'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { Document, Signature, Indemnitor, Checkin } from '@/lib/bail-types';

const LocationMap = dynamic(() => import('./LocationMap'), { ssr: false });

interface DocumentWithUrl extends Document {
  signed_url: string | null;
}

interface CheckinWithUrl extends Checkin {
  selfie_url: string | null;
}

function formatDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

function DocumentGrid({
  documents,
  onOpenLightbox,
}: {
  documents: DocumentWithUrl[];
  onOpenLightbox: (url: string, label: string) => void;
}) {
  if (documents.length === 0) {
    return <p className="text-sm text-zinc-500">No documents uploaded.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {documents.map((doc) => {
        const label = doc.doc_type.replace(/_/g, ' ');
        return (
          <button
            key={doc.id}
            onClick={() => {
              if (doc.signed_url) onOpenLightbox(doc.signed_url, label);
            }}
            className="text-left bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700 hover:border-zinc-500 transition-colors group"
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
              <div className="w-full h-48 flex items-center justify-center text-zinc-600 text-sm">
                No preview available
              </div>
            )}
            <div className="p-3">
              <p className="text-sm font-semibold capitalize">{label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {formatDateTime(doc.uploaded_at)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function FilesTab({
  documents,
  signatures,
  applicationId,
  indemnitors,
  checkins,
  onOpenLightbox,
  onRefresh,
}: {
  documents: DocumentWithUrl[];
  signatures: Signature[];
  applicationId: string;
  indemnitors: Indemnitor[];
  checkins: CheckinWithUrl[];
  onOpenLightbox: (url: string, label: string) => void;
  onRefresh?: () => void;
}) {
  const checkinsWithSelfies = checkins.filter((ci) => ci.selfie_url);
  const defendantDocs = documents.filter((d) => !d.indemnitor_id);
  const indemnitorDocsMap = new Map<string, DocumentWithUrl[]>();
  for (const doc of documents) {
    if (doc.indemnitor_id) {
      const arr = indemnitorDocsMap.get(doc.indemnitor_id) || [];
      arr.push(doc);
      indemnitorDocsMap.set(doc.indemnitor_id, arr);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#fbbf24]">Defendant Documents</h2>
          <a
            href={`/api/onboard/generate-pdf?id=${applicationId}`}
            target="_blank"
            className="bg-[#fbbf24] text-zinc-900 text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#fcd34d] transition-colors"
          >
            Download Full PDF
          </a>
        </div>
        <DocumentGrid documents={defendantDocs} onOpenLightbox={onOpenLightbox} />
        <UploadSection applicationId={applicationId} onRefresh={onRefresh} />
      </div>

      {/* Check-in Photos & Location History */}
      {checkins.some((ci) => ci.latitude && ci.longitude) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#fbbf24] mb-4">
            Check-in Photos
            <span className="text-sm font-normal text-zinc-400 ml-2">({checkinsWithSelfies.length})</span>
          </h2>
          {/* Location map */}
          <div className="mb-5">
            <LocationMap checkins={checkins} height={300} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {checkinsWithSelfies.map((ci) => (
              <button
                key={ci.id}
                onClick={() => {
                  if (ci.selfie_url) onOpenLightbox(ci.selfie_url, 'Check-in selfie');
                }}
                className="text-left bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700 hover:border-zinc-500 transition-colors group"
              >
                <div className="relative">
                  <img
                    src={ci.selfie_url!}
                    alt="Check-in selfie"
                    className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full">View full size</span>
                  </div>
                  {/* GPS badge */}
                  {ci.latitude && ci.longitude && (
                    <div className="absolute top-2 left-2 bg-black/70 text-green-400 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      GPS
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold">Check-in Selfie</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{formatDateTime(ci.checked_in_at)}</p>
                  {ci.latitude && ci.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${ci.latitude},${ci.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-[#fbbf24] hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {ci.latitude.toFixed(4)}, {ci.longitude.toFixed(4)}
                      {ci.accuracy && <span className="text-zinc-500">(±{ci.accuracy.toFixed(0)}m)</span>}
                    </a>
                  )}
                  {(!ci.latitude || !ci.longitude) && (
                    <p className="text-xs text-yellow-500 mt-1">No GPS data</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {indemnitors.map((ind) => {
        const docs = indemnitorDocsMap.get(ind.id) || [];
        return (
          <div key={ind.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-[#fbbf24] mb-4">
              {ind.first_name} {ind.last_name}
              <span className="text-sm font-normal text-zinc-400 ml-2">(Indemnitor)</span>
            </h2>
            <DocumentGrid documents={docs} onOpenLightbox={onOpenLightbox} />
          </div>
        );
      })}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#fbbf24] mb-4">Signatures</h2>

        {signatures.length === 0 ? (
          <p className="text-sm text-zinc-500">No signatures on file.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {signatures.map((sig) => (
              <div
                key={sig.id}
                className="bg-zinc-800 rounded-xl border border-zinc-700 p-4 flex items-center gap-4"
              >
                {sig.signature_data ? (
                  <img
                    src={sig.signature_data}
                    alt={`${sig.signer_name} signature`}
                    className="h-14 bg-white rounded px-2 flex-shrink-0"
                  />
                ) : (
                  <div className="h-14 w-28 flex items-center justify-center text-zinc-600 text-xs bg-zinc-700 rounded flex-shrink-0">
                    No image
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{sig.signer_name}</p>
                  <p className="text-xs text-zinc-400 capitalize">{sig.signer_role}</p>
                  <p className="text-xs text-zinc-600">{formatDateTime(sig.signed_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const UPLOAD_DOC_TYPES = [
  { value: 'drivers_license_front', label: "Driver's License — Front" },
  { value: 'drivers_license_back', label: "Driver's License — Back" },
  { value: 'selfie', label: 'Selfie' },
  { value: 'other', label: 'Other Document' },
];

function UploadSection({
  applicationId,
  onRefresh,
}: {
  applicationId: string;
  onRefresh?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [docType, setDocType] = useState('drivers_license_front');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Select a file first');
      return;
    }

    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('application_id', applicationId);
      fd.append('doc_type', docType);

      const res = await fetch('/api/onboard/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setSuccess(`Uploaded ${UPLOAD_DOC_TYPES.find((t) => t.value === docType)?.label}`);
      if (fileRef.current) fileRef.current.value = '';
      setTimeout(() => setSuccess(null), 3000);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-5 pt-5 border-t border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Upload Document</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#fbbf24] outline-none"
        >
          {UPLOAD_DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="text-sm text-zinc-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-zinc-200 hover:file:bg-zinc-600 flex-1"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-[#fbbf24] text-zinc-900 text-sm font-bold px-5 py-2 rounded-lg hover:bg-[#fcd34d] transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      {success && <p className="text-green-400 text-xs mt-2">{success}</p>}
    </div>
  );
}
