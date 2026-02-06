import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const ALLOWED_FIELDS = [
  'status',
  'defendant_first',
  'defendant_last',
  'defendant_phone',
  'defendant_email',
  'defendant_dob',
  'defendant_address',
  'defendant_city',
  'defendant_state',
  'defendant_zip',
  'defendant_ssn_last4',
  'defendant_dl_number',
  'employer_name',
  'employer_phone',
  'bond_amount',
  'charge_description',
  'court_name',
  'court_date',
  'case_number',
  'jail_location',
  'power_number',
  'premium',
  'down_payment',
  'payment_amount',
  'payment_plan',
  'agent_notes',
  'checkin_frequency',
  'next_payment_date',
  'county',
  'bond_date',
  'car_make',
  'car_model',
  'car_year',
  'car_color',
  'sms_consent',
  'gps_consent',
  'indemnitor_info_categories',
  'originals_signed',
  'checklist_overrides',
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const application_id = searchParams.get('id');

    if (!application_id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', application_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete case';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
