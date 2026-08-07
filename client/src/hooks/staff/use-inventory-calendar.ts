import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoomTypes } from '@/hooks/hotels';
import { staffService } from '@/services/staff.service';
import type { BookingStatus, HotelBooking, InventoryCalendar } from '@/types/staff.types';
import { buildInventoryGrid } from '@/utils/inventoryCalendar';
import { staffKeys } from './keys';
import { STAFF_LIVE } from './live';
import { useHotelRooms } from './use-hotel-rooms';
import { useRoomBlocks } from './use-room-blocks';

/** Số booking lấy mỗi trang — trần của endpoint này (các endpoint giám sát khác vẫn 100). */
const PAGE_SIZE = 500;

/** Trần số trang. Chạm trần thì báo ra, không cắt trong im lặng. */
const MAX_PAGES = 10;

/**
 * Đơn ở các trạng thái này **có thể** đang chiếm phòng ⇒ chỉ cần tải bấy nhiêu.
 * `cancelled` / `no_show` / `checked_out` đã nhả phòng (xem `RELEASED_STATUSES` ở
 * `utils/inventoryCalendar`), kéo về chỉ để lọc bỏ là phí băng thông.
 */
const OCCUPYING_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'checked_in'];

/**
 * Tải mọi booking phủ lên khoảng `from..to`.
 *
 * Trước đây chỗ này phải **lùi `fromDate` 30 ngày** rồi lặp tới 20 trang: `fromDate`/`toDate` khi
 * ấy lọc theo **ngày nhận phòng**, nên đơn nhận 30/07 trả 09/08 không hiện khi xem từ 06/08 dù vẫn
 * chiếm phòng; và `status` chỉ nhận một giá trị nên không lọc được ở server. BE đã nới cả ba
 * (lọc theo khoảng lưu trú · `status` nhận mảng · `limit` 500) nên giờ hỏi đúng thứ cần.
 *
 * Vẫn lọc lại bằng `occupiesInventory` ở client cho một ca server không diễn đạt được: đơn
 * `pending` **đã quá hạn giữ chỗ** — cron sẽ huỷ, chỉ là chưa chạy tới.
 */
async function fetchBookingsCovering(
  hotelId: string,
  from: string,
  to: string
): Promise<{ bookings: HotelBooking[]; truncated: boolean }> {
  const bookings: HotelBooking[] = [];
  let page = 1;
  let pages = 1;

  // Tuần tự chứ không song song: chỉ sau trang đầu mới biết có bao nhiêu trang.
  while (page <= pages && page <= MAX_PAGES) {
    const result = await staffService.listBookings(hotelId, {
      status: OCCUPYING_STATUSES,
      fromDate: from,
      toDate: to,
      limit: PAGE_SIZE,
      page,
    });
    bookings.push(...result.results);
    pages = result.totalPages;
    page += 1;
  }

  return { bookings, truncated: pages > MAX_PAGES };
}

interface InventoryCalendarOptions {
  /**
   * Có tải thêm nguồn thô cho **bản đồ phòng của một ngày** hay không.
   *
   * Mặc định `false`: lưới tồn kho chạy bằng đúng **một** request, còn phần này cần thêm 3 nguồn
   * (phòng · đợt chặn · booking) — chỉ tải khi staff thực sự mở bản đồ phòng của một ngày.
   */
  withRoomDetail?: boolean;
}

/**
 * Lịch tồn kho theo ngày cho một khách sạn.
 *
 * **Lưới** đọc thẳng `GET /hotels/:hotelId/inventory/calendar` — nguồn duy nhất, cùng bảng
 * `room_availability` mà khách thấy lúc đặt phòng. (Bản trước tự ghép rooms + blocks + bookings ở
 * client và nhân bản công thức của BE, nên lệch ngay khi đối tác chỉnh tay `totalRooms`.)
 *
 * **Bản đồ phòng của một ngày** thì endpoint trên không nói được — nó chỉ trả con số tổng, không có
 * phòng nào đang bị chặn hay ai đang ở phòng nào — nên vẫn cần 3 nguồn thô, và chỉ tải khi cần.
 */
export function useInventoryCalendar(
  hotelId: string | undefined,
  from: string,
  to: string,
  { withRoomDetail = false }: InventoryCalendarOptions = {}
) {
  // Tự làm mới: khách đặt phòng trên web/app KHÔNG chạy mutation nào ở máy lễ tân nên không có gì
  // invalidate cache — thiếu chỗ này thì lịch đứng im cho tới khi F5. Xem `live.ts`.
  const calendarQuery = useQuery({
    queryKey: staffKeys.inventory(hotelId ?? '', from, to),
    queryFn: () => staffService.getInventoryCalendar(hotelId as string, from, to),
    enabled: Boolean(hotelId && from && to),
    ...STAFF_LIVE,
  });

  // Chỉ để xếp hàng theo phân khúc giá — endpoint lịch không trả giá.
  // KHÔNG truyền ngày: có ngày là BE tính luôn tồn kho + giá cả kỳ, ở đây chỉ cần giá gốc.
  const roomTypesQuery = useRoomTypes(hotelId ?? '');

  const detailEnabled = Boolean(hotelId) && withRoomDetail;
  const roomsQuery = useHotelRooms(detailEnabled ? hotelId : undefined, {}, STAFF_LIVE);
  const blocksQuery = useRoomBlocks(detailEnabled ? hotelId : undefined, false, STAFF_LIVE);
  const bookingsQuery = useQuery({
    queryKey: staffKeys.inventoryBookings(hotelId ?? '', from, to),
    queryFn: () => fetchBookingsCovering(hotelId as string, from, to),
    enabled: detailEnabled && Boolean(from && to),
    ...STAFF_LIVE,
  });

  // `basePrice` là Decimal serialize thành chuỗi ⇒ ép số một lần ở đây, bỏ qua giá trị không parse được.
  const basePriceByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const roomType of roomTypesQuery.data ?? []) {
      const price = Number(roomType.basePrice);
      if (!Number.isNaN(price)) map.set(roomType.id, price);
    }
    return map;
  }, [roomTypesQuery.data]);

  const response = calendarQuery.data;
  const data: InventoryCalendar | undefined = useMemo(
    () => (response ? buildInventoryGrid({ response, basePriceByType, from, to }) : undefined),
    [response, basePriceByType, from, to]
  );

  const bookingResult = bookingsQuery.data;

  return {
    data,
    // Giá chỉ ảnh hưởng THỨ TỰ hàng, không phải con số ⇒ không chặn lịch hiện vì nó.
    isLoading: calendarQuery.isLoading,
    isFetching: calendarQuery.isFetching || roomTypesQuery.isFetching,
    isError: calendarQuery.isError,
    error: calendarQuery.error,

    // ----- Nguồn thô cho bản đồ phòng của một ngày (chỉ có khi `withRoomDetail`) -----
    rooms: roomsQuery.data,
    blocks: blocksQuery.data,
    bookings: bookingResult?.bookings,
    /** Booking bị cắt vì chạm trần phân trang ⇒ bản đồ phòng có thể thiếu đơn. */
    bookingsTruncated: bookingResult?.truncated ?? false,
    detailLoading:
      detailEnabled &&
      (roomsQuery.isLoading || blocksQuery.isLoading || bookingsQuery.isLoading),
    detailError: roomsQuery.isError || blocksQuery.isError || bookingsQuery.isError,
    detailErrorObject: roomsQuery.error ?? blocksQuery.error ?? bookingsQuery.error,
  };
}
