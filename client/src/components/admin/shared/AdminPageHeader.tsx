import { cn } from '@/lib/cn';
import { ROLE_THEME } from '@/constants/roleTheme';
import type { AdminPageHeaderProps } from '@/types/admin.types';

/**
 * Header trang của cổng Admin.
 *
 * Cỡ chữ và bố cục bám đúng khuôn manager/partner (card trắng + ô icon màu theo vai trò +
 * `text-2xl` + mô tả `text-sm`). Trước đây admin dùng `text-2xl sm:text-3xl lg:text-4xl` kèm mô tả
 * `lg:text-lg` và không có card — to hơn hẳn hai cổng kia nên nhìn như một sản phẩm khác.
 */
export function AdminPageHeader({
  title,
  description,
  actions,
  icon: Icon,
}: AdminPageHeaderProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon ? (
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-xl',
                ROLE_THEME.admin.accentSoft
              )}
            >
              <Icon className="size-6" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          </div>
        </div>
        {actions ? (
          <div className="flex items-center gap-2 sm:gap-3">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
