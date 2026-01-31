import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export async function createCustomer(email?: string, name?: string) {
  const stripe = getStripe();
  return stripe.customers.create({
    ...(email && { email }),
    ...(name && { name }),
    metadata: { source: 'bail_made_simple' },
  });
}

export async function createSetupIntent(customerId: string) {
  const stripe = getStripe();
  return stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });
}

export async function retrievePaymentMethod(pmId: string) {
  const stripe = getStripe();
  return stripe.paymentMethods.retrieve(pmId);
}

export async function createPaymentIntent(
  customerId: string,
  pmId: string,
  amountCents: number,
  metadata?: Record<string, string>,
) {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    customer: customerId,
    payment_method: pmId,
    off_session: true,
    confirm: true,
    metadata: metadata ?? {},
  });
}

export async function createPaymentIntentForLink(
  customerId: string,
  amountCents: number,
  metadata?: Record<string, string>,
) {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    customer: customerId,
    payment_method_types: ['card'],
    setup_future_usage: 'off_session',
    metadata: metadata ?? {},
  });
}
