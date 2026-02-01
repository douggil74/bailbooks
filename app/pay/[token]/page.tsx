'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripeClient } from '@/lib/stripe-client';

type PageState = 'loading' | 'ready' | 'processing' | 'success' | 'invalid';

interface LinkDetails {
  amount: number;
  defendant_name: string;
  client_secret: string;
  application_id: string;
}

function PaymentForm({
  details,
  token,
}: {
  details: LinkDetails;
  token: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [state, setState] = useState<'ready' | 'processing' | 'success'>('ready');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError(null);
    setState('processing');

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not ready');
      setState('ready');
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      details.client_secret,
      { payment_method: { card: cardElement } },
    );

    if (stripeError) {
      setError(stripeError.message || 'Payment failed');
      setState('ready');
      return;
    }

    if (!paymentIntent) {
      setError('No payment confirmation received');
      setState('ready');
      return;
    }

    // Save payment method and clear token
    const pmId =
      typeof paymentIntent.payment_method === 'string'
        ? paymentIntent.payment_method
        : paymentIntent.payment_method?.id || '';

    await fetch('/api/payment/complete-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        payment_intent_id: paymentIntent.id,
        payment_method_id: pmId,
      }),
    });

    setState('success');
  }

  if (state === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-900/50 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Payment Successful</h2>
        <p className="text-gray-400 text-sm">
          Your payment of <strong className="text-[#d4af37]">${details.amount.toFixed(2)}</strong> has been processed.
        </p>
        <p className="text-gray-500 text-xs mt-4">You may close this page.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Amount Due</p>
          <p className="text-3xl font-bold text-[#d4af37]">${details.amount.toFixed(2)}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300 mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-xs text-gray-400 mb-2">Card Details</label>
        <div className="border border-gray-700 bg-gray-800 rounded-lg p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#e5e7eb',
                  '::placeholder': { color: '#6b7280' },
                },
                invalid: { color: '#ef4444' },
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={state === 'processing' || !stripe}
        className="w-full bg-[#d4af37] text-[#0a0a0a] font-bold py-3.5 rounded-lg hover:bg-[#e5c55a] transition-colors disabled:opacity-50 text-base"
      >
        {state === 'processing' ? 'Processing...' : `Pay $${details.amount.toFixed(2)}`}
      </button>

      <p className="text-center text-xs text-gray-600 mt-4">
        Secure payment powered by Stripe
      </p>
    </form>
  );
}

export default function PaymentPage() {
  const params = useParams();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [details, setDetails] = useState<LinkDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/payment/link-details?token=${token}`);
      const json = await res.json();

      if (!json.valid) {
        setErrorMsg(json.error || 'This payment link is no longer valid.');
        setPageState('invalid');
        return;
      }

      setDetails(json);
      setPageState('ready');
    } catch {
      setErrorMsg('Unable to load payment details.');
      setPageState('invalid');
    }
  }, [token]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-[#1a4d2e] px-6 py-4 text-center">
        <span className="text-lg font-extrabold text-white">BailBonds </span>
        <span className="text-lg font-extrabold text-[#d4af37]">Made Easy</span>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {pageState === 'loading' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
              <p className="text-gray-400 text-sm">Loading payment details...</p>
            </div>
          )}

          {pageState === 'invalid' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-900/50 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Link Unavailable</h2>
              <p className="text-gray-400 text-sm">{errorMsg}</p>
              <p className="text-gray-500 text-xs mt-4">
                Contact your bondsman if you need a new payment link.
              </p>
            </div>
          )}

          {pageState === 'ready' && details && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h1 className="text-lg font-bold text-white mb-1 text-center">Secure Payment</h1>
              <p className="text-sm text-gray-400 mb-6 text-center">
                {details.defendant_name}
              </p>

              <Elements
                stripe={getStripeClient()}
                options={{ clientSecret: details.client_secret }}
              >
                <PaymentForm details={details} token={token} />
              </Elements>
            </div>
          )}
        </div>
      </main>

      <footer className="px-6 py-4 text-center border-t border-gray-800">
        <p className="text-xs text-gray-600">
          BailBonds Made Easy &middot; Serving St. Tammany Parish, Louisiana
        </p>
      </footer>
    </div>
  );
}
