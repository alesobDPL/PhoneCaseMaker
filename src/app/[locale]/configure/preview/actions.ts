"use server"

import { calculatePriceCents } from "@/lib/pricing"
import { db } from "@/db"
import { stripe } from "@/lib/stripe"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { Order } from "@prisma/client"

export const createCheckoutSession = async ({
    configId,
}:{
    configId: string

}) =>{

    const configuration = await db.configuration.findUnique({
        where : {id:configId},
    })

    if(!configuration){
        throw new Error("No such configuration found")
    }


    const {getUser} = getKindeServerSession()
    const user = await getUser()

    if(!user){
        throw new Error("You need to be logged in")
    }

    const price = calculatePriceCents(configuration)

    let order: Order | undefined = undefined

    const existingOrder = await db.order.findFirst({
        where: {
            userId: user.id,
            configurationId: configuration.id,
            isPaid: false,
        }
    })

    if(existingOrder){
        order = existingOrder
    } else{
        order = await db.order.create({
            data: {
                amountCents: price,
                userId: user.id, 
                configurationId: configuration.id
            }
        })
    }

    const stripeSession = await stripe.checkout.sessions.create({
        success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
        cancel_url:  `${process.env.NEXT_PUBLIC_SERVER_URL}/configure/preview?id=${configuration.id}`,
        mode: "payment",
        payment_method_types: ["card"],
        shipping_address_collection: { allowed_countries: ['CL', 'US', 'DE'] },
        metadata: {
            userId: user.id,
            orderId: order.id,   
        },
        line_items: [{
            quantity: 1,
            price_data: {
                currency: "USD",
                unit_amount: price,
                product_data: {
                    name: "Custom iPhone Case",
                    images: [configuration.imageUrl],
                },
            },
        }]
    })

    return { url: stripeSession.url }
     

}
