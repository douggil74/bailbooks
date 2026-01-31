import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bondAmount, downPayment, premium } = body;

    // Calculate risk factors
    const downPaymentPercent = premium > 0 ? (downPayment / premium) * 100 : 0;

    let riskScore = 50; // Start at medium
    let factors: string[] = [];

    // Down payment factor (most important)
    if (downPaymentPercent >= 60) {
      riskScore -= 25;
      factors.push('Strong down payment');
    } else if (downPaymentPercent >= 50) {
      riskScore -= 15;
      factors.push('Good down payment');
    } else if (downPaymentPercent >= 30) {
      riskScore += 5;
      factors.push('Low down payment');
    } else {
      riskScore += 20;
      factors.push('Very low down payment');
    }

    // Bond amount factor
    if (bondAmount >= 100000) {
      riskScore += 15;
      factors.push('High bond amount');
    } else if (bondAmount >= 50000) {
      riskScore += 5;
      factors.push('Medium-high bond');
    } else if (bondAmount <= 10000) {
      riskScore -= 10;
      factors.push('Small bond');
    }

    // Weekly payment factor
    const remaining = premium - downPayment;
    const weeklyPayment = remaining / 10; // Assuming 10-week term
    if (weeklyPayment > 150) {
      riskScore += 10;
      factors.push('High weekly payments');
    } else if (weeklyPayment > 100) {
      riskScore += 5;
      factors.push('Moderate payments');
    } else if (weeklyPayment <= 50) {
      riskScore -= 10;
      factors.push('Manageable payments');
    }

    // Clamp score between 0-100
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Determine risk level
    let level: 'low' | 'medium' | 'high';
    let color: string;
    let label: string;

    if (riskScore <= 35) {
      level = 'low';
      color = '#22c55e'; // green
      label = 'Low Risk';
    } else if (riskScore <= 65) {
      level = 'medium';
      color = '#eab308'; // yellow
      label = 'Medium Risk';
    } else {
      level = 'high';
      color = '#ef4444'; // red
      label = 'High Risk';
    }

    return NextResponse.json({
      score: riskScore,
      level,
      color,
      label,
      factors: factors.slice(0, 2), // Top 2 factors
    });
  } catch (error) {
    console.error('Risk API error:', error);
    return NextResponse.json({ score: 50, level: 'medium', color: '#eab308', label: 'Medium Risk', factors: [] });
  }
}
