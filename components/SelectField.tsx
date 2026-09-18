import { ChangeEvent } from 'react';

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  /** Shown as the first, unselected option. */
  placeholder?: string;
}

/** A select styled to match {@see FormField}, so mixed forms read as one form. */
export default function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
  required = false,
  placeholder,
}: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-brand-red">*</span>}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-md border bg-field px-3 py-2.5 text-sm text-foreground outline-none
                    transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20
                    ${error ? 'border-brand-red' : 'border-line'}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-sm text-brand-red">{error}</p>}
    </div>
  );
}
