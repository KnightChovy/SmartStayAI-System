import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoomTypes } from '@/hooks/hotels';
import { staffService } from '@/services/staff.service';
import type { HotelBooking, InventoryCalendar } from '@/types/staff.types';
import { buildInventoryCalendar, shiftDateKey } from '@/utils/inventoryCalendar';
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

/**
 * Lịch tồn kho theo ngày cho một khách sạn — hook TỔNG HỢP, không phải một endpoint.
 *
 * BE chưa có endpoint trả tồn kho theo từng ngày, nên ghép từ ba nguồn sẵn có:
 * phòng (`useHotelRooms`) + đợt chặn (`useRoomBlocks`) + booking. Toàn bộ phép tính nằm trong
 * `utils/inventoryCalendar.ts` để đối chiếu được với công thức của BE.
 */
export function useInventoryCalendar(
  hotelId: string | undefined,
  from: string,
  to: string
) {
  // Tự làm mới: khách đặt phòng trên web/app KHÔNG chạy mutation nào ở máy lễ tân nên không có gì
  // invalidate cache — thiếu chỗ này thì lịch đứng im cho tới khi F5. Xem `live.ts`.
  const roomsQuery = useHotelRooms(hotelId, {}, STAFF_LIVE);
  const blocksQuery = useRoomBlocks(hotelId, false, STAFF_LIVE);
  // Chỉ để xếp hàng theo phân khúc giá — danh sách phòng của staff không kèm `basePrice`.
  // KHÔNG truyền ngày: có ngày là BE tính luôn tồn kho + giá cả kỳ, ở đây chỉ cần giá gốc.
  const roomTypesQuery = useRoomTypes(hotelId ?? '');

  const bookingsQuery = useQuery({
    queryKey: staffKeys.inventory(hotelId ?? '', from, to),
    queryFn: () => fetchBookingsCovering(hotelId as string, from, to),
    enabled: Boolean(hotelId && from && to),
    // Nguồn đổi nhiều nhất — đơn mới của khách rơi vào đây.
    ...STAFF_LIVE,
  });

  const rooms = roomsQuery.data;
  const blocks = blocksQuery.data;
  const bookingResult = bookingsQuery.data;

  // `basePrice` là Decimal serialize thành chuỗi ⇒ ép số một lần ở đây, bỏ qua giá trị không parse được.
  const basePriceByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const roomType of roomTypesQuery.data ?? []) {
      const price = Number(roomType.basePrice);
      if (!Number.isNaN(price)) map.set(roomType.id, price);
    }
    return map;
  }, [roomTypesQuery.data]);

  const data: InventoryCalendar | undefined =
    rooms && blocks && bookingResult
      ? buildInventoryCalendar({
          rooms,
          blocks,
          bookings: bookingResult.bookings,
          basePriceByType,
          from,
          to,
          truncated: bookingResult.truncated,
        })
      : undefined;

  return {
    data,
    // Giá chỉ ảnh hưởng THỨ TỰ hàng, không phải con số ⇒ không chặn lịch hiện vì nó.
    isLoading: roomsQuery.isLoading || blocksQuery.isLoading || bookingsQuery.isLoading,
    isFetching:
      roomsQuery.isFetching ||
      blocksQuery.isFetching ||
      bookingsQuery.isFetching ||
      roomTypesQuery.isFetching,
    isError: roomsQuery.isError || blocksQuery.isError || bookingsQuery.isError,
    error: roomsQuery.error ?? blocksQuery.error ?? bookingsQuery.error,
  };
}
