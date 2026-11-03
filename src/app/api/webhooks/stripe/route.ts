// OWNER: P2
import { stripe } from '../../../../lib/stripe/client';
import { webhookHandlers } from '../../../../lib/stripe/handlers';
export async function POST(_request: Request, _context: { params: Promise<Record<string, string>> }) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: 'Webhook unavailable' }, { status: 500 });
  let event;
  try { event = stripe.webhooks.constructEvent(await _request.text(), _request.headers.get('stripe-signature') ?? '', secret); }
  catch { return Response.json({ error: 'Invalid webhook signature' }, { status: 400 }); }
  if (event.livemode) return Response.json({ error: 'Test mode only' }, { status: 400 });
  try {
    await webhookHandlers[event.type]?.(event);
    return Response.json({ received: true });
  } catch { return Response.json({ error: 'Webhook processing failed' }, { status: 500 }); }
}
