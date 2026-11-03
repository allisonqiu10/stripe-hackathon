import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const origin = req.headers.get('origin') || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: 99900, // $999.00
          product_data: {
            name: 'iPhone Duo',
            description: 'Mock product for testing Stripe Checkout',
            // images: ['https://your-host.com/iphone-duo.png'], // optional
          },
        },
      },
    ],
    success_url: `${origin}/?success=true`,
    cancel_url: `${origin}/?canceled=true`,
  });

  return NextResponse.redirect(session.url, 303);
}
