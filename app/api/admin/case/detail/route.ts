import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const applicationId = req.nextUrl.searchParams.get('id');

  if (!applicationId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const [appResult, refsResult, sigsResult, docsResult, checkinsResult, smsResult, remindersResult] =
      await Promise.all([
        supabase.from('applications').select('*').eq('id', applicationId).single(),
        supabase
          .from('application_references')
          .select('*')
          .eq('application_id', applicationId)
          .order('created_at', { ascending: true }),
        supabase
          .from('signatures')
          .select('*')
          .eq('application_id', applicationId)
          .order('signed_at', { ascending: false }),
        supabase
          .from('documents')
          .select('*')
          .eq('application_id', applicationId)
          .order('uploaded_at', { ascending: true }),
        supabase
          .from('checkins')
          .select('*')
          .eq('application_id', applicationId)
          .order('checked_in_at', { ascending: false }),
        supabase
          .from('sms_log')
          .select('*')
          .eq('application_id', applicationId)
          .order('sent_at', { ascending: false }),
        supabase
          .from('reminders_sent')
          .select('*')
          .eq('application_id', applicationId)
          .order('sent_at', { ascending: false }),
      ]);

    if (!appResult.data) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Generate signed URLs for document thumbnails
    const documents = docsResult.data || [];
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const { data: signedUrlData } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.storage_path, 3600); // 1 hour expiry
        return {
          ...doc,
          signed_url: signedUrlData?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({
      application: appResult.data,
      references: refsResult.data || [],
      signatures: sigsResult.data || [],
      documents: documentsWithUrls,
      checkins: checkinsResult.data || [],
      sms_log: smsResult.data || [],
      reminders_sent: remindersResult.data || [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch case detail';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
