'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CheckinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#1a4d2e] border-t-transparent rounded-full" />
        </div>
      }
    >
      <CheckinContent />
    </Suspense>
  );
}

type Status = 'loading' | 'ready' | 'requesting' | 'success' | 'error' | 'missing_id';

function CheckinContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id');

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

  useEffect(() => {
    if (!applicationId) {
      setStatus('missing_id');
    } else {
      setStatus('ready');
    }
  }, [applicationId]);

  const doCheckin = useCallback(async () => {
    if (!applicationId) return;
    setStatus('requesting');
    setError(null);

    if (!('geolocation' in navigator)) {
      setError('GPS is not available on this device.');
      setStatus('error');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy } = position.coords;
      setCoords({ lat: latitude, lng: longitude, accuracy });

      const res = await fetch('/api/checkin/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          latitude,
          longitude,
          accuracy,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record check-in');
      setStatus('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Check-in failed';
      if (err instanceof GeolocationPositionError) {
        if (err.code === 1) {
          setError('Location permission denied. Please allow location access and try again.');
        } else if (err.code === 2) {
          setError('Could not determine your location. Please try again.');
        } else {
          setError('Location request timed out. Please try again.');
        }
      } else {
        setError(msg);
      }
      setStatus('error');
    }
  }, [applicationId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="w-12 h-12 bg-[#1a4d2e] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">GPS Check-In</h1>
          <p className="text-sm text-gray-500 mb-6">Bailbonds Financed</p>

          {status === 'missing_id' && (
            <p className="text-red-600 text-sm">Invalid check-in link. Please use the link from your SMS.</p>
          )}

          {status === 'ready' && (
            <button
              onClick={doCheckin}
              className="w-full bg-[#1a4d2e] text-white py-3 rounded-lg font-medium active:bg-[#0f3620]"
            >
              Check In Now
            </button>
          )}

          {status === 'requesting' && (
            <div className="py-4">
              <div className="animate-spin w-8 h-8 border-4 border-[#1a4d2e] border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-500">Getting your location...</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-700 font-medium mb-1">Check-in recorded</p>
              {coords && (
                <p className="text-xs text-gray-400">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)} (±{Math.round(coords.accuracy)}m)
                </p>
              )}
            </div>
          )}

          {status === 'error' && (
            <div>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button
                onClick={doCheckin}
                className="w-full bg-[#1a4d2e] text-white py-3 rounded-lg font-medium"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Your location is only used for bond compliance check-ins.
        </p>
      </div>
    </div>
  );
}
