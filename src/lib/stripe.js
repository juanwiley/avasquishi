// apps/avasquishi/src/lib/stripe.js
import Stripe from 'stripe';

let stripeSingleton;

/**
 * Lazily get a Stripe instance. Throws only when a route is actually invoked,
 * not at import/build time.
 */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Throw here only when an API route is actually called
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, { apiVersion: '2024-06-20' });
  }
  return stripeSingleton;
}
