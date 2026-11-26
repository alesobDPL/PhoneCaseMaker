import { db } from '@/db'
import { handleCheckoutCompleted } from '@/lib/orders/handle-checkout-completed'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request): Promise<Response> {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return Response.json({ message: 'Invalid signature', ok: false }, { status: 400 })
  }

  try {
    const body = await req.text()
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) throw new Error('Missing webhook secret')

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret)
    } catch {
      return Response.json({ message: 'Invalid signature', ok: false }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const result = await handleCheckoutCompleted(session, db)
      if (result === 'ignored') {
        console.warn('Checkout webhook ignored: missing metadata or unknown order')
      } else if (result === 'mismatch') {
        const orderId = session.metadata?.orderId
        const order = orderId ? await db.order.findUnique({
          where: { id: orderId },
          select: { amountCents: true, currency: true },
        }) : null
        console.error('Checkout webhook payment mismatch', {
          orderId,
          expectedAmount: order?.amountCents,
          expectedCurrency: order?.currency,
          receivedAmount: session.amount_total,
          receivedCurrency: session.currency,
        })
      }
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error('Unable to process checkout webhook', error)
    return Response.json({ message: 'Something went wrong', ok: false }, { status: 500 })
  }
}
