import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';

export function Field({
  label,
  icon,
  error,
  required,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        {icon}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-error text-xs font-semibold ml-1">{error}</p>
      )}
    </div>
  );
}

/** Nút hiện/ẩn mật khẩu đặt bên trong input. */
export function PwToggle({
  shown,
  onClick,
}: {
  shown: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={shown ? 'Hide password' : 'Show password'}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface cursor-pointer"
    >
      {shown ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </button>
  );
}

/** Nút quay lại step trước. */
export function StepBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface mb-6 cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );
}

/** Class dùng chung cho input của form partner-signup. */
export const partnerFieldClass =
  'h-12 border-slate-200 placeholder:text-slate-400 focus:border-role-partner-primary focus-visible:ring-role-partner-primary/20';
