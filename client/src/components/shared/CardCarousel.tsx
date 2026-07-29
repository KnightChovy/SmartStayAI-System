import { Children } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/cn';

/**
 * Mũi tên điều hướng — nổi hai bên, canh **giữa theo chiều dọc của hàng thẻ**.
 *
 * Bản shadcn gốc đẩy nút ra `-left-12/-right-12` (ngoài khung); ở đây khu nội dung đã sát mép
 * `max-w-7xl` nên ra ngoài là bị cắt ⇒ kéo vào nằm đè mép thẻ, thêm nền đặc + đổ bóng cho đọc
 * được trên ảnh. Luôn hiện; hết đường cuộn thì tự `disabled` + mờ thay vì biến mất, để nút
 * không nhảy ra/nhảy vào làm nội dung xê dịch.
 */
function CarouselControls() {
  const cls = cn(
    // `static` gỡ định vị tuyệt đối mặc định của shadcn (nút gốc nằm ngoài mép trái/phải, ở đây
    // sẽ bị cắt vì nội dung đã sát `max-w-7xl`); vị trí do lớp phủ flex bên dưới lo.
    'static size-10 translate-x-0 translate-y-0 pointer-events-auto',
    'border-outline-variant/40 bg-surface/95 shadow-md backdrop-blur-sm hover:bg-surface',
    // Button của shadcn có sẵn `disabled:pointer-events-none` ⇒ khi hết đường cuộn, cú click
    // XUYÊN QUA nút rơi trúng thẻ phía dưới và mở trang chi tiết. Trả lại pointer-events để
    // nút tự nuốt cú click (disabled nên không có gì xảy ra) thay vì điều hướng ngoài ý muốn.
    'disabled:pointer-events-auto disabled:cursor-not-allowed'
  );
  return (
    // Lớp phủ trùng khít vùng thẻ: canh dọc bằng `items-center` nên mũi tên luôn NGANG GIỮA
    // hàng thẻ, không phụ thuộc `top-1/2` + `translate` theo phần trăm (đang lệch ~62px).
    // `pointer-events-none` ở lớp phủ để phần trống vẫn bấm/kéo được xuống thẻ bên dưới.
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-2">
      <CarouselPrevious className={cls} />
      <CarouselNext className={cls} />
    </div>
  );
}

/** Bề rộng ô trượt mặc định — hợp với thẻ khách sạn/ưu đãi (ảnh lớn + nhiều dòng chữ). */
const DEFAULT_BASIS = 'basis-full sm:basis-1/2 lg:basis-1/4';

interface CardCarouselProps {
  /** Số thẻ thực tế — dùng để căn giữa khi chưa lấp đầy một khung nhìn. */
  count: number;
  /**
   * Số thẻ mỗi khung nhìn, khai bằng class `basis-*` theo breakpoint.
   * Mặc định 1/2/4. Truyền khác khi thẻ nhỏ hơn (vd ô điểm đến) để đỡ phí chỗ trên mobile.
   */
  basisClassName?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Băng thẻ (carousel) 1 / 2 / 4 thẻ mỗi khung nhìn, dùng chung cho các khối
 * "map ra khách sạn" (trang chủ + trang ưu đãi).
 *
 * Khi số thẻ **chưa lấp đầy** một khung nhìn thì không có gì để cuộn: nút điều hướng
 * tự ẩn và các thẻ được **căn giữa** thay vì dồn về trái để trống một mảng lớn.
 */
export default function CardCarousel({
  count,
  basisClassName = DEFAULT_BASIS,
  children,
  className,
}: CardCarouselProps) {
  return (
    <Carousel opts={{ align: 'start', containScroll: 'trimSnaps' }} className={className}>
      <CarouselControls />
      <CarouselContent
        className={cn(
          // Thẻ trong cùng khung cao bằng nhau: `CarouselItem` là flex item được stretch,
          // cho nó `flex` để thẻ con stretch theo — không phụ thuộc `h-full` của từng thẻ.
          'items-stretch',
          count < 2 ? 'sm:justify-center' : 'sm:justify-start',
          count < 4 ? 'lg:justify-center' : 'lg:justify-start'
        )}
      >
        {Children.map(children, child => (
          // Thẻ con phải lấp ĐẦY ô trượt cả ngang lẫn dọc:
          // - `flex` + `*:w-full`: thiếu thì thẻ co theo nội dung ⇒ rộng hẹp không đều, lệch tâm.
          // - `*:h-auto`: các thẻ sẵn có `h-full`, mà `height:100%` làm chúng có chiều cao xác
          //   định nên `align-items: stretch` KHÔNG áp dụng ⇒ thẻ ngắn hơn ô trượt và bị dồn
          //   lên trên (mũi tên canh `top-1/2` sẽ lệch hẳn xuống dưới so với thẻ).
          <CarouselItem className={cn('flex *:h-auto *:w-full', basisClassName)}>
            {child}
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
