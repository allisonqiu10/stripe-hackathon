// OWNER: P4
import SuccessClient from "@/components/customer/SuccessClient";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = await params;
  return <SuccessClient merchantId={merchantId} publishableKey={process.env.STRIPE_PUBLISHABLE_KEY} />;
}
