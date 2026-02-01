import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { data: indemnitor } = await supabase
      .from('indemnitors')
      .select('*, applications(defendant_first, defendant_last, indemnitor_info_categories)')
      .eq('invite_token', token)
      .single();

    if (!indemnitor) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    // Check expiry
    if (indemnitor.invite_expires_at && new Date(indemnitor.invite_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired. Please ask the agent to send a new one.' }, { status: 410 });
    }

    const app = indemnitor.applications as { defendant_first: string; defendant_last: string; indemnitor_info_categories: string | null } | null;

    return NextResponse.json({
      valid: true,
      indemnitor: {
        id: indemnitor.id,
        first_name: indemnitor.first_name,
        last_name: indemnitor.last_name,
        dob: indemnitor.dob,
        phone: indemnitor.phone,
        email: indemnitor.email,
        address: indemnitor.address,
        city: indemnitor.city,
        state: indemnitor.state,
        zip: indemnitor.zip,
        ssn_last4: indemnitor.ssn_last4,
        dl_number: indemnitor.dl_number,
        car_make: indemnitor.car_make,
        car_model: indemnitor.car_model,
        car_year: indemnitor.car_year,
        car_color: indemnitor.car_color,
        employer_name: indemnitor.employer_name,
        employer_phone: indemnitor.employer_phone,
        status: indemnitor.status,
      },
      defendant_name: app ? `${app.defendant_first} ${app.defendant_last}` : null,
      info_categories: app?.indemnitor_info_categories ?? 'personal,address,employer,id_photos',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to validate token';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
