import { ChangeEvent, useRef } from 'react';
import { DateParts } from '@/lib/dates';

interface DateFieldProps {
  id: string;
  label: string;
  value: DateParts;
  onChange: (value: DateParts) => void;
  error?: string;
  required?: boolean;
  hint?: string;
}

const BOXES = [
  { key: 'day' as const, label: 'Day', placeholder: 'DD', length: 2, width: 'w-16' },
  { key: 'month' as const, label: 'Month', placeholder: 'MM', length: 2, width: 'w-16' },
  { key: 'year' as const, label: 'Year', placeholder: 'YYYY', length: 4, width: 'w-24' },
];

/**
 * Day, month and year as three separate boxes, in that order.
 *
 * Deliberately not `<input type="date">`: that renders in the browser's locale,
 * which on a machine left at a US default shows `mm/dd/yyyy`. Two clinic
 * machines disagreeing about the order puts transposed dates into the registry
 * with nothing downstream able to detect them. Three labelled boxes are read
 * the same way on every machine.
 */
export default function DateField({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  hint,
}: DateFieldProps) {
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  const handle = (key: keyof DateParts, length: number, next: string) => {
    const digits = next.replace(/\D/g, '').slice(0, length);
    onChange({ ...value, [key]: digits });

    // Filling a box moves to the next one, so the whole date is typed as one
    // run of digits without reaching for the mouse.
    if (digits.length === length) {
      const order = BOXES.map((box) => box.key);
      const following = order[order.indexOf(key) + 1];
      if (following) refs.current[following]?.focus();
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-brand-red">*</span>}
      </span>

      <div className="flex items-end gap-2" role="group" aria-labelledby={`${id}-label`}>
        {BOXES.map((box) => (
          <div key={box.key}>
            <label
              htmlFor={`${id}_${box.key}`}
              className="mb-1 block text-[11px] uppercase tracking-wide text-muted"
            >
              {box.label}
            </label>
            <input
              id={`${id}_${box.key}`}
              name={`${id}_${box.key}`}
              ref={(element) => {
                refs.current[box.key] = element;
              }}
              inputMode="numeric"
              autoComplete="off"
              placeholder={box.placeholder}
              maxLength={box.length}
              value={value[box.key]}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handle(box.key, box.length, event.target.value)
              }
              aria-invalid={error ? true : undefined}
              className={`${box.width} rounded-md border bg-field px-3 py-2.5 text-center text-sm
                          tabular-nums text-foreground outline-none transition placeholder:text-muted
                          focus:border-brand-green focus:ring-2 focus:ring-brand-green/20
                          ${error ? 'border-brand-red' : 'border-line'}`}
            />
          </div>
        ))}
      </div>

      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-brand-red">{error}</p>}
    </div>
  );
}
