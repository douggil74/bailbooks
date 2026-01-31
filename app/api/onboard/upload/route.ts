import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const applicationId = formData.get('application_id') as string | null;
    const docType = formData.get('doc_type') as string | null;

    if (!file || !applicationId || !docType) {
      return NextResponse.json(
        { error: 'file, application_id, and doc_type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['drivers_license_front', 'drivers_license_back', 'selfie', 'other'];
    if (!validTypes.includes(docType)) {
      return NextResponse.json({ error: 'Invalid doc_type' }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify application exists
    const { data: app } = await supabase
      .from('applications')
      .select('id')
      .eq('id', applicationId)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Upload to Supabase Storage
    const ext = file.name.split('.').pop() || 'jpg';
    const storagePath = `${applicationId}/${docType}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Upsert document record (replace if same doc_type exists)
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id')
      .eq('application_id', applicationId)
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
        application_id: applicationId,
        doc_type: docType,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
