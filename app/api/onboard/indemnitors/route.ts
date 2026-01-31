import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface CoSignerInput {
  first_name: string;
  last_name: string;
  phone?: string;
  send_invite?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { application_id, cosigners } = await req.json() as {
      application_id: string;
      cosigners: CoSignerInput[];
    };

    if (!application_id) {
      return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
    }

    if (!cosigners || cosigners.length === 0) {
      return NextResponse.json({ indemnitors: [] });
    }

    if (cosigners.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 co-signers allowed' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify application exists
    const { data: app } = await supabase
      .from('applications')
      .select('id')
      .eq('id', application_id)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Create indemnitor stubs
    const validCosigners = cosigners.filter(c => c.first_name?.trim() && c.last_name?.trim());

    if (validCosigners.length === 0) {
      return NextResponse.json({ indemnitors: [] });
    }

    const inserts = validCosigners.map(c => ({
      application_id,
      first_name: c.first_name.trim(),
      last_name: c.last_name.trim(),
      phone: c.phone?.trim() || null,
    }));

    const { data, error } = await supabase
      .from('indemnitors')
      .insert(inserts)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ indemnitors: data || [] }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create co-signers';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
