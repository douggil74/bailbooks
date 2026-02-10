-- Indemnitors table
CREATE TABLE IF NOT EXISTS indemnitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'LA',
  zip TEXT,
  ssn_last4 TEXT,
  dl_number TEXT,
  car_make TEXT,
  car_model TEXT,
  car_year TEXT,
  car_color TEXT,
  employer_name TEXT,
  employer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','complete')),
  invite_token TEXT,
  invite_sent_at TIMESTAMPTZ,
  invite_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_indemnitors_invite_token ON indemnitors(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_indemnitors_application_id ON indemnitors(application_id);

-- Add car fields to applications
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS car_make TEXT,
  ADD COLUMN IF NOT EXISTS car_model TEXT,
  ADD COLUMN IF NOT EXISTS car_year TEXT,
  ADD COLUMN IF NOT EXISTS car_color TEXT;

-- Add indemnitor_id to signatures and documents
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS indemnitor_id UUID REFERENCES indemnitors(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS indemnitor_id UUID REFERENCES indemnitors(id) ON DELETE SET NULL;
