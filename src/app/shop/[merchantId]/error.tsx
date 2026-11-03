// OWNER: P4
"use client";
import { ErrorNotice, Page } from "@/components/customer/ui";

export default function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Page>
      <ErrorNotice message="Something went wrong loading this page." onRetry={reset} />
    </Page>
  );
}
