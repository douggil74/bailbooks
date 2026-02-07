'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
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

type Step = 'ready' | 'getting_gps' | 'selfie' | 'uploading' | 'success' | 'error' | 'missing_id' | 'loading';

function CheckinContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id');

  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!applicationId) {
      setStep('missing_id');
    } else {
      setStep('ready');
    }
  }, [applicationId]);

  const getLocation = useCallback(async () => {
    if (!applicationId) return;
    setStep('getting_gps');
    setError(null);

    if (!('geolocation' in navigator)) {
      setError('GPS is not available on this device.');
      setStep('error');
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
      setStep('selfie');
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        if (err.code === 1) {
          setError('Location permission denied. Please allow location access and try again.');
        } else if (err.code === 2) {
          setError('Could not determine your location. Please try again.');
        } else {
          setError('Location request timed out. Please try again.');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to get location');
      }
      setStep('error');
    }
  }, [applicationId]);

  function handleSelfieChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
  }

  const submitCheckin = useCallback(async () => {
    if (!applicationId || !coords) return;
    setStep('uploading');
    setError(null);

    try {
      let selfiePath: string | null = null;

      // Upload selfie if captured
      if (selfieFile) {
        const formData = new FormData();
        formData.append('file', selfieFile);
        formData.append('application_id', applicationId);

        const uploadRes = await fetch('/api/checkin/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload selfie');
        selfiePath = uploadData.path;
      }

      // Record check-in with GPS + selfie path
      const res = await fetch('/api/checkin/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          latitude: coords.lat,
          longitude: coords.lng,
          accuracy: coords.accuracy,
          selfie_path: selfiePath,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record check-in');
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
      setStep('error');
    }
  }, [applicationId, coords, selfieFile]);

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
          <p className="text-sm text-gray-500 mb-6">BailBonds Financed</p>

          {step === 'missing_id' && (
            <p className="text-red-600 text-sm">Invalid check-in link. Please use the link from your SMS.</p>
          )}

          {step === 'ready' && (
            <>
              {/* Steps indicator */}
              <div className="flex items-center justify-center gap-2 mb-5 text-xs text-gray-400">
                <span className="bg-[#1a4d2e] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Location</span>
                <span className="text-gray-300 mx-1">&rarr;</span>
                <span className="bg-gray-200 text-gray-500 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Selfie</span>
              </div>
              <button
                onClick={getLocation}
                className="w-full bg-[#1a4d2e] text-white py-3 rounded-lg font-medium active:bg-[#0f3620]"
              >
                Start Check-In
              </button>
            </>
          )}

          {step === 'getting_gps' && (
            <div className="py-4">
              <div className="animate-spin w-8 h-8 border-4 border-[#1a4d2e] border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-500">Getting your location...</p>
            </div>
          )}

          {step === 'selfie' && (
            <div>
              {/* Steps indicator */}
              <div className="flex items-center justify-center gap-2 mb-5 text-xs text-gray-400">
                <span className="bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </span>
                <span className="text-green-600">Location</span>
                <span className="text-gray-300 mx-1">&rarr;</span>
                <span className="bg-[#1a4d2e] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Selfie</span>
              </div>

              {coords && (
                <p className="text-xs text-green-600 mb-4">
                  Location captured: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </p>
              )}

              <p className="text-sm text-gray-600 mb-4">Take a selfie for verification.</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleSelfieChange}
                className="hidden"
              />

              {selfiePreview ? (
                <div className="mb-4">
                  <img
                    src={selfiePreview}
                    alt="Selfie preview"
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-[#1a4d2e]"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-[#1a4d2e] underline mt-2"
                  >
                    Retake
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg py-6 mb-4 hover:bg-gray-50"
                >
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-gray-500">Tap to take selfie</span>
                </button>
              )}

              <button
                onClick={submitCheckin}
                className="w-full bg-[#1a4d2e] text-white py-3 rounded-lg font-medium active:bg-[#0f3620]"
              >
                {selfieFile ? 'Submit Check-In' : 'Submit Without Selfie'}
              </button>
            </div>
          )}

          {step === 'uploading' && (
            <div className="py-4">
              <div className="animate-spin w-8 h-8 border-4 border-[#1a4d2e] border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-500">Submitting check-in...</p>
            </div>
          )}

          {step === 'success' && (
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
              {selfieFile && (
                <p className="text-xs text-gray-400 mt-1">Selfie uploaded</p>
              )}
            </div>
          )}

          {step === 'error' && (
            <div>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button
                onClick={() => {
                  setSelfieFile(null);
                  setSelfiePreview(null);
                  setCoords(null);
                  setStep('ready');
                }}
                className="w-full bg-[#1a4d2e] text-white py-3 rounded-lg font-medium"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Your location and photo are only used for bond compliance check-ins.
        </p>
      </div>
    </div>
  );
}
