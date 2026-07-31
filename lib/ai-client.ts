/**
 * Client-side consumer for the streaming AI routes.
 *
 * Two failure modes have to stay distinguishable. Setup failures (missing API
 * key, bad model, league fetch blew up) come back as JSON with an error status
 * before any tokens exist. Once streaming starts the status is already
 * committed, so mid-flight failures arrive as text appended to the answer.
 *
 * Also enforces a client-side deadline. The old code awaited a fetch with no
 * timeout, so a stalled function left the spinner running with nothing to
 * click — indistinguishable from a slow answer.
 */

/** Slightly beyond the route's own 60s ceiling, so the server usually wins. */
const CLIENT_TIMEOUT_MS = 70_000;

export async function streamAI(
  url: string,
  body: unknown,
  onDelta: (full: string) => void
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    // Setup failure — the route returned JSON instead of a stream.
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || contentType.includes("application/json")) {
      let message = `HTTP ${res.status}`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) message = data.error;
      } catch {
        /* non-JSON error body; keep the status line */
      }
      throw new Error(message);
    }

    if (!res.body) throw new Error("No response body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
      onDelta(full);
    }

    full += decoder.decode();
    onDelta(full);

    if (!full.trim()) throw new Error("Empty response from the model");
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        `Timed out after ${CLIENT_TIMEOUT_MS / 1000}s. The league data or the model took too long — try again.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
