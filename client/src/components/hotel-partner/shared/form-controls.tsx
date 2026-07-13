import { useFormContext, Controller, type FieldValues, type Path } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/cn';

// ─── Shell ────────────────────────────────────────────────────────────────────

interface FieldShellProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function FieldShell({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Text / number input ──────────────────────────────────────────────────────

interface TextFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: 'text' | 'number' | 'date' | 'email' | 'password' | 'tel';
  placeholder?: string;
  required?: boolean;
  hint?: string;
  step?: string;
  /** Ràng buộc số cho input `type="number"` (chặn spinner/gõ ngoài khoảng). */
  min?: number | string;
  max?: number | string;
  className?: string;
}

export function TextField<T extends FieldValues>({
  name,
  label,
  type = 'text',
  placeholder,
  required,
  hint,
  step,
  min,
  max,
  className,
}: TextFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;
  return (
    <FieldShell label={label} htmlFor={name} required={required} error={error} hint={hint} className={className}>
      <Input
        id={name}
        type={type}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        aria-invalid={!!error}
        {...register(name)}
      />
    </FieldShell>
  );
}

// ─── Date (shadcn DatePicker + RHF) ─────────────────────────────────────────────

interface DateFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  required?: boolean;
  hint?: string;
  /** Chặn chọn trước ngày này (YYYY-MM-DD). */
  min?: string | null;
  /** Chặn chọn sau ngày này (YYYY-MM-DD). */
  max?: string | null;
  placeholder?: string;
  className?: string;
}

export function DateField<T extends FieldValues>({
  name,
  label,
  required,
  hint,
  min,
  max,
  placeholder,
  className,
}: DateFieldProps<T>) {
  const {
    control,
    formState: { errors },
  } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;
  return (
    <FieldShell label={label} htmlFor={name} required={required} error={error} hint={hint} className={className}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <DatePicker
            id={name}
            value={field.value}
            onChange={field.onChange}
            min={min}
            max={max}
            placeholder={placeholder}
            ariaInvalid={!!error}
          />
        )}
      />
    </FieldShell>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  placeholder?: string;
  rows?: number;
  hint?: string;
}

export function TextareaField<T extends FieldValues>({
  name,
  label,
  placeholder,
  rows = 3,
  hint,
}: TextareaFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;
  return (
    <FieldShell label={label} htmlFor={name} error={error} hint={hint}>
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          'w-full text-sm rounded-lg border border-input bg-transparent px-2.5 py-2 transition-colors outline-none resize-none',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          error && 'border-destructive'
        )}
        {...register(name)}
      />
    </FieldShell>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

export function SelectField<T extends FieldValues>({
  name,
  label,
  options,
  placeholder = 'Select...',
  required,
  hint,
}: SelectFieldProps<T>) {
  const {
    control,
    formState: { errors },
  } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;
  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value || ''} onValueChange={field.onChange}>
            <SelectTrigger className="w-full h-9" aria-invalid={!!error}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </FieldShell>
  );
}

// ─── Toggle (boolean) ─────────────────────────────────────────────────────────

interface ToggleFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  description?: string;
}

export function ToggleField<T extends FieldValues>({
  name,
  label,
  description,
}: ToggleFieldProps<T>) {
  const { control } = useFormContext<T>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5">
          <div>
            <p className="text-sm font-medium text-slate-700">{label}</p>
            {description && <p className="text-xs text-slate-400">{description}</p>}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!!field.value}
            onClick={() => field.onChange(!field.value)}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
              field.value ? 'bg-role-partner-primary' : 'bg-slate-300'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                field.value ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      )}
    />
  );
}
