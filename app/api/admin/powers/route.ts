import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const status = req.nextUrl.searchParams.get('status');

    let query = supabase
      .from('powers')
      .select('*, applications!powers_application_id_fkey(defendant_first, defendant_last)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const powers = (data || []).map((p: Record<string, unknown>) => {
      const app = p.applications as { defendant_first: string; defendant_last: string } | null;
      return {
        id: p.id,
        power_number: p.power_number,
        amount: p.amount,
        surety: p.surety,
        status: p.status,
        application_id: p.application_id,
        assigned_at: p.assigned_at,
        created_at: p.created_at,
        defendant_name: app ? `${app.defendant_first} ${app.defendant_last}` : null,
      };
    });

    return NextResponse.json({ powers });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch powers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await req.json();
    const { power_number, amount, surety } = body;

    if (!power_number || !amount || !surety) {
      return NextResponse.json({ error: 'power_number, amount, and surety are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('powers')
      .insert({ power_number, amount: parseFloat(amount), surety })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Power number already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ power: data });
  } catch {
    return NextResponse.json({ error: 'Failed to create power' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await req.json();
    const { id, application_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Power id is required' }, { status: 400 });
    }

    // Assign to a case
    if (application_id) {
      const { error } = await supabase
        .from('powers')
        .update({
          application_id,
          status: 'active',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Unassign from case
    const { error } = await supabase
      .from('powers')
      .update({
        application_id: null,
        status: 'open',
        assigned_at: null,
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update power' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Power id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('powers')
      .update({ status: 'voided' })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to void power' }, { status: 500 });
  }
}
