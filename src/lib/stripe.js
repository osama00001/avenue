import Stripe from 'stripe';

let _stripe = null;

/**
 * Singleton Stripe client. Reads STRIPE_SECRET_KEY from env on first call.
 * Throws if the key is missing — fail loud rather than silently returning a
 * useless client.
 */
export function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set in environment');
  _stripe = new Stripe(key, {
    apiVersion: '2024-06-20', // pin so future Stripe defaults can't surprise us
    typescript: false,
    appInfo: { name: 'avenue-bookstore', version: '1.0.0' },
  });
  return _stripe;
}
