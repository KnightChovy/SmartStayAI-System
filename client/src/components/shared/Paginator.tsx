import { useTranslation } from 'react-i18next';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginatorProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** href mỗi trang (để mở tab mới / a11y); onClick vẫn xử lý điều hướng SPA. */
  hrefForPage?: (page: number) => string;
  className?: string;
}

/** Danh sách trang có ellipsis: đầu, cuối, và cửa sổ quanh trang hiện tại. */
function pageItems(current: number, total: number): (number | 'gap-l' | 'gap-r')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | 'gap-l' | 'gap-r')[] = [1];
  if (current > 3) items.push('gap-l');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) items.push(i);
  if (current < total - 2) items.push('gap-r');
  items.push(total);
  return items;
}

/** Pagination có số trang + ellipsis (dùng chung). Tự ẩn khi chỉ 1 trang. */
export default function Paginator({
  page,
  totalPages,
  onPageChange,
  hrefForPage,
  className,
}: PaginatorProps) {
  const { t } = useTranslation('common');
  if (totalPages <= 1) return null;

  const href = (p: number) => hrefForPage?.(p) ?? '#';
  const go = (p: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (p >= 1 && p <= totalPages && p !== page) onPageChange(p);
  };

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            text={t('previous')}
            href={href(page - 1)}
            onClick={go(page - 1)}
            aria-disabled={page <= 1}
            className={page <= 1 ? 'pointer-events-none opacity-40' : undefined}
          />
        </PaginationItem>

        {pageItems(page, totalPages).map((it, i) =>
          typeof it === 'number' ? (
            <PaginationItem key={it}>
              <PaginationLink href={href(it)} isActive={it === page} onClick={go(it)}>
                {it}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={`${it}-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            text={t('next')}
            href={href(page + 1)}
            onClick={go(page + 1)}
            aria-disabled={page >= totalPages}
            className={page >= totalPages ? 'pointer-events-none opacity-40' : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
