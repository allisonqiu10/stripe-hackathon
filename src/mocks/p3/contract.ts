// Compatibility aliases for merchant demo fixtures; schemas live in the shared contract.
export {
  CauseStatusSchema as CauseStatus,
  MerchantSchema,
  CauseSchema,
  CauseProgressResponseSchema as ProgressSchema,
  MerchantImpactResponseSchema as ImpactSchema,
  ConnectStatusResponseSchema as ConnectStatusSchema,
  OnboardResponseSchema,
  UpdateMerchantRequestSchema as MerchantPatchSchema,
} from "../../lib/contract";
export type {
  Merchant,
  Cause,
  CauseProgressResponse as Progress,
  MerchantImpactResponse as Impact,
  ConnectStatusResponse as ConnectStatus,
  UpdateMerchantRequest as MerchantPatch,
} from "../../lib/contract";

import { RuleTypeSchema } from "../../lib/contract";
export const RuleType = RuleTypeSchema;
export type RuleType = import("../../lib/contract").RuleType;
