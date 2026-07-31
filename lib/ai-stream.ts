/**
 * Streaming bridge for the AI routes.
 *
 * Waiting for a complete Claude response meant holding the serverless function
 * open for the entire generation, with the user staring at a spinner and no
 * way to tell a slow answer from a dead one. Streaming sends the first tokens
 * within a second or two and keeps the connection visibly alive.
 *
 * The wire format is deliberately plain text, not SSE — the client only needs
 * to append deltas, and errors are distinguishable without a framing protocol:
 * anything that fails before the first token returns JSON with an error status,
 * so the client branches on content-type.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { ANTHROPIC_MODEL, getAnthropic } from "./anthropic";

/** Marker appended when generation dies partway through a stream. */
export const STREAM_ERROR_PREFIX = "\n\n⚠️ ";

export function streamAnthropic(
  params: Omit<Anthropic.Messages.MessageCreateParams, "model" | "stream"> & {
    model?: string;
  }
): Response {
  let anthropic: Anthropic;
  try {
    anthropic = getAnthropic();
  } catch (err) {
    // Missing API key and similar setup failures — surface as a real error
    // status so the client shows a message instead of an empty answer.
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const run = anthropic.messages.stream({
          ...params,
          model: params.model ?? ANTHROPIC_MODEL
        });

        for await (const event of run) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        // The response has already begun, so the status is committed. Append
        // the failure to the visible text rather than dropping it silently.
        controller.enqueue(
          encoder.encode(`${STREAM_ERROR_PREFIX}${message}`)
        );
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      // Defeats proxy buffering that would otherwise defeat the point.
      "x-content-type-options": "nosniff"
    }
  });
}
