// Shared TypeScript types for BailMadeSimple

export interface Application {
  id: string;
  status: 'draft' | 'submitted' | 'approved' | 'active' | 'completed';
  defendant_first: string;
  defendant_last: string;
  defendant_dob: string | null;
  defendant_phone: string | null;
  defendant_email: string | null;
  defendant_address: string | null;
  defendant_city: string | null;
  defendant_state: string;
  defendant_zip: string | null;
  defendant_ssn_last4: string | null;
  defendant_dl_number: string | null;
  employer_name: string | null;
  employer_phone: string | null;
  bond_amount: number | null;
  charge_description: string | null;
  court_name: string | null;
  court_date: string | null;
  case_number: string | null;
  jail_location: string | null;
  premium: number | null;
  down_payment: number | null;
  payment_plan: string | null;
  payment_amount: number | null;
  power_number: string | null;
  agent_notes: string | null;
  next_payment_date: string | null;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
  sms_consent: boolean;
  gps_consent: boolean;
  checkin_frequency: 'weekly' | 'biweekly' | 'monthly';
  created_at: string;
  updated_at: string;
}

export interface ApplicationReference {
  id: string;
  application_id: string;
  full_name: string;
  relationship: string | null;
  phone: string;
  address: string | null;
  created_at: string;
}

export interface Signature {
  id: string;
  application_id: string;
  signer_name: string;
  signer_role: 'defendant' | 'indemnitor' | 'agent';
  signature_data: string | null;
  ip_address: string | null;
  user_agent: string | null;
  signed_at: string;
}

export interface Document {
  id: string;
  application_id: string;
  doc_type: 'drivers_license_front' | 'drivers_license_back' | 'selfie' | 'other';
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  uploaded_at: string;
}

export interface Checkin {
  id: string;
  application_id: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  ip_address: string | null;
  method: 'sms_link' | 'manual';
  checked_in_at: string;
}

export interface SmsLogEntry {
  id: string;
  application_id: string | null;
  phone: string;
  direction: 'outbound' | 'inbound';
  message: string | null;
  twilio_sid: string | null;
  status: string | null;
  sent_at: string;
}

export interface ReminderSent {
  id: string;
  application_id: string;
  reminder_type: string;
  channel: string;
  sent_at: string;
}

// Wizard step data types

export interface Step1Data {
  defendant_first: string;
  defendant_last: string;
  defendant_dob: string;
  defendant_phone: string;
  defendant_email: string;
  defendant_address: string;
  defendant_city: string;
  defendant_state: string;
  defendant_zip: string;
  defendant_ssn_last4: string;
  defendant_dl_number: string;
}

export interface Step2Data {
  bond_amount: number;
  charge_description: string;
  court_name: string;
  court_date: string;
  case_number: string;
  jail_location: string;
}

export interface Step3Data {
  employer_name: string;
  employer_phone: string;
}

export interface ReferenceInput {
  full_name: string;
  relationship: string;
  phone: string;
  address?: string;
}

export interface Step4Data {
  references: ReferenceInput[];
}

export interface Step5Data {
  // File uploads handled separately via FormData
  doc_type: 'drivers_license_front' | 'drivers_license_back' | 'selfie';
}

export interface Step6Data {
  stripe_customer_id: string;
  stripe_payment_method_id: string;
}

export interface Step7Data {
  signer_name: string;
  signature_data: string; // base64 PNG
  sms_consent: boolean;
  gps_consent: boolean;
  checkin_frequency: 'weekly' | 'biweekly' | 'monthly';
}

// API request/response types

export interface StartApplicationRequest {
  defendant_first: string;
  defendant_last: string;
}

export interface StartApplicationResponse {
  id: string;
  status: string;
}

export interface SaveStepRequest {
  application_id: string;
  step: number;
  data: Partial<Application>;
}

export interface ReferencesRequest {
  application_id: string;
  references: ReferenceInput[];
}

export interface SignRequest {
  application_id: string;
  signer_name: string;
  signer_role?: 'defendant' | 'indemnitor' | 'agent';
  signature_data: string;
}

export interface SubmitRequest {
  application_id: string;
  sms_consent: boolean;
  gps_consent: boolean;
  checkin_frequency?: 'weekly' | 'biweekly' | 'monthly';
}

export interface SetupIntentRequest {
  application_id: string;
  email?: string;
  name?: string;
}

export interface SetupIntentResponse {
  client_secret: string;
  customer_id: string;
}

export interface ConfirmPaymentRequest {
  application_id: string;
  payment_method_id: string;
  customer_id: string;
}

export interface CheckinRequestBody {
  application_id: string;
}

export interface RecordCheckinRequest {
  application_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  token?: string;
}

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;
