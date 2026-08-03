import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface AppPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Số nút trang hiển thị mỗi bên trang hiện tại. */
  siblingCount?: number;
}

/**
 * Sinh danh sách trang cần render: luôn có trang đầu + cuối, một cửa sổ quanh trang hiện tại,
 * phần bị lược bỏ thay bằng `'…'`.
 *
 * Bắt buộc phải cắt cửa sổ: bản trước render THẲNG mọi trang, nên danh sách 40 trang đẻ ra 40 nút
 * và thanh phân trang tràn ngang — lỗi chỉ lộ khi dữ liệu thật đủ nhiều.
 */
function buildPageItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | '…')[] {
  const maxSlots = siblingCount * 2 + 5;
  if (totalPages <= maxSlots) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const left = Math.max(2, currentPage - siblingCount);
  const right = Math.min(totalPages - 1, currentPage + siblingCount);

  const items: (number | '…')[] = [1];
  if (left > 2) items.push('…');
  for (let page = left; page <= right; page += 1) items.push(page);
  if (right < totalPages - 1) items.push('…');
  items.push(totalPages);

  return items;
}

/** Thanh phân trang dùng chung cho mọi cổng nội bộ (admin / manager / partner / staff). */
export default function AppPagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: AppPaginationProps) {
  if (totalPages <= 1) return null;

  const items = buildPageItems(currentPage, totalPages, siblingCount);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-disabled={currentPage <= 1}
            className={
              currentPage <= 1
                ? 'pointer-events-none opacity-50'
                : 'cursor-pointer'
            }
            onClick={e => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
          />
        </PaginationItem>

        {items.map((item, index) =>
          item === '…' ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                className="cursor-pointer"
                isActive={item === currentPage}
                onClick={e => {
                  e.preventDefault();
                  onPageChange(item);
                }}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            aria-disabled={currentPage >= totalPages}
            className={
              currentPage >= totalPages
                ? 'pointer-events-none opacity-50'
                : 'cursor-pointer'
            }
            onClick={e => {
              e.preventDefault();
              if (currentPage < totalPages) onPageChange(currentPage + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
