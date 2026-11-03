// OWNER: P4
"use client";
import Link from "next/link";
import { api } from "@/components/customer/api";
import { CauseCard } from "@/components/customer/CauseCard";
import { useAsync } from "@/components/customer/hooks";
import { EmptyState, ErrorNotice, LinkButton, Page, Spinner } from "@/components/customer/ui";

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
              <CauseCard cause={c} />
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
