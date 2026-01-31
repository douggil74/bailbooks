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
