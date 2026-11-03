// OWNER: P3
import type { ReactNode } from "react";
import type { AsyncState } from "./useAsync";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" className="animate-pulse rounded-lg bg-gray-100 p-6 text-sm text-gray-500">
      {label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 font-medium underline">
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
      <p className="font-medium text-gray-900">{title}</p>
      {children && <div className="mt-1 text-sm text-gray-600">{children}</div>}
    </div>
  );
}

/** Renders loading / error / ready for an AsyncState. */
export function Async<T>({
  state,
  onRetry,
  children,
}: {
  state: AsyncState<T>;
  onRetry?: () => void;
  children: (data: T) => ReactNode;
}) {
  if (state.status === "loading") return <Loading />;
  if (state.status === "error") return <ErrorBox message={state.error} onRetry={onRetry} />;
  return <>{children(state.data)}</>;
}
