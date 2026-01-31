import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { RecordCheckinRequest } from '@/lib/bail-types';

export async function POST(req: NextRequest) {
  try {
    const body: RecordCheckinRequest = await req.json();

    if (!body.application_id || body.latitude == null || body.longitude == null) {
      return NextResponse.json(
        { error: 'application_id, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify application exists
    const { data: app } = await supabase
      .from('applications')
      .select('id')
      .eq('id', body.application_id)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

    const { data, error } = await supabase
      .from('checkins')
      .insert({
        application_id: body.application_id,
        latitude: body.latitude,
        longitude: body.longitude,
        accuracy: body.accuracy || null,
        ip_address: ip,
        method: 'sms_link',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
