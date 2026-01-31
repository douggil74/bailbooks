'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type {
  WizardStep,
  ReferenceInput,
} from '@/lib/bail-types';
import CardCollectForm from '@/app/components/CardCollectForm';

interface CoSignerInput {
  first_name: string;
  last_name: string;
  phone: string;
  send_invite: boolean;
}

// ─── Wizard Container ────────────────────────────────────────────────
export default function OnboardPage() {
  const [step, setStep] = useState<WizardStep>(1);
  const [appId, setAppId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('LA');
  const [zip, setZip] = useState('');
  const [ssn4, setSsn4] = useState('');
  const [dlNumber, setDlNumber] = useState('');

  // Step 2 fields (Co-Signers)
  const [cosigners, setCosigners] = useState<CoSignerInput[]>([
    { first_name: '', last_name: '', phone: '', send_invite: false },
  ]);

  // Step 3 fields (Bond Details)
  const [bondAmount, setBondAmount] = useState('');
  const [charges, setCharges] = useState('');
  const [courtName, setCourtName] = useState('');
  const [courtDate, setCourtDate] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [jailLocation, setJailLocation] = useState('');

  // Step 4 fields (Employment)
  const [employerName, setEmployerName] = useState('');
  const [employerPhone, setEmployerPhone] = useState('');

  // Step 5 fields (References)
  const [references, setReferences] = useState<ReferenceInput[]>([
    { full_name: '', relationship: '', phone: '' },
    { full_name: '', relationship: '', phone: '' },
    { full_name: '', relationship: '', phone: '' },
  ]);

  // Step 6 fields (ID Upload)
  const [dlFrontUploaded, setDlFrontUploaded] = useState(false);
  const [dlBackUploaded, setDlBackUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);

  // Step 7 fields (Payment)
  const [paymentSaved, setPaymentSaved] = useState(false);

  // Step 8 fields (Sign & Consent)
  const [signerName, setSignerName] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [gpsConsent, setGpsConsent] = useState(false);
  const [checkinFreq, setCheckinFreq] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [signed, setSigned] = useState(false);

  // Submission complete
  const [submitted, setSubmitted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  async function apiCall(url: string, opts: RequestInit) {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(url, {
        ...opts,
        headers: { 'Content-Type': 'application/json', ...opts.headers },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      return null;
    } finally {
      setSaving(false);
    }
  }

  // ─── Step handlers ─────────────────────────────────────────────────

  async function handleStep1() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required');
      return;
    }

    if (!appId) {
      // Create application
      const data = await apiCall('/api/onboard/start', {
        method: 'POST',
        body: JSON.stringify({ defendant_first: firstName, defendant_last: lastName }),
      });
      if (!data) return;
      setAppId(data.id);

      // Save remaining step 1 data
      await apiCall('/api/onboard/save', {
        method: 'PUT',
        body: JSON.stringify({
          application_id: data.id,
          step: 1,
          data: {
            defendant_dob: dob || null,
            defendant_phone: phone,
            defendant_email: email,
            defendant_address: address,
            defendant_city: city,
            defendant_state: state,
            defendant_zip: zip,
            defendant_ssn_last4: ssn4,
            defendant_dl_number: dlNumber,
          },
        }),
      });
    } else {
      await apiCall('/api/onboard/save', {
        method: 'PUT',
        body: JSON.stringify({
          application_id: appId,
          step: 1,
          data: {
            defendant_first: firstName,
            defendant_last: lastName,
            defendant_dob: dob || null,
            defendant_phone: phone,
            defendant_email: email,
            defendant_address: address,
            defendant_city: city,
            defendant_state: state,
            defendant_zip: zip,
            defendant_ssn_last4: ssn4,
            defendant_dl_number: dlNumber,
          },
        }),
      });
    }
    if (!error) setStep(2);
  }

  async function handleStep2() {
    if (!appId) return;
    const validCosigners = cosigners.filter(c => c.first_name.trim() && c.last_name.trim());
    if (validCosigners.length > 0) {
      await apiCall('/api/onboard/indemnitors', {
        method: 'POST',
        body: JSON.stringify({
          application_id: appId,
          cosigners: validCosigners,
        }),
      });
    }
    if (!error) setStep(3);
  }

  async function handleStep3() {
    if (!appId) return;
    await apiCall('/api/onboard/save', {
      method: 'PUT',
      body: JSON.stringify({
        application_id: appId,
        step: 2,
        data: {
          bond_amount: bondAmount ? parseFloat(bondAmount) : null,
          charge_description: charges,
          court_name: courtName,
          court_date: courtDate || null,
          case_number: caseNumber,
          jail_location: jailLocation,
        },
      }),
    });
    if (!error) setStep(4);
  }

  async function handleStep4() {
    if (!appId) return;
    await apiCall('/api/onboard/save', {
      method: 'PUT',
      body: JSON.stringify({
        application_id: appId,
        step: 3,
        data: {
          employer_name: employerName,
          employer_phone: employerPhone,
        },
      }),
    });
    if (!error) setStep(5);
  }

  async function handleStep5() {
    if (!appId) return;
    const validRefs = references.filter((r) => r.full_name.trim() && r.phone.trim());
    if (validRefs.length === 0) {
      setError('At least one reference with name and phone is required');
      return;
    }
    await apiCall('/api/onboard/references', {
      method: 'POST',
      body: JSON.stringify({ application_id: appId, references: validRefs }),
    });
    if (!error) setStep(6);
  }

  async function handleFileUpload(file: File, docType: string) {
    if (!appId) return;
    setError(null);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('application_id', appId);
      fd.append('doc_type', docType);
      const res = await fetch('/api/onboard/upload', { method: 'POST', body: fd });
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
    if (step === 8) {
      const cleanup = setupCanvas();
      return cleanup;
    }
  }, [step, setupCanvas]);

  async function handleStep8() {
    if (!appId) return;
    if (!signerName.trim()) {
      setError('Please type your full name');
      return;
    }

    // Get signature image from canvas
    const canvas = canvasRef.current;
    const signatureData = canvas ? canvas.toDataURL('image/png') : '';

    // Save signature
    const sigResult = await apiCall('/api/onboard/sign', {
      method: 'POST',
      body: JSON.stringify({
        application_id: appId,
        signer_name: signerName,
        signature_data: signatureData,
      }),
    });
    if (!sigResult) return;

    setSigned(true);

    // Submit application
    const submitResult = await apiCall('/api/onboard/submit', {
      method: 'POST',
      body: JSON.stringify({
        application_id: appId,
        sms_consent: smsConsent,
        gps_consent: gpsConsent,
        checkin_frequency: checkinFreq,
      }),
    });
    if (submitResult) setSubmitted(true);
  }

  // ─── Co-signer helpers ──────────────────────────────────────────────
  function updateCosigner(index: number, field: keyof CoSignerInput, value: string | boolean) {
    const updated = [...cosigners];
    updated[index] = { ...updated[index], [field]: value };
    setCosigners(updated);
  }

  function addCosignerSlot() {
    if (cosigners.length < 3) {
      setCosigners([...cosigners, { first_name: '', last_name: '', phone: '', send_invite: false }]);
    }
  }

  function removeCosigner(index: number) {
    setCosigners(cosigners.filter((_, i) => i !== index));
  }

  // ─── Progress bar ──────────────────────────────────────────────────
  const progress = submitted ? 100 : ((step - 1) / 8) * 100;

  const stepLabels = ['Personal', 'Co-Signers', 'Bond', 'Employment', 'References', 'ID Upload', 'Payment', 'Sign'];

  // ─── Submitted state ──────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted</h2>
        <p className="text-gray-600">
          We&apos;ve received your application. A bail agent will contact you shortly.
        </p>
        <p className="text-sm text-gray-400 mt-4">Reference: {appId}</p>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Step {step} of 8</span>
          <span>{stepLabels[step - 1]}</span>
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

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Personal Information</h2>
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
          </div>
          <NextButton onClick={handleStep1} loading={saving} />
        </section>
      )}

      {/* Step 2: Co-Signers */}
      {step === 2 && (
        <section>
          <h2 className="text-xl font-bold mb-2">Co-Signers</h2>
          <p className="text-sm text-gray-500 mb-4">
            Add up to 3 co-signers (indemnitors). They&apos;ll receive a link to provide their information.
            You can skip this step if not needed.
          </p>
          {cosigners.map((cs, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500">Co-Signer {i + 1}</p>
                {cosigners.length > 1 && (
                  <button onClick={() => removeCosigner(i)} className="text-xs text-red-500 hover:text-red-400">Remove</button>
                )}
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input label="First Name" value={cs.first_name} onChange={(v) => updateCosigner(i, 'first_name', v)} />
                  <Input label="Last Name" value={cs.last_name} onChange={(v) => updateCosigner(i, 'last_name', v)} />
                </div>
                <Input label="Phone" type="tel" value={cs.phone} onChange={(v) => updateCosigner(i, 'phone', v)} />
                <label className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    checked={cs.send_invite}
                    onChange={(e) => updateCosigner(i, 'send_invite', e.target.checked)}
                  />
                  <span className="text-sm text-gray-600">Send them a link to complete their info</span>
                </label>
              </div>
            </div>
          ))}
          {cosigners.length < 3 && (
            <button
              onClick={addCosignerSlot}
              className="text-sm text-[#1a4d2e] font-medium hover:underline mb-2"
            >
              + Add another co-signer
            </button>
          )}
          <NavButtons onBack={() => setStep(1)} onNext={handleStep2} loading={saving} skipLabel="Skip" onSkip={() => setStep(3)} />
        </section>
      )}

      {/* Step 3: Bond Details */}
      {step === 3 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Bond Details</h2>
          <div className="space-y-3">
            <Input label="Bond Amount ($)" type="number" value={bondAmount} onChange={setBondAmount} />
            <Input label="Charges" value={charges} onChange={setCharges} />
            <Input label="Court Name" value={courtName} onChange={setCourtName} />
            <Input label="Court Date" type="date" value={courtDate} onChange={setCourtDate} />
            <Input label="Case Number" value={caseNumber} onChange={setCaseNumber} />
            <Input label="Jail Location" value={jailLocation} onChange={setJailLocation} />
          </div>
          <NavButtons onBack={() => setStep(2)} onNext={handleStep3} loading={saving} />
        </section>
      )}

      {/* Step 4: Employment */}
      {step === 4 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Employment</h2>
          <div className="space-y-3">
            <Input label="Employer Name" value={employerName} onChange={setEmployerName} />
            <Input label="Employer Phone" type="tel" value={employerPhone} onChange={setEmployerPhone} />
          </div>
          <NavButtons onBack={() => setStep(3)} onNext={handleStep4} loading={saving} />
        </section>
      )}

      {/* Step 5: References */}
      {step === 5 && (
        <section>
          <h2 className="text-xl font-bold mb-4">References</h2>
          <p className="text-sm text-gray-500 mb-3">Provide at least 1 reference (up to 3)</p>
          {references.map((ref, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Reference {i + 1}</p>
              <div className="space-y-2">
                <Input
                  label="Full Name"
                  value={ref.full_name}
                  onChange={(v) => {
                    const updated = [...references];
                    updated[i] = { ...updated[i], full_name: v };
                    setReferences(updated);
                  }}
                />
                <Input
                  label="Relationship"
                  value={ref.relationship}
                  onChange={(v) => {
                    const updated = [...references];
                    updated[i] = { ...updated[i], relationship: v };
                    setReferences(updated);
                  }}
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={ref.phone}
                  onChange={(v) => {
                    const updated = [...references];
                    updated[i] = { ...updated[i], phone: v };
                    setReferences(updated);
                  }}
                />
              </div>
            </div>
          ))}
          <NavButtons onBack={() => setStep(4)} onNext={handleStep5} loading={saving} />
        </section>
      )}

      {/* Step 6: ID Upload */}
      {step === 6 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Upload ID</h2>
          <div className="space-y-4">
            <FileUpload
              label="Driver&apos;s License — Front"
              uploaded={dlFrontUploaded}
              onFile={(f) => handleFileUpload(f, 'drivers_license_front')}
            />
            <FileUpload
              label="Driver&apos;s License — Back"
              uploaded={dlBackUploaded}
              onFile={(f) => handleFileUpload(f, 'drivers_license_back')}
            />
            <FileUpload
              label="Selfie"
              uploaded={selfieUploaded}
              onFile={(f) => handleFileUpload(f, 'selfie')}
            />
          </div>
          <NavButtons onBack={() => setStep(5)} onNext={() => setStep(7)} loading={saving} />
        </section>
      )}

      {/* Step 7: Payment */}
      {step === 7 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Payment Information</h2>
          <p className="text-sm text-gray-500 mb-4">
            We&apos;ll securely store your card on file. No charges will be made today.
          </p>
          {paymentSaved ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              Card saved successfully.
            </div>
          ) : appId ? (
            <CardCollectForm
              applicationId={appId}
              variant="light"
              onSuccess={() => setPaymentSaved(true)}
            />
          ) : (
            <p className="text-sm text-gray-500">Please complete earlier steps first.</p>
          )}
          <NavButtons onBack={() => setStep(6)} onNext={() => setStep(8)} loading={saving} />
        </section>
      )}

      {/* Step 8: Sign & Consent */}
      {step === 8 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Sign & Consent</h2>
          <div className="space-y-4">
            <Input label="Type Your Full Legal Name" value={signerName} onChange={setSignerName} />

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

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  I consent to receive SMS messages regarding my bond and check-in requirements.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={gpsConsent}
                  onChange={(e) => setGpsConsent(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  I consent to GPS location check-ins as a condition of my bond.
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Frequency
                </label>
                <select
                  value={checkinFreq}
                  onChange={(e) => setCheckinFreq(e.target.value as typeof checkinFreq)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep(7)}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium"
            >
              Back
            </button>
            <button
              onClick={handleStep8}
              disabled={saving || signed}
              className="flex-1 bg-[#d4af37] text-gray-900 py-3 rounded-lg font-bold disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Reusable components ──────────────────────────────────────────────

function Input({
  label,
  value,
  onChange,
  type = 'text',
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a4d2e] focus:border-transparent outline-none"
      />
    </div>
  );
}

function NextButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full mt-6 bg-[#1a4d2e] text-white py-3 rounded-lg font-medium disabled:opacity-50"
    >
      {loading ? 'Saving...' : 'Next'}
    </button>
  );
}

function NavButtons({
  onBack,
  onNext,
  loading,
  skipLabel,
  onSkip,
}: {
  onBack: () => void;
  onNext: () => void;
  loading: boolean;
  skipLabel?: string;
  onSkip?: () => void;
}) {
  return (
    <div className="mt-6 flex gap-3">
      <button
        onClick={onBack}
        className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium"
      >
        Back
      </button>
      {onSkip && (
        <button
          onClick={onSkip}
          className="px-4 py-3 text-gray-500 text-sm font-medium hover:text-gray-700"
        >
          {skipLabel || 'Skip'}
        </button>
      )}
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
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
          className="text-sm"
        />
      )}
    </div>
  );
}
