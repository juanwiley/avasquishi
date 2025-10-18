// apps/avasquishi/src/app/api/stripe-test/route.js
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stripe = getStripe();
  const balance = await stripe.balance.retrieve();
  return NextResponse.json({ ok: true, balance });
}
