-- BailBooks Schema
-- Multi-tenant accounting for bail bond companies
-- Run this in the Supabase SQL Editor after the base schema

-- 1. Organizations (tenant record)
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_email text not null,
  phone text,
  address text,
  city text,
  state text default 'LA',
  zip text,
  license_number text,
  surety_company text,
  premium_rate decimal(5,4) default 0.1200,
  fiscal_year_start int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Org Users (maps users to orgs with roles)
create table if not exists org_users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  email text not null,
  display_name text,
  role text default 'admin' check (role in ('admin', 'agent', 'bookkeeper')),
  is_active boolean default true,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(org_id, email)
);

-- 3. Expense Categories (per-org)
create table if not exists expense_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  description text,
  is_default boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 4. Expenses (line items)
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  category_id uuid references expense_categories(id) on delete set null,
  application_id uuid references applications(id) on delete set null,
  description text not null,
  amount decimal(12,2) not null,
  expense_date date not null default current_date,
  vendor text,
  payment_method text,
  reference_number text,
  receipt_path text,
  notes text,
  created_by uuid references org_users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Add org_id to existing tables
alter table applications add column if not exists org_id uuid references organizations(id) on delete set null;
alter table applications add column if not exists forfeiture_status text;
alter table applications add column if not exists forfeiture_date date;
alter table applications add column if not exists forfeiture_deadline date;
alter table applications add column if not exists forfeiture_amount decimal(12,2);
alter table applications add column if not exists forfeiture_notes text;

alter table payments add column if not exists org_id uuid references organizations(id) on delete set null;
alter table powers add column if not exists org_id uuid references organizations(id) on delete set null;
alter table indemnitors add column if not exists org_id uuid references organizations(id) on delete set null;

-- 6. Indexes for BailBooks queries
create index if not exists idx_organizations_slug on organizations(slug);
create index if not exists idx_org_users_org on org_users(org_id);
create index if not exists idx_org_users_email on org_users(email);
create index if not exists idx_expense_categories_org on expense_categories(org_id);
create index if not exists idx_expenses_org on expenses(org_id);
create index if not exists idx_expenses_category on expenses(category_id);
create index if not exists idx_expenses_date on expenses(expense_date);
create index if not exists idx_expenses_application on expenses(application_id);
create index if not exists idx_applications_org on applications(org_id);
create index if not exists idx_payments_org on payments(org_id);
create index if not exists idx_powers_org on powers(org_id);
create index if not exists idx_indemnitors_org on indemnitors(org_id);
create index if not exists idx_applications_forfeiture on applications(forfeiture_status) where forfeiture_status is not null;

-- 7. Bank Accounts
create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  account_name text not null,
  account_type text not null check (account_type in ('checking', 'savings', 'trust', 'operating', 'credit_card')),
  bank_name text not null,
  routing_number text,
  account_number_last4 text,
  current_balance decimal(12,2) default 0.00,
  is_default boolean default false,
  is_active boolean default true,
  opened_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. Chart of Accounts
create table if not exists chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  account_number text not null,
  account_name text not null,
  account_type text not null check (account_type in ('asset', 'liability', 'equity', 'income', 'expense')),
  sub_type text,
  description text,
  is_active boolean default true,
  balance decimal(12,2) default 0.00,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(org_id, account_number)
);

-- 9. Transactions
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  chart_account_id uuid references chart_of_accounts(id) on delete set null,
  transaction_type text not null check (transaction_type in ('deposit', 'withdrawal', 'transfer', 'adjustment')),
  amount decimal(12,2) not null,
  description text not null,
  payee text,
  reference_number text,
  transaction_date date not null default current_date,
  is_reconciled boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 10. Banking indexes
create index if not exists idx_bank_accounts_org on bank_accounts(org_id);
create index if not exists idx_chart_of_accounts_org on chart_of_accounts(org_id);
create index if not exists idx_chart_of_accounts_type on chart_of_accounts(account_type);
create index if not exists idx_transactions_org on transactions(org_id);
create index if not exists idx_transactions_bank_account on transactions(bank_account_id);
create index if not exists idx_transactions_date on transactions(transaction_date);
create index if not exists idx_transactions_reconciled on transactions(is_reconciled) where is_reconciled = false;
