// OWNER: P1
import type Stripe from "stripe";
import {handleAccountUpdated} from "./account";
import {handlePaymentSucceeded,handleChargeRefunded} from "./payment";
export const webhookHandlers: Partial<Record<Stripe.Event.Type,(event: Stripe.Event)=>Promise<void>>> = {"account.updated":handleAccountUpdated,"payment_intent.succeeded":handlePaymentSucceeded,"charge.refunded":handleChargeRefunded};
