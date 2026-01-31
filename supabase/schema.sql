-- BailMadeSimple Schema
-- Run this in the Supabase SQL Editor to create all tables

-- 1. Applications (main record)
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  status text default 'draft',
  defendant_first text not null,
  defendant_last text not null,
  defendant_dob date,
  defendant_phone text,
  defendant_email text,
  defendant_address text,
  defendant_city text,
  defendant_state text default 'LA',
  defendant_zip text,
  defendant_ssn_last4 text,
  defendant_dl_number text,
  employer_name text,
  employer_phone text,
  bond_amount decimal(12,2),
  charge_description text,
  court_name text,
  court_date date,
  case_number text,
  jail_location text,
  premium decimal(12,2),
  down_payment decimal(12,2),
  payment_plan text,
  payment_amount decimal(12,2),
  stripe_customer_id text,
  stripe_payment_method_id text,
  sms_consent boolean default false,
  gps_consent boolean default false,
  checkin_frequency text default 'weekly',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. References (per application)
create table if not exists application_references (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade,
  full_name text not null,
  relationship text,
  phone text not null,
  address text,
  created_at timestamptz default now()
);

-- 3. Signatures (e-sign records)
create table if not exists signatures (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade,
  signer_name text not null,
  signer_role text default 'defendant',
  signature_data text,
  ip_address text,
  user_agent text,
  signed_at timestamptz default now()
);

-- 4. Documents (ID photos, uploads)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade,
  doc_type text not null,
  storage_path text not null,
  file_name text,
  mime_type text,
  uploaded_at timestamptz default now()
);

-- 5. Check-ins (GPS pings)
create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade,
  latitude decimal(10,7),
  longitude decimal(10,7),
  accuracy decimal(8,2),
  ip_address text,
  method text default 'sms_link',
  checked_in_at timestamptz default now()
);

-- 6. SMS log
create table if not exists sms_log (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id),
  phone text not null,
  direction text default 'outbound',
  message text,
  twilio_sid text,
  status text,
  sent_at timestamptz default now()
);

-- Storage bucket for documents (run in Supabase Dashboard > Storage)
-- Create a bucket named 'documents' with public access disabled

-- Indexes for common queries
create index if not exists idx_applications_status on applications(status);
create index if not exists idx_application_references_app on application_references(application_id);
create index if not exists idx_signatures_app on signatures(application_id);
create index if not exists idx_documents_app on documents(application_id);
create index if not exists idx_checkins_app on checkins(application_id);
create index if not exists idx_sms_log_app on sms_log(application_id);
create index if not exists idx_sms_log_phone on sms_log(phone);
