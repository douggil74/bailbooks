import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

type Body = {
  bondAmount: number;
  premium: number;
  downPayment: number;
  remaining: number;
  term1: { label: string; amount: number };
  term2: { label: string; amount: number };
  term3: { label: string; amount: number };
};

function recommend(body: Body): { recommendation: number; reason: string } {
  const { bondAmount, premium, downPayment, remaining } = body;
  const terms = [body.term1, body.term2, body.term3];
  const isMonthly = bondAmount >= 100000;
  const downPct = premium > 0 ? (downPayment / premium) * 100 : 50;

  // Weekly payment thresholds by bond size tier
  // Monthly thresholds for $100k+ bonds
  let maxPayment: number;
  if (isMonthly) {
    maxPayment = 800; // per month
  } else if (bondAmount < 10000) {
    maxPayment = 75;  // per week
  } else if (bondAmount < 50000) {
    maxPayment = 125; // per week
  } else {
    maxPayment = 200; // per week
  }

  // Low down payment = tight cash flow, loosen threshold
  if (downPct < 30) {
    maxPayment *= 0.75;
  }

  // Pick shortest term that fits under threshold
  for (let i = 0; i < terms.length; i++) {
    if (terms[i].amount <= maxPayment) {
      const periodLabel = isMonthly ? '/mo' : '/wk';
      const reasons: Record<number, string> = {
        0: `Shortest term, $${terms[i].amount.toFixed(0)}${periodLabel} is affordable`,
        1: `Balanced — $${terms[i].amount.toFixed(0)}${periodLabel} fits most budgets`,
        2: `Lowest payment at $${terms[i].amount.toFixed(0)}${periodLabel}`,
      };
      return { recommendation: i + 1, reason: reasons[i] };
    }
  }

  // None fit — pick longest (lowest payment)
  return {
    recommendation: 3,
    reason: `Lowest payment at $${terms[2].amount.toFixed(0)}${isMonthly ? '/mo' : '/wk'}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    return NextResponse.json(recommend(body));
  } catch (err: any) {
    console.error('Recommend API error:', err);
    return NextResponse.json(
      { recommendation: 2, reason: "Balanced option" },
      { status: 200 }
    );
  }
}
