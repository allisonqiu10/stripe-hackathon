// OWNER: P4
"use client";
import Link from "next/link";
import { api } from "@/components/customer/api";
import { formatCents } from "@/components/customer/format";
import { useAsync } from "@/components/customer/hooks";
import { Card, EmptyState, ErrorNotice, LinkButton, Page, Spinner } from "@/components/customer/ui";

export default function CausesPage() {
  const { data, error, loading, reload } = useAsync(() => api.listCauses({ status: "ACTIVE" }), []);

  return (
    <Page title="Local causes">
      {loading && !data && <Spinner />}
      {!data && error && <ErrorNotice message={error} onRetry={reload} />}
      {data && data.length === 0 && (
        <EmptyState title="No active causes yet">
          <LinkButton href="/causes/new">Register a cause</LinkButton>
        </EmptyState>
      )}
      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((c) => (
            <li key={c.id}>
              <Link href={`/causes/${c.slug}`} className="block">
                <Card className="transition hover:border-indigo-300">
                  <p className="font-semibold text-slate-900">{c.title}</p>
                  <p className="text-sm text-slate-500">{c.city}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-700">{c.description}</p>
                  <p className="mt-2 text-xs text-slate-500">Goal {formatCents(c.goalCents)}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm">
        <Link href="/causes/new" className="text-indigo-600 underline">
          Register your cause
        </Link>
      </p>
    </Page>
  );
}
