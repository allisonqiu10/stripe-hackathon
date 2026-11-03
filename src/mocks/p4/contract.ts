// OWNER: P4
// LOCAL COPY of the contract types, used until P1's src/lib/contract merges.
// TODO(P4): replace imports of this file with `@/lib/contract` after merge.
export type RuleType = "ROUND_UP" | "PERCENTAGE";
export type CauseStatus = "DRAFT" | "ACTIVE" | "CLOSED";

export type Merchant = {
  id: string;
  name: string;
  email: string;
  stripeAccountId?: string | null;
  onboardingComplete: boolean;
  ruleType: RuleType;
  percentageBps: number;
  activeCauseId?: string | null;
};

export type Cause = {
  id: string;
  slug: string;
  title: string;
  description: string;
  city: string;
  goalCents: number;
  ownerName: string;
  stripeAccountId?: string | null;
  onboardingComplete: boolean;
  status: CauseStatus;
};

export type Progress = {
  raisedCents: number;
  goalCents: number;
  donorCount: number;
  recent: { amountCents: number; createdAt: string }[];
};

export type Quote = {
  merchantId: string;
  causeId: string;
  itemAmountCents: number;
  donationCents: number;
  totalCents: number;
  ruleType: RuleType;
  roundUp: boolean;
};

export type IntentResponse = { clientSecret: string; paymentIntentId: string; quote: Quote };
export type ConnectStatus = { onboardingComplete: boolean; requirementsDue: string[] };
export type CreateCauseInput = {
  title: string;
  description: string;
  city: string;
  goalCents: number;
  ownerName: string;
};
