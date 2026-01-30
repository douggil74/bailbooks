import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

let client: OpenAI | null = null;
function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return client;
}

type Body = {
  bondAmount: number;
  premium: number;
  downPayment: number;
  remaining: number;
  term1: { label: string; amount: number };
  term2: { label: string; amount: number };
  term3: { label: string; amount: number };
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    const prompt = `You are a bail bond payment analyst. Recommend the best payment term.

Remaining Balance: $${body.remaining.toFixed(2)}

Payment Options:
1. ${body.term1.label}: $${body.term1.amount.toFixed(2)} per payment
2. ${body.term2.label}: $${body.term2.amount.toFixed(2)} per payment
3. ${body.term3.label}: $${body.term3.amount.toFixed(2)} per payment

GOAL: Keep payments under $100/week if possible. Pick the shortest term that stays under $100/week. If none are under $100, pick the lowest payment option.

Respond with ONLY JSON: {"recommendation": 1, "reason": "Under $100/week"}
Where recommendation is 1, 2, or 3.`;

    const completion = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content?.trim();

    try {
      const parsed = JSON.parse(response || '{"recommendation": 2, "reason": "Middle option balances affordability and payoff time"}');
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ recommendation: 2, reason: "Balanced option for most clients" });
    }
  } catch (err: any) {
    console.error('Recommend API error:', err);
    return NextResponse.json(
      { recommendation: 2, reason: "Default recommendation" },
      { status: 200 }
    );
  }
}
