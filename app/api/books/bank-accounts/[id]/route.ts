import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const supabase = createServerClient();

    // If setting as default, unset other defaults
    if (body.is_default && body.org_id) {
      await supabase
        .from('bank_accounts')
        .update({ is_default: false })
        .eq('org_id', body.org_id);
    }

    const { data, error } = await supabase
      .from('bank_accounts')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ account: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update bank account';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from('bank_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete bank account';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
