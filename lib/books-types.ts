// BailBooks TypeScript types

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  license_number: string | null;
  surety_company: string | null;
  premium_rate: number;
  fiscal_year_start: number;
  created_at: string;
  updated_at: string;
}

export interface OrgUser {
  id: string;
  org_id: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'agent' | 'bookkeeper';
  is_active: boolean;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export interface Expense {
  id: string;
  org_id: string;
  category_id: string | null;
  application_id: string | null;
  description: string;
  amount: number;
  expense_date: string;
  vendor: string | null;
  payment_method: string | null;
  reference_number: string | null;
  receipt_path: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  category_name?: string;
  defendant_name?: string;
}

export interface BondLedgerEntry {
  id: string;
  defendant_name: string;
  bond_amount: number;
  premium: number;
  down_payment: number;
  total_paid: number;
  balance_due: number;
  status: string;
  bond_date: string | null;
  court_date: string | null;
  next_payment_date: string | null;
  power_number: string | null;
  forfeiture_status: string | null;
  payment_count: number;
  overdue_count: number;
}

export interface DashboardData {
  total_active_bonds: number;
  total_bond_liability: number;
  total_premium_earned: number;
  total_collected: number;
  total_outstanding: number;
  total_expenses: number;
  net_income: number;
  overdue_payments: number;
  upcoming_court_dates: number;
  forfeitures: number;
  cash_flow: CashFlowMonth[];
  recent_payments: RecentPayment[];
  overdue_list: OverduePayment[];
  upcoming_courts: UpcomingCourt[];
}

export interface CashFlowMonth {
  month: string;
  income: number;
  expenses: number;
}

export interface RecentPayment {
  id: string;
  defendant_name: string;
  amount: number;
  paid_at: string;
  payment_method: string | null;
}

export interface OverduePayment {
  id: string;
  application_id: string;
  defendant_name: string;
  amount: number;
  due_date: string;
  days_overdue: number;
}

export interface UpcomingCourt {
  application_id: string;
  defendant_name: string;
  court_name: string | null;
  court_date: string;
  bond_amount: number;
}

export interface ProfitLossReport {
  period_start: string;
  period_end: string;
  revenue: {
    premiums_earned: number;
    payments_collected: number;
    deposits: number;
    total_revenue: number;
  };
  expenses_by_category: { category: string; amount: number }[];
  total_expenses: number;
  net_income: number;
}

export interface AgingBucket {
  label: string;
  min_days: number;
  max_days: number | null;
  count: number;
  total: number;
  payments: {
    id: string;
    application_id: string;
    defendant_name: string;
    amount: number;
    due_date: string;
    days_overdue: number;
  }[];
}

export interface AgingReceivablesReport {
  as_of: string;
  total_outstanding: number;
  buckets: AgingBucket[];
}

export interface OutstandingBondReport {
  as_of: string;
  total_liability: number;
  total_premium_receivable: number;
  bonds: {
    id: string;
    defendant_name: string;
    bond_amount: number;
    premium: number;
    collected: number;
    remaining: number;
    status: string;
    bond_date: string | null;
    forfeiture_status: string | null;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface BankAccount {
  id: string;
  org_id: string;
  account_name: string;
  account_type: 'checking' | 'savings' | 'trust' | 'operating' | 'credit_card';
  bank_name: string;
  routing_number: string | null;
  account_number_last4: string | null;
  current_balance: number;
  is_default: boolean;
  is_active: boolean;
  opened_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChartOfAccount {
  id: string;
  org_id: string;
  account_number: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  sub_type: string | null;
  description: string | null;
  is_active: boolean;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  org_id: string;
  bank_account_id: string | null;
  chart_account_id: string | null;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'adjustment';
  amount: number;
  description: string;
  payee: string | null;
  reference_number: string | null;
  transaction_date: string;
  is_reconciled: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  bank_account_name?: string;
  chart_account_name?: string;
  // Computed
  balance?: number;
}
