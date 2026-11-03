// OWNER: P3
"use client";
import { useMerchant } from "@/components/merchant/MerchantShell";
import { RuleForm } from "@/components/merchant/RuleForm";

export default function RulesPage() {
  const { merchant, refreshMerchant } = useMerchant();
  return <RuleForm merchant={merchant} onSaved={refreshMerchant} />;
}
