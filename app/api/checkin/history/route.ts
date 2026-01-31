import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const applicationId = req.nextUrl.searchParams.get('application_id');

  if (!applicationId) {
    return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('application_id', applicationId)
      .order('checked_in_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ checkins: data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch check-in history' }, { status: 500 });
  }
}
