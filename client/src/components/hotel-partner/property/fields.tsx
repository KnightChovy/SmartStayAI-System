import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Class dùng chung cho input/select trong các editor replace-all. */
export const fieldClass =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-role-partner-primary/25';

export function LabeledField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T | '';
  onChange: (value: T | '') => void;
  options: { value: T; label: string }[];
  /** Nhãn cho lựa chọn rỗng; bỏ qua nếu không cho rỗng. */
  emptyLabel?: string;
  className?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  emptyLabel,
  className,
}: SelectFieldProps<T>) {
  return (
    <LabeledField label={label} className={className}>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T | '')}
        className={fieldClass}
      >
        {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </LabeledField>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'number';
  className?: string;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
}: TextFieldProps) {
  return (
    <LabeledField label={label} className={className}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
    </LabeledField>
  );
}
