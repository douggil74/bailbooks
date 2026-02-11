import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { token, signer_name, signature_data } = await req.json();

    if (!token || !signer_name || !signature_data) {
      return NextResponse.json({ error: 'token, signer_name, and signature_data are required' }, { status: 400 });
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

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = req.headers.get('user-agent') || null;

    const { data: sig, error: sigError } = await supabase
      .from('signatures')
      .insert({
        application_id: app.id,
        signer_name: signer_name.trim(),
        signer_role: 'defendant',
        signature_data,
        ip_address: ip,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (sigError) return NextResponse.json({ error: sigError.message }, { status: 500 });

    return NextResponse.json({ signature: sig }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save signature';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
