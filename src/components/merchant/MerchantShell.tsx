// OWNER: P3
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useId, useState, type ReactNode } from "react";
import { createMerchant, getMerchant, listMerchants, USE_MOCKS, type Merchant } from "./api";
import { Async, Loading } from "./States";
import { useAsync } from "./useAsync";
import { useMerchantId } from "./useMerchantId";

type Ctx = { merchant: Merchant; refreshMerchant: () => void };
const MerchantContext = createContext<Ctx | null>(null);

export function useMerchant(): Ctx {
  const ctx = useContext(MerchantContext);
  if (!ctx) throw new Error("useMerchant must be used inside MerchantShell");
  return ctx;
}

const NAV = [
  { href: "/merchant", label: "Overview" },
  { href: "/merchant/cause", label: "Cause" },
  { href: "/merchant/rules", label: "Rules" },
  { href: "/merchant/impact", label: "Impact" },
];

export function MerchantShell({ children }: { children: ReactNode }) {
  const { merchantId, setMerchantId, ready } = useMerchantId();
  if (!ready) return <Loading />;
  if (!merchantId) return <IdentityPicker onPick={setMerchantId} />;
  return (
    <Authed key={merchantId} merchantId={merchantId} onSwitch={() => setMerchantId(null)}>
      {children}
    </Authed>
  );
}

function Authed({
  merchantId,
  onSwitch,
  children,
}: {
  merchantId: string;
  onSwitch: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { state, reload } = useAsync(() => getMerchant(merchantId), [merchantId]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Merchant" className="flex flex-wrap gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={`${n.href}?merchantId=${encodeURIComponent(merchantId)}`}
              aria-current={pathname === n.href ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm ${pathname === n.href ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={onSwitch} className="text-sm text-gray-600 underline">
          Switch merchant
        </button>
      </header>
      <Async state={state} onRetry={reload}>
        {(merchant) => (
          <MerchantContext.Provider value={{ merchant, refreshMerchant: reload }}>
            <h1 className="mb-4 text-xl font-semibold text-gray-900">{merchant.name}</h1>
            {children}
          </MerchantContext.Provider>
        )}
      </Async>
    </div>
  );
}

function IdentityPicker({ onPick }: { onPick: (id: string) => void }) {
  const uid = useId();
  const { state } = useAsync(listMerchants, []);
  const [typedId, setTypedId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onPick((await createMerchant({ name, email })).id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create merchant");
      setBusy(false);
    }
  }

  const input = "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm";
  return (
    <div className="mx-auto max-w-md space-y-8 px-4 py-10">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Choose a merchant</h1>
        <p className="text-sm text-gray-600">Demo identity: there is no sign-in.</p>
      </div>

      <Async state={state}>
        {(list) =>
          list.length > 0 && (
            <ul className="space-y-2">
              {list.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onPick(m.id)}
                    className="w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50"
                  >
                    <span className="block font-medium text-gray-900">{m.name}</span>
                    <span className="block text-xs text-gray-500">{m.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )
        }
      </Async>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (typedId.trim()) onPick(typedId.trim());
        }}
      >
        <label htmlFor={`${uid}-id`} className="block text-sm font-medium text-gray-900">
          Existing merchant ID
        </label>
        <div className="flex gap-2">
          <input id={`${uid}-id`} value={typedId} onChange={(e) => setTypedId(e.target.value)} className={input} />
          <button type="submit" className="mt-1 rounded-md bg-gray-900 px-4 text-sm font-medium text-white">
            Open
          </button>
        </div>
      </form>

      {!USE_MOCKS && (
        <form onSubmit={create} className="space-y-3">
          <h2 className="text-sm font-medium text-gray-900">Or create one</h2>
          <div>
            <label htmlFor={`${uid}-name`} className="block text-sm text-gray-700">
              Business name
            </label>
            <input id={`${uid}-name`} required value={name} onChange={(e) => setName(e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor={`${uid}-email`} className="block text-sm text-gray-700">
              Email
            </label>
            <input id={`${uid}-email`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create merchant"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
