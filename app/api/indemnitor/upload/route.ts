import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const token = formData.get('token') as string | null;
    const docType = formData.get('doc_type') as string | null;

    if (!file || !token || !docType) {
      return NextResponse.json({ error: 'file, token, and doc_type are required' }, { status: 400 });
    }

    const validTypes = ['drivers_license_front', 'drivers_license_back', 'selfie'];
    if (!validTypes.includes(docType)) {
      return NextResponse.json({ error: 'Invalid doc_type' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
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

    // Upload to storage under indemnitor path
    const ext = file.name.split('.').pop() || 'jpg';
    const storagePath = `${indemnitor.application_id}/indemnitor_${indemnitor.id}/${docType}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Upsert document record
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id')
      .eq('application_id', indemnitor.application_id)
      .eq('indemnitor_id', indemnitor.id)
      .eq('doc_type', docType)
      .single();

    if (existingDoc) {
      const { data, error } = await supabase
        .from('documents')
        .update({
          storage_path: storagePath,
          file_name: file.name,
          mime_type: file.type,
          uploaded_at: new Date().toISOString(),
        })
        .eq('id', existingDoc.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        application_id: indemnitor.application_id,
        indemnitor_id: indemnitor.id,
        doc_type: docType,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
