// OWNER: P3
// TEMPORARY local mirror of src/lib/contract (P1). Delete once P1 merges and
// repoint the re-export in src/components/merchant/api.ts.
import { z } from "zod";

export const RuleType = z.enum(["ROUND_UP", "PERCENTAGE"]);
export type RuleType = z.infer<typeof RuleType>;

export const CauseStatus = z.enum(["DRAFT", "ACTIVE", "CLOSED"]);

export const MerchantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  stripeAccountId: z.string().nullable().optional(),
  onboardingComplete: z.boolean(),
  ruleType: RuleType,
  percentageBps: z.number().int(),
  activeCauseId: z.string().nullable().optional(),
});
export type Merchant = z.infer<typeof MerchantSchema>;

export const CauseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  city: z.string(),
  goalCents: z.number().int(),
  ownerName: z.string(),
  stripeAccountId: z.string().nullable().optional(),
  onboardingComplete: z.boolean(),
  status: CauseStatus,
});
export type Cause = z.infer<typeof CauseSchema>;

export const ProgressSchema = z.object({
  raisedCents: z.number().int(),
  goalCents: z.number().int(),
  donorCount: z.number().int(),
  recent: z.array(z.object({ amountCents: z.number().int(), createdAt: z.string() })),
});
export type Progress = z.infer<typeof ProgressSchema>;

export const ImpactSchema = z.object({
  totalDonatedCents: z.number().int(),
  orderCount: z.number().int(),
  donationCount: z.number().int(),
  byCause: z.array(
    z.object({ causeId: z.string(), title: z.string(), amountCents: z.number().int() }),
  ),
});
export type Impact = z.infer<typeof ImpactSchema>;

export const ConnectStatusSchema = z.object({
  onboardingComplete: z.boolean(),
  requirementsDue: z.array(z.string()),
});
export type ConnectStatus = z.infer<typeof ConnectStatusSchema>;

export const OnboardResponseSchema = z.object({ url: z.string() });

export const MerchantPatchSchema = z.object({
  ruleType: RuleType.optional(),
  percentageBps: z.number().int().min(0).max(10000).optional(),
  activeCauseId: z.string().nullable().optional(),
});
export type MerchantPatch = z.infer<typeof MerchantPatchSchema>;
