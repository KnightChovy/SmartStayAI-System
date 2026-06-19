import { Loader2, AlertCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';

export function LoadingState({ label = 'Loading...', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-slate-400', className)}>
      <Loader2 className="w-8 h-8 animate-spin text-role-partner-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({
  label = 'Something went wrong. Please try again.',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-slate-400', className)}>
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 px-6 text-center',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-role-partner-light flex items-center justify-center">
        <Icon className="w-7 h-7 text-role-partner-primary" />
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800">{title}</p>
        {description && <p className="text-sm text-slate-500 mt-1 max-w-md">{description}</p>}
      </div>
      {action}
    </div>
  );
}
