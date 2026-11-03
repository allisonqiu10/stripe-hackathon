// OWNER: P1
import type Stripe from 'stripe';
import type { ConnectStatusResponse } from '../contract';
export async function createConnectedAccount(_input: {kind:'merchant'|'cause';id:string;name:string;email?:string}): Promise<Stripe.Account> { throw new Error('NotImplemented'); }
export async function createOnboardingLink(_accountId:string, _returnPath:string): Promise<{url:string}> { throw new Error('NotImplemented'); }
export async function getAccountStatus(_accountId:string): Promise<ConnectStatusResponse> { throw new Error('NotImplemented'); }
