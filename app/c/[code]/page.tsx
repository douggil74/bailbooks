import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';

export default async function ShortCheckinRedirect({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = createServerClient();

  const { data } = await supabase
    .from('applications')
    .select('id')
    .eq('checkin_code', code)
    .single();

  if (!data) {
    redirect('/checkin');
  }

  redirect(`/checkin?id=${data.id}`);
}
