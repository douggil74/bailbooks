import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { ReferencesRequest } from '@/lib/bail-types';

export async function POST(req: NextRequest) {
  try {
    const body: ReferencesRequest = await req.json();

    if (!body.application_id) {
      return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
    }

    if (!body.references || body.references.length === 0) {
      return NextResponse.json({ error: 'At least one reference is required' }, { status: 400 });
    }

    if (body.references.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 references allowed' }, { status: 400 });
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

    // Delete existing references for this application (replace all)
    await supabase
      .from('application_references')
      .delete()
      .eq('application_id', body.application_id);

    // Insert new references
    const rows = body.references.map((ref) => ({
      application_id: body.application_id,
      full_name: ref.full_name.trim(),
      relationship: ref.relationship?.trim() || null,
      phone: ref.phone.trim(),
      address: ref.address?.trim() || null,
    }));

    const { data, error } = await supabase
      .from('application_references')
      .insert(rows)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ references: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
