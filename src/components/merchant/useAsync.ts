// OWNER: P3
"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; data: T };

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  const lastNonce = useRef(0);

  useEffect(() => {
    let cancelled = false;
    // A reload() keeps showing current data while refetching; a deps change resets to loading.
    const isReload = nonce !== lastNonce.current;
    lastNonce.current = nonce;
    setState((s) => (isReload && s.status === "ready" ? s : { status: "loading" }));
    fn().then(
      (data) => !cancelled && setState({ status: "ready", data }),
      (e: unknown) =>
        !cancelled &&
        setState({ status: "error", error: e instanceof Error ? e.message : "Something went wrong" }),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { state, reload };
}
