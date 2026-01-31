'use client';

import { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripeClient } from '@/lib/stripe-client';

interface CardCollectFormProps {
  applicationId: string;
  variant: 'light' | 'dark';
  onSuccess: (pmId: string, last4: string, brand: string) => void;
}

function InnerCardForm({
  applicationId,
  variant,
  clientSecret,
  customerId,
  onSuccess,
}: CardCollectFormProps & { clientSecret: string; customerId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isDark = variant === 'dark';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError(null);
    setSaving(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not ready');
      setSaving(false);
      return;
    }

    const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (stripeError) {
      setError(stripeError.message || 'Card verification failed');
      setSaving(false);
      return;
    }

    if (!setupIntent?.payment_method) {
      setError('No payment method returned');
      setSaving(false);
      return;
    }

    const pmId = typeof setupIntent.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent.payment_method.id;

    // Save to our backend
    const res = await fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: applicationId,
        payment_method_id: pmId,
        customer_id: customerId,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save card');
      setSaving(false);
      return;
    }

    // Get card details from the setup intent
    const pm = setupIntent.payment_method;
    const last4 = typeof pm === 'object' && pm.card ? pm.card.last4 || '****' : '****';
    const brand = typeof pm === 'object' && pm.card ? pm.card.brand || 'card' : 'card';

    setDone(true);
    setSaving(false);
    onSuccess(pmId, last4, brand);
  }

  if (done) {
    return (
      <div className={`px-4 py-3 rounded-lg text-sm ${isDark ? 'bg-green-900/50 border border-green-700 text-green-300' : 'bg-green-50 border border-green-200 text-green-700'}`}>
        Card saved successfully.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className={`px-4 py-3 rounded-lg text-sm mb-3 ${isDark ? 'bg-red-900/50 border border-red-700 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {error}
        </div>
      )}
      <div className={`border rounded-lg p-4 mb-4 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: isDark ? '#e5e7eb' : '#1f2937',
                '::placeholder': { color: isDark ? '#6b7280' : '#9ca3af' },
              },
              invalid: { color: '#ef4444' },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={saving || !stripe}
        className={`w-full py-3 rounded-lg font-medium disabled:opacity-50 ${isDark ? 'bg-[#d4af37] text-gray-900 hover:bg-[#e5c55a]' : 'bg-[#1a4d2e] text-white'}`}
      >
        {saving ? 'Saving...' : 'Save Card'}
      </button>
    </form>
  );
}

export default function CardCollectForm({ applicationId, variant, onSuccess }: CardCollectFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isDark = variant === 'dark';

  useEffect(() => {
    async function fetchSetupIntent() {
      try {
        const res = await fetch('/api/payment/setup-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ application_id: applicationId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to initialize payment');
          setLoading(false);
          return;
        }
        setClientSecret(data.client_secret);
        setCustomerId(data.customer_id);
      } catch {
        setError('Failed to connect to payment service');
      }
      setLoading(false);
    }
    fetchSetupIntent();
  }, [applicationId]);

  if (loading) {
    return (
      <div className={`text-sm text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Loading payment form...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`px-4 py-3 rounded-lg text-sm ${isDark ? 'bg-red-900/50 border border-red-700 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
        {error}
      </div>
    );
  }

  if (!clientSecret || !customerId) return null;

  return (
    <Elements stripe={getStripeClient()} options={{ clientSecret }}>
      <InnerCardForm
        applicationId={applicationId}
        variant={variant}
        clientSecret={clientSecret}
        customerId={customerId}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}
