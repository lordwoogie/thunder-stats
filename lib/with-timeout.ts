/**
 * Bound a promise's wall-clock cost.
 *
 * The league bundle pulls from six sources, and most of them are enrichment:
 * nice to have, not worth failing over. But a single slow CSV download could
 * push an AI request past the 60s function ceiling and turn a good answer into
 * no answer. Wrapping the optional sources means the worst case is an answer
 * with slightly less context rather than a spinner that never resolves.
 *
 * The underlying promise is not cancelled — it keeps running and may still
 * populate the in-process cache for the next request. We just stop waiting.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[timeout] ${label} exceeded ${ms}ms — continuing without it`);
      resolve(fallback);
    }, ms);
  });
  return Promise.race([
    promise
      .catch((err) => {
        console.warn(`[failed] ${label}:`, err?.message ?? err);
        return fallback;
      })
      .finally(() => clearTimeout(timer)),
    timeout
  ]);
}
