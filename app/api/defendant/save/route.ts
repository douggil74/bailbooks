import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, ...fields } = body;

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Validate token
    const { data: app } = await supabase
      .from('applications')
      .select('id')
      .eq('onboard_token', token)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    // Map defendant form fields to application columns
    const allowedFields: Record<string, string> = {
      first_name: 'defendant_first',
      last_name: 'defendant_last',
      dob: 'defendant_dob',
      phone: 'defendant_phone',
      email: 'defendant_email',
      address: 'defendant_address',
      city: 'defendant_city',
      state: 'defendant_state',
      zip: 'defendant_zip',
      ssn_last4: 'defendant_ssn_last4',
      dl_number: 'defendant_dl_number',
      employer_name: 'employer_name',
      employer_phone: 'employer_phone',
    };

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const [formKey, dbCol] of Object.entries(allowedFields)) {
      if (formKey in fields) {
        updateData[dbCol] = fields[formKey];
      }
    }

    const { error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', app.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
