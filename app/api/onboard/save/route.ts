import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { SaveStepRequest } from '@/lib/bail-types';

// Allowed fields per step to prevent arbitrary writes
const STEP_FIELDS: Record<number, string[]> = {
  1: [
    'defendant_first', 'defendant_last', 'defendant_dob', 'defendant_phone',
    'defendant_email', 'defendant_address', 'defendant_city', 'defendant_state',
    'defendant_zip', 'defendant_ssn_last4', 'defendant_dl_number',
  ],
  2: [
    'bond_amount', 'charge_description', 'court_name', 'court_date',
    'case_number', 'jail_location',
  ],
  3: ['employer_name', 'employer_phone'],
  6: ['stripe_customer_id', 'stripe_payment_method_id'],
  7: ['sms_consent', 'gps_consent', 'checkin_frequency'],
};

export async function PUT(req: NextRequest) {
  try {
    const body: SaveStepRequest = await req.json();

    if (!body.application_id) {
      return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
    }

    const allowedFields = STEP_FIELDS[body.step];
    if (!allowedFields) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    // Filter to only allowed fields for this step
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (field in body.data) {
        updateData[field] = (body.data as Record<string, unknown>)[field];
      }
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', body.application_id)
      .select('id, status, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
