import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const ALLOWED_FIELDS = [
  'first_name', 'last_name', 'dob', 'phone', 'email',
  'address', 'city', 'state', 'zip', 'ssn_last4', 'dl_number',
  'car_make', 'car_model', 'car_year', 'car_color',
  'employer_name', 'employer_phone',
];

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, ...fields } = body;

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Validate token
    const { data: indemnitor } = await supabase
      .from('indemnitors')
      .select('id, invite_expires_at')
      .eq('invite_token', token)
      .single();

    if (!indemnitor) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    if (indemnitor.invite_expires_at && new Date(indemnitor.invite_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
    }

    // Filter to allowed fields
    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in fields) {
        updates[key] = fields[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to save' }, { status: 400 });
    }

    // Set status to in_progress if still pending
    updates.status = 'in_progress';
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('indemnitors')
      .update(updates)
      .eq('id', indemnitor.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ indemnitor: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
