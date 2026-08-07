import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoomTypes } from '@/hooks/hotels';
import { staffService } from '@/services/staff.service';
import type { HotelBooking, InventoryCalendar } from '@/types/staff.types';
import { buildInventoryGrid, shiftDateKey } from '@/utils/inventoryCalendar';
import { staffKeys } from './keys';
import { STAFF_LIVE } from './live';
import { useHotelRooms } from './use-hotel-rooms';
import { useRoomBlocks } from './use-room-blocks';

/**
 * Số đêm dài nhất một booking được phép có (`MAX_NIGHTS` ở BE). Dùng để lùi mốc `fromDate` khi tải
 * booking — xem ghi chú ở `fetchBookingsCovering`.
 */
const MAX_BOOKING_NIGHTS = 30;

/** Trần số trang tải về (100 booking/trang). Chạm trần thì báo ra, không cắt trong im lặng. */
const MAX_PAGES = 20;

/**
 * Tải MỌI booking có thể phủ lên khoảng `from..to`.
 *
 * ⚠️ Bẫy: `GET /hotels/:id/bookings?fromDate&toDate` lọc theo **`checkInDate`**, KHÔNG theo khoảng
 * lưu trú. Một đơn nhận phòng 03/08 trả 10/08 sẽ **không** xuất hiện khi lọc từ 06/08, dù nó vẫn
 * chiếm phòng các đêm 06→09/08. Vì vậy phải lùi `fromDate` đi đúng `MAX_NIGHTS` ngày — dài hơn mọi
 * kỳ ở hợp lệ nên không thể sót đơn nào.
 *
 * Không lọc `status`: Joi chỉ nhận MỘT giá trị nên lọc ở server sẽ phải gọi nhiều lượt; lọc ở client
 * bằng `occupiesInventory` vừa rẻ vừa gom đủ luật vào một chỗ.
 */
async function fetchBookingsCovering(
  hotelId: string,
  from: string,
  to: string
): Promise<{ bookings: HotelBooking[]; truncated: boolean }> {
  const fromDate = shiftDateKey(from, -MAX_BOOKING_NIGHTS);
  const bookings: HotelBooking[] = [];
  let page = 1;
  let pages = 1;

  // Tuần tự chứ không song song: chỉ sau trang đầu mới biết có bao nhiêu trang.
  while (page <= pages && page <= MAX_PAGES) {
    const result = await staffService.listBookings(hotelId, {
      fromDate,
      toDate: to,
      limit: 100,
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
   * Mặc định `false`: lưới tồn kho giờ chạy bằng một request duy nhất, còn phần này tốn tới 20
   * request phân trang booking — chỉ tải khi staff thực sự mở bản đồ phòng.
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
