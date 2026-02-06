import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('org_id', orgId)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ categories: data || [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch categories';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { org_id, name, description } = body;

    if (!org_id || !name) {
      return NextResponse.json({ error: 'org_id and name are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get max sort_order
    const { data: existing } = await supabase
      .from('expense_categories')
      .select('sort_order')
      .eq('org_id', org_id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = ((existing?.[0]?.sort_order as number) || 0) + 1;

    const { data, error } = await supabase
      .from('expense_categories')
      .insert({
        org_id,
        name,
        description: description || null,
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ category: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create category';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('expense_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ category: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update category';
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
    const { error } = await supabase.from('expense_categories').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete category';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
