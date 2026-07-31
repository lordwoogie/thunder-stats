import { NextResponse } from "next/server";
import { buildLeagueContext, SYSTEM_PROMPT } from "@/lib/ai-context";
import { streamAnthropic } from "@/lib/ai-stream";
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

    return streamAnthropic({
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
