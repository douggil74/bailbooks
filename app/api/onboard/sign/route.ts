import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { SignRequest } from '@/lib/bail-types';

export async function POST(req: NextRequest) {
  try {
    const body: SignRequest = await req.json();

    if (!body.application_id || !body.signer_name || !body.signature_data) {
      return NextResponse.json(
        { error: 'application_id, signer_name, and signature_data are required' },
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
    const userAgent = req.headers.get('user-agent') || null;

    const { data, error } = await supabase
      .from('signatures')
      .insert({
        application_id: body.application_id,
        signer_name: body.signer_name.trim(),
        signer_role: body.signer_role || 'defendant',
        signature_data: body.signature_data,
        ip_address: ip,
        user_agent: userAgent,
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
