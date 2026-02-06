import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const DEFAULT_CATEGORIES = [
  { name: 'Office & Overhead', description: 'Rent, utilities, supplies, software subscriptions', sort_order: 1 },
  { name: 'Recovery Costs', description: 'Bounty hunter fees, skip tracing, fugitive apprehension', sort_order: 2 },
  { name: 'Court Fees', description: 'Filing fees, court costs, motion fees', sort_order: 3 },
  { name: 'Surety Fees', description: 'Build-up deposits, surety company charges', sort_order: 4 },
  { name: 'Agent Commissions', description: 'Sub-agent commissions and referral fees', sort_order: 5 },
  { name: 'Vehicle & Travel', description: 'Fuel, maintenance, mileage, travel expenses', sort_order: 6 },
  { name: 'Insurance', description: 'E&O insurance, general liability, workers comp', sort_order: 7 },
  { name: 'Marketing', description: 'Advertising, website, signage, business cards', sort_order: 8 },
  { name: 'Forfeiture Payments', description: 'Bond forfeiture payments to the court', sort_order: 9 },
  { name: 'Miscellaneous', description: 'Other business expenses', sort_order: 10 },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, owner_email, slug } = body;

    if (!name || !owner_email) {
      return NextResponse.json(
        { error: 'name and owner_email are required' },
        { status: 400 }
      );
    }

    const orgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const supabase = createServerClient();

    // Create the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug: orgSlug,
        owner_email,
      })
      .select()
      .single();

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }

    // Create the owner as an admin user
    const { error: userError } = await supabase
      .from('org_users')
      .insert({
        org_id: org.id,
        email: owner_email,
        display_name: name,
        role: 'admin',
        accepted_at: new Date().toISOString(),
      });

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Seed default expense categories
    const categories = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      org_id: org.id,
      is_default: true,
    }));

    const { error: catError } = await supabase
      .from('expense_categories')
      .insert(categories);

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }

    // Backfill org_id on existing records that don't have one
    const tables = ['applications', 'payments', 'powers', 'indemnitors'];
    for (const table of tables) {
      await supabase
        .from(table)
        .update({ org_id: org.id })
        .is('org_id', null);
    }

    return NextResponse.json({
      organization: org,
      message: 'Organization created, categories seeded, existing data backfilled',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to setup organization';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
