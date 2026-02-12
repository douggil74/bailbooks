'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface DefendantData {
  application_id: string;
  first_name: string;
  last_name: string;
  dob: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  ssn_last4: string | null;
  dl_number: string | null;
  employer_name: string | null;
  employer_phone: string | null;
}

type StepId = 1 | 2 | 3;

export default function DefendantForm({
  token,
  defendant,
}: {
  token: string;
  defendant: DefendantData;
}) {
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);

  // Step 1: Personal Info — initialized from server data
  const [firstName, setFirstName] = useState(defendant.first_name);
  const [lastName, setLastName] = useState(defendant.last_name);
  const [dob, setDob] = useState(defendant.dob || '');
  const [phone, setPhone] = useState(defendant.phone || '');
  const [email, setEmail] = useState(defendant.email || '');
  const [address, setAddress] = useState(defendant.address || '');
  const [city, setCity] = useState(defendant.city || '');
  const [state, setState] = useState(defendant.state || 'LA');
  const [zip, setZip] = useState(defendant.zip || '');
  const [ssn4, setSsn4] = useState(defendant.ssn_last4 || '');
  const [dlNumber, setDlNumber] = useState(defendant.dl_number || '');
  const [employerName, setEmployerName] = useState(defendant.employer_name || '');
  const [employerPhone, setEmployerPhone] = useState(defendant.employer_phone || '');

  // Step 2: ID Upload
  const [dlFrontUploaded, setDlFrontUploaded] = useState(false);
  const [dlBackUploaded, setDlBackUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);

  // Step 3: Sign
  const [signerName, setSignerName] = useState(`${defendant.first_name} ${defendant.last_name}`.trim());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const steps: StepId[] = [1, 2, 3];
  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;

  const stepLabels: Record<StepId, string> = {
    1: 'Review Info',
    2: 'ID Upload',
    3: 'Sign',
  };

  function goNext() {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }

  function goBack() {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }

  async function saveFields() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required');
      return false;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/defendant/save', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          dob: dob || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
          city: city || null,
          state: state || 'LA',
          zip: zip || null,
          ssn_last4: ssn4 || null,
          dl_number: dlNumber || null,
          employer_name: employerName || null,
          employer_phone: employerPhone || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleStep1() {
    const ok = await saveFields();
    if (ok) goNext();
  }

  async function handleFileUpload(file: File, docType: string) {
    setError(null);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('token', token);
      fd.append('doc_type', docType);
      const res = await fetch('/api/defendant/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      if (docType === 'drivers_license_front') setDlFrontUploaded(true);
      if (docType === 'drivers_license_back') setDlBackUploaded(true);
      if (docType === 'selfie') setSelfieUploaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSaving(false);
    }
  }

  // Canvas signature setup
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#1a4d2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    function getPos(e: MouseEvent | TouchEvent) {
      const rect = canvas!.getBoundingClientRect();
      if ('touches' in e) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function startDraw(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      isDrawingRef.current = true;
      const pos = getPos(e);
      ctx!.beginPath();
      ctx!.moveTo(pos.x, pos.y);
    }

    function draw(e: MouseEvent | TouchEvent) {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx!.lineTo(pos.x, pos.y);
      ctx!.stroke();
    }

    function stopDraw() {
      isDrawingRef.current = false;
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDraw);
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDraw);
    };
  }, []);

  useEffect(() => {
    if (currentStep === 3) {
      const cleanup = setupCanvas();
      return cleanup;
    }
  }, [currentStep, setupCanvas]);

  async function handleSign() {
    if (!signerName.trim()) {
      setError('Please type your full legal name');
      return;
    }

    const canvas = canvasRef.current;
    const signatureData = canvas ? canvas.toDataURL('image/png') : '';

    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/defendant/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signer_name: signerName.trim(),
          signature_data: signatureData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signature failed');
      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSaving(false);
    }
  }

  const progress = complete ? 100 : (currentStepIndex / totalSteps) * 100;

  if (complete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">All Done!</h2>
          <p className="text-gray-600 text-sm">
            Thank you, {firstName}. Your information has been submitted.
            The bail agent will be in touch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a4d2e] text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold">BailBonds Financed</h1>
          <p className="text-xs text-green-200 mt-0.5">
            Defendant Form — {firstName} {lastName}
          </p>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Step {currentStepIndex + 1} of {totalSteps}</span>
            <span>{stepLabels[currentStep]}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#1a4d2e] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Review Info */}
        {currentStep === 1 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Review Your Information</h2>
            <p className="text-sm text-gray-500 mb-4">Please verify the information below is correct and fill in any missing fields.</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name *" value={firstName} onChange={setFirstName} />
                <Input label="Last Name *" value={lastName} onChange={setLastName} />
              </div>
              <Input label="Date of Birth" type="date" value={dob} onChange={setDob} />
              <Input label="Phone" type="tel" value={phone} onChange={setPhone} />
              <Input label="Email" type="email" value={email} onChange={setEmail} />
              <Input label="Address" value={address} onChange={setAddress} />
              <div className="grid grid-cols-3 gap-3">
                <Input label="City" value={city} onChange={setCity} />
                <Input label="State" value={state} onChange={setState} />
                <Input label="ZIP" value={zip} onChange={setZip} />
              </div>
              <Input label="Last 4 of SSN" value={ssn4} onChange={setSsn4} maxLength={4} />
              <Input label="Driver&apos;s License #" value={dlNumber} onChange={setDlNumber} />
              <Input label="Employer" value={employerName} onChange={setEmployerName} />
              <Input label="Employer Phone" type="tel" value={employerPhone} onChange={setEmployerPhone} />
            </div>
            <button
              onClick={handleStep1}
              disabled={saving}
              className="w-full mt-6 bg-[#1a4d2e] text-white py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Next'}
            </button>
          </section>
        )}

        {/* Step 2: ID Upload */}
        {currentStep === 2 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload ID</h2>
            <p className="text-sm text-gray-500 mb-4">Take a photo or upload your driver&apos;s license and a selfie.</p>
            <div className="space-y-4">
              <FileUpload
                label="Driver's License — Front"
                uploaded={dlFrontUploaded}
                onFile={(f) => handleFileUpload(f, 'drivers_license_front')}
              />
              <FileUpload
                label="Driver's License — Back"
                uploaded={dlBackUploaded}
                onFile={(f) => handleFileUpload(f, 'drivers_license_back')}
              />
              <FileUpload
                label="Selfie"
                uploaded={selfieUploaded}
                onFile={(f) => handleFileUpload(f, 'selfie')}
              />
            </div>
            <NavButtons onBack={goBack} onNext={goNext} loading={saving} />
          </section>
        )}

        {/* Step 3: Sign */}
        {currentStep === 3 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sign Agreement</h2>
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-4 text-xs text-gray-600 leading-relaxed">
              By signing below, I acknowledge that the information provided is true and correct. I understand
              that I am the defendant on the bail bond and agree to comply with all conditions of my release,
              including appearing at all required court dates.
            </div>

            <div className="space-y-4">
              <Input label="Type Your Full Legal Name *" value={signerName} onChange={setSignerName} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Draw Your Signature
                </label>
                <canvas
                  ref={canvasRef}
                  className="w-full h-32 border border-gray-300 rounded-lg bg-white touch-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const ctx = canvasRef.current?.getContext('2d');
                    if (ctx && canvasRef.current) {
                      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    }
                  }}
                  className="text-xs text-gray-500 underline mt-1"
                >
                  Clear signature
                </button>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={goBack}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium"
              >
                Back
              </button>
              <button
                onClick={handleSign}
                disabled={saving}
                className="flex-1 bg-[#d4af37] text-gray-900 py-3 rounded-lg font-bold disabled:opacity-50"
              >
                {saving ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// Reusable components

function Input({
  label,
  value,
  onChange,
  type = 'text',
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#1a4d2e] focus:border-transparent outline-none"
      />
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  loading,
}: {
  onBack: () => void;
  onNext: () => void;
  loading: boolean;
}) {
  return (
    <div className="mt-6 flex gap-3">
      <button
        onClick={onBack}
        className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium"
      >
        Back
      </button>
      <button
        onClick={onNext}
        disabled={loading}
        className="flex-1 bg-[#1a4d2e] text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Next'}
      </button>
    </div>
  );
}

function FileUpload({
  label,
  uploaded,
  onFile,
}: {
  label: string;
  uploaded: boolean;
  onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      {uploaded ? (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Uploaded
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 flex flex-col items-center gap-1 text-gray-500 active:bg-gray-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium">Tap to take photo or choose file</span>
          </button>
        </>
      )}
    </div>
  );
}
