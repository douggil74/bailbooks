import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { application_id } = await req.json();

    if (!application_id) {
      return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch application
    const { data: app, error: fetchErr } = await supabase
      .from('applications')
      .select('id, defendant_first, defendant_last, defendant_phone')
      .eq('id', application_id)
      .single();

    if (fetchErr || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Generate short token (8 alphanumeric chars) — same pattern as indemnitor invite
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes, b => chars[b % chars.length]).join('');

    const { error: updateError } = await supabase
      .from('applications')
      .update({ onboard_token: token })
      .eq('id', application_id);

    if (updateError) {
      console.error('[DefendantLink] Token update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const url = `${baseUrl}/d/${token}`;

    return NextResponse.json({ success: true, url, token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate link';
    console.error('[DefendantLink] Unhandled error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
