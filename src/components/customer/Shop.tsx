// OWNER: P4
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "./api";
import { ITEMS, cartCount, loadCart, saveCart, setQty, subtotalCents, type Cart } from "./cart";
import { formatCents } from "./format";
import { useAsync } from "./hooks";
import { Button, Card, ErrorNotice, Page, Spinner } from "./ui";

export function Shop({ merchantId }: { merchantId: string }) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>({});
  const [hydrated, setHydrated] = useState(false);
  const merchant = useAsync(() => api.getMerchant(merchantId), [merchantId]);

  useEffect(() => {
    setCart(loadCart(merchantId));
    setHydrated(true);
  }, [merchantId]);

  function update(id: string, qty: number) {
    setCart((prev) => {
      const next = setQty(prev, id, qty);
      saveCart(merchantId, next);
      return next;
    });
  }

  if (merchant.loading && !merchant.data) return <Page><Spinner /></Page>;
  if (!merchant.data) {
    return (
      <Page>
        <ErrorNotice message={merchant.error ?? "Shop not found."} onRetry={merchant.reload} />
      </Page>
    );
  }

  const subtotal = subtotalCents(cart);
  const count = cartCount(cart);

  return (
    <Page title={merchant.data.name}>
      <p className="-mt-4 mb-6 text-sm text-slate-600">
        Every purchase here supports a local cause.{" "}
        <Link href="/causes" className="font-medium text-indigo-600 underline">
          See causes
        </Link>
      </p>
      <ul className="space-y-3">
        {ITEMS.map((item) => {
          const qty = cart[item.id] ?? 0;
          return (
            <li key={item.id}>
              <Card className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.description}</p>
                  <p className="mt-1 text-sm font-medium">{formatCents(item.priceCents)}</p>
                </div>
                {qty === 0 ? (
                  <Button variant="secondary" onClick={() => update(item.id, 1)} aria-label={`Add ${item.name}`}>
                    Add
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => update(item.id, qty - 1)} aria-label={`Remove one ${item.name}`}>
                      −
                    </Button>
                    <span className="w-6 text-center tabular-nums" aria-live="polite">{qty}</span>
                    <Button variant="secondary" onClick={() => update(item.id, qty + 1)} aria-label={`Add one ${item.name}`}>
                      +
                    </Button>
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {hydrated ? count : 0} {count === 1 ? "item" : "items"} · Subtotal{" "}
            <span className="font-bold text-slate-900">{formatCents(hydrated ? subtotal : 0)}</span>
          </p>
          <Button disabled={!hydrated || count === 0} onClick={() => router.push(`/shop/${merchantId}/checkout`)}>
            Checkout
          </Button>
        </div>
      </div>
    </Page>
  );
}
