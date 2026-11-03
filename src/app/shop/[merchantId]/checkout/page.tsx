// OWNER: P4
import CheckoutClient from "@/components/customer/CheckoutClient";

// Server page: STRIPE_PUBLISHABLE_KEY is not exposed to the browser, so pass it down as a prop.
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = await params;
  return <CheckoutClient merchantId={merchantId} publishableKey={process.env.STRIPE_PUBLISHABLE_KEY} />;
}
