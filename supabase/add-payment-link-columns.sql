-- Add payment link columns to applications table
-- Run this in the Supabase SQL editor

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS payment_link_token UUID,
  ADD COLUMN IF NOT EXISTS payment_link_amount DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS payment_link_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_link_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_applications_payment_link_token
  ON applications(payment_link_token)
  WHERE payment_link_token IS NOT NULL;
