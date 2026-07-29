import { cn } from '@/lib/cn';

interface CardGridProps {
  /** Số thẻ thực tế đang render — quyết định căn giữa hay căn trái. */
  count: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Lưới thẻ 1 / 2 / 4 cột dùng chung cho các khối "map ra khách sạn".
 *
 * Luật căn lề: **căn giữa khi số thẻ chưa lấp đầy một hàng** ở breakpoint đó,
 * còn lấp đầy rồi thì căn trái như lưới bình thường. Nhờ vậy 2–3 thẻ nằm giữa
 * thay vì dồn về trái để trống một mảng lớn, nhưng 5 thẻ vẫn là 4 trên + 1 dưới
 * **sát mép trái** (đúng kỳ vọng đọc theo hàng, không phải 1 thẻ lơ lửng giữa).
 *
 * Dùng flex chứ không dùng `grid`: CSS grid không cho căn giữa một hàng thiếu
 * mà vẫn giữ nguyên bề rộng thẻ — track luôn kéo full. Bề rộng thẻ vì thế phải
 * tính tay cho khớp `gap-6` (24px): 2 cột → 50% − 12px, 4 cột → 25% − 18px.
 */
export default function CardGrid({ count, children, className }: CardGridProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-stretch gap-6',
        '*:w-full sm:*:w-[calc(50%-0.75rem)] lg:*:w-[calc(25%-1.125rem)]',
        // Ép `h-auto` đè lên `h-full` sẵn có trong các thẻ: `height:100%` làm flex item
        // có chiều cao xác định nên `align-items: stretch` KHÔNG áp dụng ⇒ thẻ có thêm
        // dòng (vd countdown flash sale) sẽ cao hơn thẻ cùng hàng. Ở `grid` cũ không lộ
        // vì chiều cao track là xác định nên `h-full` vẫn ra đúng.
        '*:h-auto',
        count < 2 ? 'sm:justify-center' : 'sm:justify-start',
        count < 4 ? 'lg:justify-center' : 'lg:justify-start',
        className
      )}
    >
      {children}
    </div>
  );
}
