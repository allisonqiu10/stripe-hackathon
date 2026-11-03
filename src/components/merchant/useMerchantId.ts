// OWNER: P3
"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const KEY = "merchantId";

function readStored(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function writeStored(id: string | null) {
  try {
    if (id) window.localStorage.setItem(KEY, id);
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: the URL param still carries identity */
  }
}

/** ?merchantId= wins, then localStorage. `ready` is false until storage was checked. */
export function useMerchantId() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fromUrl = params.get("merchantId");
  const [stored, setStored] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStored(readStored());
    setReady(true);
  }, []);

  useEffect(() => {
    if (fromUrl) writeStored(fromUrl);
  }, [fromUrl]);

  const merchantId = fromUrl ?? stored;

  const setMerchantId = useCallback(
    (id: string | null) => {
      writeStored(id);
      setStored(id);
      const next = new URLSearchParams(params.toString());
      if (id) next.set("merchantId", id);
      else next.delete("merchantId");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [params, pathname, router],
  );

  return { merchantId, setMerchantId, ready };
}
