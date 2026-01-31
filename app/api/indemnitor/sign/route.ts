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
    const { data: indemnitor } = await supabase
      .from('indemnitors')
      .select('id, application_id, invite_expires_at')
      .eq('invite_token', token)
      .single();

    if (!indemnitor) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    if (indemnitor.invite_expires_at && new Date(indemnitor.invite_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
    }

    // Get client info
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = req.headers.get('user-agent') || null;

    // Create signature record
    const { data: sig, error: sigError } = await supabase
      .from('signatures')
      .insert({
        application_id: indemnitor.application_id,
        indemnitor_id: indemnitor.id,
        signer_name: signer_name.trim(),
        signer_role: 'indemnitor',
        signature_data,
        ip_address: ip,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (sigError) return NextResponse.json({ error: sigError.message }, { status: 500 });

    // Mark indemnitor as complete
    await supabase
      .from('indemnitors')
      .update({
        status: 'complete',
        updated_at: new Date().toISOString(),
      })
      .eq('id', indemnitor.id);

    return NextResponse.json({ signature: sig }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save signature';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
