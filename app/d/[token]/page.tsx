import { createServerClient } from '@/lib/supabase';
import DefendantForm from './DefendantForm';

interface DefendantData {
  application_id: string;
  first_name: string;
  last_name: string;
  dob: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  ssn_last4: string | null;
  dl_number: string | null;
  employer_name: string | null;
  employer_phone: string | null;
}

export default async function DefendantPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const supabase = createServerClient();
  const { data: app } = await supabase
    .from('applications')
    .select('id, defendant_first, defendant_last, defendant_dob, defendant_phone, defendant_email, defendant_address, defendant_city, defendant_state, defendant_zip, defendant_ssn_last4, defendant_dl_number, employer_name, employer_phone')
    .eq('onboard_token', token)
    .single();

  if (!app) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link Not Valid</h2>
          <p className="text-gray-600 text-sm">This link is invalid or has expired. Please contact your bail agent for a new link.</p>
        </div>
      </div>
    );
  }

  const defendant: DefendantData = {
    application_id: app.id,
    first_name: app.defendant_first || '',
    last_name: app.defendant_last || '',
    dob: app.defendant_dob || null,
    phone: app.defendant_phone || null,
    email: app.defendant_email || null,
    address: app.defendant_address || null,
    city: app.defendant_city || null,
    state: app.defendant_state || 'LA',
    zip: app.defendant_zip || null,
    ssn_last4: app.defendant_ssn_last4 || null,
    dl_number: app.defendant_dl_number || null,
    employer_name: app.employer_name || null,
    employer_phone: app.employer_phone || null,
  };

  return <DefendantForm token={token} defendant={defendant} />;
}
