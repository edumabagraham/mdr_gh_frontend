import { ChangeEvent, HTMLInputTypeAttribute } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: HTMLInputTypeAttribute;
  /** First message Laravel returned for this field, if any. */
  error?: string;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  inputMode?: 'numeric' | 'text' | 'email';
  maxLength?: number;
  /** Extra classes on the input itself, for one-off fields like the code box. */
  inputClassName?: string;
}

/**
 * Labelled input with the portal's field styling and its error line.
 *
 * `onChange` hands over the value rather than the event: every caller here
 * wants the string, and a couple of them massage it before storing it.
 */
export default function FormField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  error,
  required = false,
  autoComplete,
  autoFocus = false,
  inputMode,
  maxLength,
  inputClassName = '',
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-brand-red">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        maxLength={maxLength}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-md border bg-field px-3 py-2.5 text-sm text-foreground
                    outline-none transition placeholder:text-muted
                    focus:border-brand-green focus:ring-2 focus:ring-brand-green/20
                    ${error ? 'border-brand-red' : 'border-line'} ${inputClassName}`}
      />
      {error && <p className="mt-1.5 text-sm text-brand-red">{error}</p>}
    </div>
  );
}
