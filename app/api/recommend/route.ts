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

    const downPct = body.premium > 0 ? ((body.downPayment / body.premium) * 100).toFixed(0) : '50';

    const prompt = `You are a bail bond payment analyst for a Louisiana bail bond agency (12% premium rate). Recommend the best payment term that balances the agency's risk exposure with the client's ability to pay.

Bond Amount: $${body.bondAmount.toFixed(2)}
Premium (12%): $${body.premium.toFixed(2)}
Down Payment: $${body.downPayment.toFixed(2)} (${downPct}% of premium)
Remaining Balance: $${body.remaining.toFixed(2)}

Payment Options:
1. ${body.term1.label}: $${body.term1.amount.toFixed(2)} per payment
2. ${body.term2.label}: $${body.term2.amount.toFixed(2)} per payment
3. ${body.term3.label}: $${body.term3.amount.toFixed(2)} per payment

DECISION RULES (in priority order):
- Shorter terms reduce agency risk exposure. Always prefer shorter if the client can afford it.
- For bonds under $10k: payments under $75/week are manageable for most clients.
- For bonds $10k-$50k: payments under $125/week are realistic.
- For bonds $50k-$100k: payments under $200/week are typical.
- For bonds over $100k (monthly terms): payments under $800/month are standard.
- If down payment is low (under 30% of premium), prefer longer terms since the client likely has tight cash flow.
- If down payment is high (50%+ of premium), the client can likely handle shorter terms.
- Pick the SHORTEST term where the payment fits within the range above. If none fit, pick the lowest payment option.

Respond with ONLY JSON: {"recommendation": 1, "reason": "brief reason"}
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
