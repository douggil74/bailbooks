import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { data: app } = await supabase
      .from('applications')
      .select('id, defendant_first, defendant_last, defendant_dob, defendant_phone, defendant_email, defendant_address, defendant_city, defendant_state, defendant_zip, defendant_ssn_last4, defendant_dl_number, employer_name, employer_phone, charge_description, bond_amount')
      .eq('onboard_token', token)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      application_id: app.id,
      defendant: {
        first_name: app.defendant_first,
        last_name: app.defendant_last,
        dob: app.defendant_dob,
        phone: app.defendant_phone,
        email: app.defendant_email,
        address: app.defendant_address,
        city: app.defendant_city,
        state: app.defendant_state || 'LA',
        zip: app.defendant_zip,
        ssn_last4: app.defendant_ssn_last4,
        dl_number: app.defendant_dl_number,
        employer_name: app.employer_name,
        employer_phone: app.employer_phone,
      },
      charge_description: app.charge_description,
      bond_amount: app.bond_amount,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to validate token';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
