// OWNER: P1
import {describe,it,expect} from 'vitest';
import {CheckoutQuoteRequestSchema,QuoteSchema,UpdateMerchantRequestSchema,DonationSchema} from './index';
describe('shared contract',()=>{
  it('rejects fractional, negative, and overflowing cents',()=>{
    for (const itemAmountCents of [1.5,-1,2147483648]) expect(CheckoutQuoteRequestSchema.safeParse({merchantId:'m',itemAmountCents,roundUp:true}).success).toBe(false);
  });
  it('requires explicit opt-in and a cause on quotes',()=>{
    expect(CheckoutQuoteRequestSchema.safeParse({merchantId:'m',itemAmountCents:100}).success).toBe(false);
    expect(QuoteSchema.safeParse({merchantId:'m',itemAmountCents:100,donationCents:100,totalCents:200,ruleType:'ROUND_UP',roundUp:true,causeId:null}).success).toBe(false);
  });
  it('supports clearing the cause and bounds percentages',()=>{
    expect(UpdateMerchantRequestSchema.parse({activeCauseId:null})).toEqual({activeCauseId:null});
    expect(UpdateMerchantRequestSchema.safeParse({percentageBps:10001}).success).toBe(false);
  });
  it('accepts JSON donation dates and nullable transfer IDs',()=>{
    expect(DonationSchema.safeParse({id:'d',orderId:'o',causeId:'c',merchantId:'m',paymentIntentId:'pi_test',kind:'ROUND_UP',amountCents:25,platformFeeCents:0,status:'PENDING',merchantTransferId:null,causeTransferId:null,createdAt:'2026-11-03T00:00:00.000Z'}).success).toBe(true);
  });
});
