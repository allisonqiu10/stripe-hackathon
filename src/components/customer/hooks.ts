// OWNER: P4
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "./api";

export type AsyncState<T> = {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  reload: () => void;
};

/**
 * Loads once, and optionally re-polls every `intervalMs` (paused while the tab is hidden).
 * Keeps the last good data if a poll fails; `error` is set so the UI can show a stale notice.
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[], intervalMs?: number): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });
  const depsSig = JSON.stringify(deps);
  const depsKey = useRef(depsSig);

  useEffect(() => {
    let cancelled = false;
    let latest = 0;
    if (depsKey.current !== depsSig) {
      depsKey.current = depsSig;
      setData(undefined);
      setError(null);
    }
    setLoading(true);
    const run = async () => {
      const id = ++latest;
      try {
        const d = await fetcherRef.current();
        if (!cancelled && id === latest) {
          setData(d);
          setError(null);
        }
      } catch (e) {
        if (!cancelled && id === latest) setError(errorMessage(e));
      } finally {
        if (!cancelled && id === latest) setLoading(false);
      }
    };
    run();
    const id =
      intervalMs && intervalMs > 0
        ? setInterval(() => {
            if (document.visibilityState === "visible") run();
          }, intervalMs)
        : undefined;
    const onVisible = () => {
      if (intervalMs && document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (id) clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, intervalMs, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}
