'use client';

import { useState, useRef, useCallback } from 'react';

export type PhoneStatus = 'idle' | 'checking' | 'valid' | 'voip' | 'error';

interface VerifyResult {
  status: PhoneStatus;
  carrier?: string;
  line_type?: string;
  detail?: string;
}

export function usePhoneVerify() {
  const [results, setResults] = useState<Record<string, VerifyResult>>({});
  const inflightRef = useRef<Record<string, AbortController>>({});
  const lastDigitsRef = useRef<Record<string, string>>({});

  const verify = useCallback(async (phone: string, key: string) => {
    const digits = phone.replace(/\D/g, '');

    // Skip if too short
    if (digits.length < 10) {
      setResults(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    // Skip if same number already verified
    if (lastDigitsRef.current[key] === digits) return;

    // Abort any in-flight request for this key
    inflightRef.current[key]?.abort();

    const controller = new AbortController();
    inflightRef.current[key] = controller;
    lastDigitsRef.current[key] = digits;

    setResults(prev => ({ ...prev, [key]: { status: 'checking' } }));

    try {
      const res = await fetch('/api/admin/phone-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
        signal: controller.signal,
      });

      if (!res.ok) {
        setResults(prev => ({ ...prev, [key]: { status: 'error', detail: 'Lookup failed' } }));
        return;
      }

      const data = await res.json();
      const lineType = (data.line_type || '').toLowerCase();
      const isVoip = lineType === 'voip' || !!data.voip_provider;
      const carrier = data.carrier || '';
      const detail = isVoip
        ? `VOIP${data.voip_provider ? ` (${data.voip_provider})` : ''}`
        : `${lineType || 'unknown'}${carrier ? ` — ${carrier}` : ''}`;

      setResults(prev => ({
        ...prev,
        [key]: {
          status: isVoip ? 'voip' : 'valid',
          carrier,
          line_type: lineType,
          detail,
        },
      }));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setResults(prev => ({ ...prev, [key]: { status: 'error', detail: 'Lookup failed' } }));
    }
  }, []);

  const getStatus = useCallback(
    (key: string): VerifyResult => results[key] || { status: 'idle' },
    [results],
  );

  return { verify, getStatus };
}
