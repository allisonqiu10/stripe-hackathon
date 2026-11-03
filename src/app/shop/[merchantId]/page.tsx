// OWNER: P4
import { Shop } from "@/components/customer/Shop";

export default async function ShopPage({ params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = await params;
  return <Shop merchantId={merchantId} />;
}
