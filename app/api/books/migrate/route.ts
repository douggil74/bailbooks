import { NextResponse } from 'next/server';

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  // Run each DDL statement via the Supabase SQL HTTP API
  const statements = [
    // 1. Organizations
    `create table if not exists organizations (
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
    )`,
    // 2. Org Users
    `create table if not exists org_users (
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
    )`,
    // 3. Expense Categories
    `create table if not exists expense_categories (
      id uuid primary key default gen_random_uuid(),
      org_id uuid references organizations(id) on delete cascade not null,
      name text not null,
      description text,
      is_default boolean default false,
      sort_order int default 0,
      created_at timestamptz default now()
    )`,
    // 4. Expenses
    `create table if not exists expenses (
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
    )`,
    // 5. Alter existing tables
    `alter table applications add column if not exists org_id uuid references organizations(id) on delete set null`,
    `alter table applications add column if not exists forfeiture_status text`,
    `alter table applications add column if not exists forfeiture_date date`,
    `alter table applications add column if not exists forfeiture_deadline date`,
    `alter table applications add column if not exists forfeiture_amount decimal(12,2)`,
    `alter table applications add column if not exists forfeiture_notes text`,
    `alter table payments add column if not exists org_id uuid references organizations(id) on delete set null`,
    `alter table powers add column if not exists org_id uuid references organizations(id) on delete set null`,
    `alter table indemnitors add column if not exists org_id uuid references organizations(id) on delete set null`,
    // 6. Indexes
    `create index if not exists idx_organizations_slug on organizations(slug)`,
    `create index if not exists idx_org_users_org on org_users(org_id)`,
    `create index if not exists idx_org_users_email on org_users(email)`,
    `create index if not exists idx_expense_categories_org on expense_categories(org_id)`,
    `create index if not exists idx_expenses_org on expenses(org_id)`,
    `create index if not exists idx_expenses_category on expenses(category_id)`,
    `create index if not exists idx_expenses_date on expenses(expense_date)`,
    `create index if not exists idx_expenses_application on expenses(application_id)`,
    `create index if not exists idx_applications_org on applications(org_id)`,
    `create index if not exists idx_payments_org on payments(org_id)`,
    `create index if not exists idx_powers_org on powers(org_id)`,
    `create index if not exists idx_indemnitors_org on indemnitors(org_id)`,
  ];

  const results: { statement: string; ok: boolean; error?: string }[] = [];

  for (const sql of statements) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      });

      // If rpc doesn't work, try the pg-meta SQL endpoint
      if (!res.ok) {
        // Use Supabase pg-meta endpoint for DDL
        const pgRes = await fetch(`${supabaseUrl}/pg/query`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: sql }),
        });

        if (!pgRes.ok) {
          const errText = await pgRes.text();
          results.push({ statement: sql.substring(0, 60), ok: false, error: errText.substring(0, 200) });
        } else {
          results.push({ statement: sql.substring(0, 60), ok: true });
        }
      } else {
        results.push({ statement: sql.substring(0, 60), ok: true });
      }
    } catch (err) {
      results.push({
        statement: sql.substring(0, 60),
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  const failed = results.filter((r) => !r.ok);
  return NextResponse.json({
    total: results.length,
    success: results.filter((r) => r.ok).length,
    failed: failed.length,
    errors: failed,
  });
}
