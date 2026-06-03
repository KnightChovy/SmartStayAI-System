import type { AdminPageHeaderProps } from '@/types/admin.types';

export function AdminPageHeader({
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2 sm:text-base lg:text-lg">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex items-center gap-2 sm:gap-3">{actions}</div>
      ) : null}
    </div>
  );
}
