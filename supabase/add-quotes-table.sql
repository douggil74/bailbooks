-- Quotes table for SMS quote flow
-- Agent sends a text quote → customer replies YES → case auto-created

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  bond_amount decimal(12,2) not null,
  premium decimal(12,2),
  down_payment decimal(12,2),
  message text,
  status text default 'sent',        -- sent, accepted, expired
  sms_sid text,
  application_id uuid references applications(id),
  created_at timestamptz default now()
);

create index if not exists idx_quotes_phone on quotes(phone);
create index if not exists idx_quotes_status on quotes(status);
