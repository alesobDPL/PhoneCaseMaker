import Stripe from 'stripe'

const stripe = new Stripe('sk_test_example')

export function signedStripeRequest(event: object, secret = 'whsec_test'): Request {
  const payload = JSON.stringify(event)
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret })

  return new Request('http://localhost/api/webhooks', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': signature },
    body: payload,
  })
}
