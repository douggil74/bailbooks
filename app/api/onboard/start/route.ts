import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { StartApplicationRequest } from '@/lib/bail-types';

export async function POST(req: NextRequest) {
  try {
    const body: StartApplicationRequest = await req.json();

    if (!body.defendant_first || !body.defendant_last) {
      return NextResponse.json(
        { error: 'First and last name are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('applications')
      .insert({
        defendant_first: body.defendant_first.trim(),
        defendant_last: body.defendant_last.trim(),
        status: 'draft',
      })
      .select('id, status')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
