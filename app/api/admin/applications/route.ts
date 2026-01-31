import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('applications')
      .select('id, status, defendant_first, defendant_last, defendant_phone, defendant_email, bond_amount, charge_description, court_date, created_at, updated_at, checkin_frequency')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ applications: data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
