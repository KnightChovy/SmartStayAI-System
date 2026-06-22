import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Trạng thái rỗng dùng chung cho mọi danh sách (no bookings, no results, ...). */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/40 bg-surface/50 px-6 py-16 text-center',
        className
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-6" />
      </div>
      <h3 className="font-be-vietnam text-lg font-semibold text-on-surface">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-on-surface-variant">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
