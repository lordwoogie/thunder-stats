import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { buildLeagueContext, SYSTEM_PROMPT } from "@/lib/ai-context";
import { ANTHROPIC_MODEL, getAnthropic } from "@/lib/anthropic";
import { buildLeagueBundle } from "@/lib/league-service";
import { MY_ROSTER_ID } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

interface TradeBody {
  my_side: string;
  their_side: string;
  their_team?: string;
  notes?: string;
}

export async function POST(req: Request) {
  let body: TradeBody;
  try {
    body = (await req.json()) as TradeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.my_side || !body.their_side) {
    return NextResponse.json(
      { error: "Missing 'my_side' or 'their_side'." },
      { status: 400 }
    );
  }

  try {
    const bundle = await buildLeagueBundle();
    const context = buildLeagueContext(bundle);
    const me = bundle.teams.find((t) => t.roster_id === MY_ROSTER_ID);

    const anthropic = getAnthropic();

    const tradePrompt = `Evaluate this proposed trade from MY perspective (roster_id ${MY_ROSTER_ID}, team "${me?.team_name ?? "Lord Woogie"}").

I SEND: ${body.my_side}
I RECEIVE: ${body.their_side}${
      body.their_team ? `\nCounterparty: ${body.their_team}` : ""
    }${body.notes ? `\n\nAdditional context: ${body.notes}` : ""}

Please respond with:
1. Verdict (ACCEPT / DECLINE / COUNTER) and a one-sentence headline.
2. Value comparison: who "wins" the raw value and by how much.
3. Roster fit: how each side changes my starting lineup and depth.
4. Dynasty angle: age curves, long-term trajectory of each asset.
5. Counter-offer suggestion if applicable — be specific.`;

    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1400,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `LEAGUE CONTEXT (as of ${bundle.fetchedAt}):\n\n${context}`
            },
            { type: "text", text: tradePrompt }
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

    return NextResponse.json({ text, model: response.model, usage: response.usage });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
