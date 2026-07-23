import { Fragment } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface Crumb {
  label: string;
  /** Có `to` → là link; mục cuối (trang hiện tại) bỏ trống. */
  to?: string;
}

interface BreadcrumbProps {
  items: Crumb[];
  className?: string;
}

/**
 * Breadcrumb điều hướng phân cấp (SS-702) cho các trang sâu (HotelDetail, RoomDetail):
 * `Trang chủ / Nha Trang / SmartStay Nha Trang Bay / Deluxe Hướng Vịnh`.
 * Các mục dùng `<Link>` nên nút Back của trình duyệt vẫn hoạt động bình thường.
 */
export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-on-surface-variant">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              <li className="flex min-w-0 items-center">
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="max-w-[16rem] truncate rounded transition-colors hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={cn('max-w-[16rem] truncate', isLast && 'font-medium text-on-surface')}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="flex items-center">
                  <ChevronRight className="size-3.5 text-outline" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
