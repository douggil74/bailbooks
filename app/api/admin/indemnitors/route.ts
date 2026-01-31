import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const MAX_INDEMNITORS = 3;

export async function GET(req: NextRequest) {
  const applicationId = req.nextUrl.searchParams.get('application_id');
  if (!applicationId) {
    return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('indemnitors')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ indemnitors: data || [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch indemnitors';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { application_id, first_name, last_name, phone } = body;

    if (!application_id || !first_name || !last_name) {
      return NextResponse.json({ error: 'application_id, first_name, and last_name are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Enforce max 3
    const { count } = await supabase
      .from('indemnitors')
      .select('id', { count: 'exact', head: true })
      .eq('application_id', application_id);

    if ((count ?? 0) >= MAX_INDEMNITORS) {
      return NextResponse.json({ error: `Maximum of ${MAX_INDEMNITORS} indemnitors allowed` }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('indemnitors')
      .insert({
        application_id,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        phone: phone?.trim() || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ indemnitor: data }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create indemnitor';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

const ALLOWED_FIELDS = [
  'first_name', 'last_name', 'dob', 'phone', 'email',
  'address', 'city', 'state', 'zip', 'ssn_last4', 'dl_number',
  'car_make', 'car_model', 'car_year', 'car_color',
  'employer_name', 'employer_phone', 'status',
];

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in fields) {
        updates[key] = fields[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('indemnitors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ indemnitor: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update indemnitor';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const { error } = await supabase.from('indemnitors').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete indemnitor';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
