// OWNER: P4
"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api, errorMessage, isSafeRedirect } from "@/components/customer/api";
import { useAsync } from "@/components/customer/hooks";
import { Button, Card, ErrorNotice, LinkButton, Page, Spinner } from "@/components/customer/ui";

export default function OnboardingCompletePage() {
  const { slug } = useParams<{ slug: string }>();
  const [resumeError, setResumeError] = useState<string | null>(null);
  const state = useAsync(async () => {
    const cause = await api.getCause(slug);
    const status = await api.causeStatus(cause.id);
    return { cause, status };
  }, [slug]);

  async function resume(causeId: string) {
    setResumeError(null);
    try {
      const { url } = await api.onboardCause(causeId);
      if (!isSafeRedirect(url)) throw new Error("Received an unexpected onboarding link.");
      window.location.assign(url);
    } catch (e) {
      setResumeError(errorMessage(e));
    }
  }

  if (state.loading && !state.data) return <Page title="Checking your setup"><Spinner label="Checking status with Stripe…" /></Page>;
  if (!state.data) return <Page title="Onboarding"><ErrorNotice message={state.error ?? "Could not check status."} onRetry={state.reload} /></Page>;

  const { cause, status } = state.data;
  return (
    <Page title={status.onboardingComplete ? "You're all set" : "Almost there"}>
      <Card className="space-y-3">
        {status.onboardingComplete ? (
          <>
            <p>{cause.title} can now receive donations.</p>
            <LinkButton href={`/causes/${cause.slug}`}>View cause page</LinkButton>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-700">Stripe still needs a few details before you can receive funds.</p>
            {status.requirementsDue.length > 0 && (
              <ul className="list-disc pl-5 text-sm text-slate-600">
                {status.requirementsDue.map((r) => (
                  <li key={r}>{r.replace(/[._]/g, " ")}</li>
                ))}
              </ul>
            )}
            {resumeError && <ErrorNotice message={resumeError} />}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => resume(cause.id)}>Continue onboarding</Button>
              <Button variant="secondary" onClick={state.reload}>Re-check status</Button>
            </div>
          </>
        )}
      </Card>
    </Page>
  );
}
