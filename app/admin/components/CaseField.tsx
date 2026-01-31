export interface CaseInfoFields {
  defendant_first: string;
  defendant_last: string;
  defendant_phone: string;
  defendant_email: string;
  defendant_dob: string;
  defendant_address: string;
  defendant_city: string;
  defendant_state: string;
  defendant_zip: string;
  defendant_ssn_last4: string;
  defendant_dl_number: string;
  employer_name: string;
  employer_phone: string;
  bond_amount: string;
  charge_description: string;
  court_name: string;
  court_date: string;
  case_number: string;
  jail_location: string;
  county: string;
  bond_date: string;
  car_make: string;
  car_model: string;
  car_year: string;
  car_color: string;
}

export const EMPTY_CASE_INFO: CaseInfoFields = {
  defendant_first: '',
  defendant_last: '',
  defendant_phone: '',
  defendant_email: '',
  defendant_dob: '',
  defendant_address: '',
  defendant_city: '',
  defendant_state: '',
  defendant_zip: '',
  defendant_ssn_last4: '',
  defendant_dl_number: '',
  employer_name: '',
  employer_phone: '',
  bond_amount: '',
  charge_description: '',
  court_name: '',
  court_date: '',
  case_number: '',
  jail_location: '',
  county: '',
  bond_date: '',
  car_make: '',
  car_model: '',
  car_year: '',
  car_color: '',
};

export default function CaseField({
  label,
  value,
  field,
  onChange,
  onBlur,
  disabled,
  type = 'text',
  placeholder,
  statusDot,
}: {
  label: string;
  value: string;
  field: keyof CaseInfoFields;
  onChange: (key: keyof CaseInfoFields, val: string) => void;
  onBlur: (key: keyof CaseInfoFields) => void;
  disabled: boolean;
  type?: string;
  placeholder?: string;
  statusDot?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <div className={statusDot ? 'relative' : undefined}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          onBlur={() => onBlur(field)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4af37] disabled:opacity-50"
        />
        {statusDot}
      </div>
    </div>
  );
}
