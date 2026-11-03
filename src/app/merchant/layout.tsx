// OWNER: P3
import { Suspense, type ReactNode } from "react";
import { MerchantShell } from "@/components/merchant/MerchantShell";

export default function MerchantLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<p className="p-6 text-sm text-gray-500">Loading…</p>}>
        <MerchantShell>{children}</MerchantShell>
      </Suspense>
    </main>
  );
}
