import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const ALLOWED_FIELDS = [
  'status',
  'power_number',
  'premium',
  'down_payment',
  'payment_amount',
  'payment_plan',
  'agent_notes',
  'checkin_frequency',
  'next_payment_date',
];

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { application_id, ...fields } = body;

    if (!application_id) {
      return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
    }

    // Filter to only allowed fields
    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in fields) {
        updates[key] = fields[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify application exists
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('id', application_id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', application_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ application: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update case';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
