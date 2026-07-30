import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { buildLeagueContext, SYSTEM_PROMPT } from "@/lib/ai-context";
import { ANTHROPIC_MODEL, getAnthropic } from "@/lib/anthropic";
import { buildLeagueBundle } from "@/lib/league-service";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AnalyzeBody {
  prompt: string;
  title?: string;
}

export async function POST(req: Request) {
  let body: AnalyzeBody;
  try {
    body = (await req.json()) as AnalyzeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.prompt || typeof body.prompt !== "string") {
    return NextResponse.json(
      { error: "Missing required 'prompt' field." },
      { status: 400 }
    );
  }

  try {
    const bundle = await buildLeagueBundle();
    const context = buildLeagueContext(bundle);

    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1600,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `LEAGUE CONTEXT (as of ${bundle.fetchedAt}):\n\n${context}`
            },
            {
              type: "text",
              text: `QUESTION${body.title ? ` — ${body.title}` : ""}:\n\n${body.prompt}`
            }
          ]
        }
      ]
    });

    const text = response.content
      .filter(
        (b): b is Anthropic.Messages.TextBlock => b.type === "text"
      )
      .map((b) => b.text)
      .join("\n\n");

    return NextResponse.json({
      text,
      model: response.model,
      usage: response.usage
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
