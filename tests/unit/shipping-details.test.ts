import { describe, expect, it } from 'vitest'
import type Stripe from 'stripe'
import { getShippingDetails } from '@/lib/orders/handle-checkout-completed'

const legacyShipping: Stripe.Checkout.Session.ShippingDetails = {
  name: 'Legacy Customer',
  address: {
    line1: '100 Legacy Street', line2: null, city: 'Boston',
    state: 'MA', postal_code: '02108', country: 'US',
  },
}

const collectedShipping: Stripe.Checkout.Session.ShippingDetails = {
  name: 'Collected Customer',
  address: {
    line1: '200 Collected Street', line2: null, city: 'Santiago',
    state: 'RM', postal_code: '8320000', country: 'CL',
  },
}

function sessionWithShipping(fields: {
  shipping_details?: Stripe.Checkout.Session.ShippingDetails | null
  collected_information?: {
    shipping_details?: Stripe.Checkout.Session.ShippingDetails | null
  } | null
}): Stripe.Checkout.Session {
  return fields as Stripe.Checkout.Session
}

describe('getShippingDetails', () => {
  it('uses collected shipping details when the root field is absent', () => {
    const session = sessionWithShipping({
      collected_information: { shipping_details: collectedShipping },
    })
    expect(getShippingDetails(session)).toBe(collectedShipping)
  })

  it('accepts legacy shipping details', () => {
    expect(getShippingDetails(sessionWithShipping({ shipping_details: legacyShipping })))
      .toBe(legacyShipping)
  })

  it('prefers collected shipping details when both formats have addresses', () => {
    const session = sessionWithShipping({
      shipping_details: legacyShipping,
      collected_information: { shipping_details: collectedShipping },
    })
    expect(getShippingDetails(session)).toBe(collectedShipping)
  })

  it.each([
    {},
    { shipping_details: null, collected_information: null },
    { collected_information: {} },
    { collected_information: { shipping_details: null } },
  ])('returns null when shipping details are absent (%j)', (fields) => {
    expect(getShippingDetails(sessionWithShipping(fields))).toBeNull()
  })

  it('falls back to the legacy address when collected details have no address', () => {
    const session = sessionWithShipping({
      shipping_details: legacyShipping,
      collected_information: { shipping_details: { name: 'No Address', address: undefined } },
    })
    expect(getShippingDetails(session)).toBe(legacyShipping)
  })

  it.each(['legacy', 'collected', 'both'] as const)(
    'returns null when %s shipping details have no address', (format) => {
      const details = { name: 'No Address', address: undefined }
      const session = sessionWithShipping({
        shipping_details: format !== 'collected' ? details : null,
        collected_information: { shipping_details: format !== 'legacy' ? details : null },
      })
      expect(getShippingDetails(session)).toBeNull()
    },
  )
})
