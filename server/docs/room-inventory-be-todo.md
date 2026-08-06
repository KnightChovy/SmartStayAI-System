# BE TODO — Trạng thái phòng & tồn kho theo ngày

> Ghi lại trong lúc làm màn **Staff · Rooms & inventory** (gộp Room map vào lịch tồn kho, đổi tình
> trạng phòng theo từng ngày). Mọi mục dưới đây đều đã **kiểm chứng trên deploy**
> (`https://smartstayai-system.onrender.com/v1`) hoặc trong mã nguồn, không phải suy đoán.
>
> **Phạm vi**: chỉ nêu việc của BE. Phần FE đã tự xử lý xong và **không chờ** các mục này — nhưng
> mỗi mục đều ghi rõ FE đang phải "chữa cháy" như thế nào, để khi BE làm xong thì gỡ bỏ đúng chỗ.
>
> ⚠️ **Bản vá ở mục 1 đã được revert khỏi repo theo yêu cầu** — file `room.controller.ts` hiện
> nguyên trạng. Nội dung bản vá giữ trong tài liệu này để BE tự áp dụng.

---

## 1. 🔴 `POST /hotels/:hotelId/rooms/:roomId/blocks?dryRun=true` KHÔNG xem trước mà CHẶN PHÒNG THẬT

**Mức độ**: nghiêm trọng — đây là endpoint được thiết kế để "không ghi gì", nhưng thực tế mỗi lần
gọi là tạo một đợt chặn thật, rút một phòng khỏi kho bán.

### Nguyên nhân

`middlewares/validate.ts` kết thúc bằng `Object.assign(req, value)` — tức `req.query` **bị thay
bằng bản Joi đã convert**. Joi khai `dryRun: Joi.boolean()` nên tới controller nó đã là **boolean
`true`**, trong khi `room.controller.createBlock` so với **chuỗi**:

```ts
if (req.query.dryRun === 'true') {   // ❌ không bao giờ đúng
```

Nhánh xem trước vì thế **chưa từng chạy** kể từ ngày viết.

### Bằng chứng (chạy thật trên deploy)

```bash
# Gọi "xem trước" — response lại có cả object `block` (tức là đã ghi vào DB)
POST /hotels/{hotelId}/rooms/{roomId}/blocks?dryRun=true
{"blockType":"ooo","startDate":"2026-10-05","endDate":"2026-10-05","reason":"Preview"}
→ 200 {"block":{"id":"e77721e6-…","resolvedAt":null,…},"affectedBookings":[],"shortageNights":[]}

# Gọi thật ngay sau đó → bị chính đợt chặn "xem trước" chặn lại
POST /hotels/{hotelId}/rooms/{roomId}/blocks   (không có dryRun)
→ 400 "Phòng đã có đợt chặn 2026-10-05 → 2026-10-05 trùng khoảng này — gỡ hoặc sửa đợt đó trước"
```

Đợt chặn tạo nhầm khi kiểm chứng **đã được gỡ** (`DELETE .../blocks/e77721e6-…`), DB deploy về
nguyên trạng 2 đợt chặn mở như trước.

### Bản vá đề xuất

`server/src/controllers/room.controller.ts`, trong `createBlock`:

```ts
// ⚠️ So sánh với CẢ boolean: `validate` chạy `Object.assign(req, value)` nên `req.query` đã bị
// thay bằng bản Joi đã convert — `dryRun` tới đây là boolean `true`, không còn là chuỗi 'true'.
const dryRun: unknown = req.query.dryRun;
if (dryRun === true || dryRun === 'true') {
  const preview = await roomBlockService.previewBlock(hotelId, roomId, req.user as User, req.body);
  res.send(preview);
  return;
}
```

Đã thử: `tsc` không phát sinh lỗi mới (80 lỗi pre-existing do Prisma client local chưa generate,
y hệt trước khi sửa).

### Nên rà thêm

Cùng một cạm bẫy có thể còn ở các controller khác đọc `req.query.<boolean>` bằng so sánh chuỗi.
Grep gợi ý: `req.query.` + `=== 'true'`.

### FE hiện đang làm gì

**Không gọi `dryRun`.** Panel "xem trước hậu quả" trong modal chặn phòng được tính **tại client**
(`utils/inventoryCalendar.ts → previewRoomBlockLocally`), mirror `computeShortage` của BE. Đã đối
chiếu với chính BE trên dữ liệu thật: **17/17 khớp** (gồm ca chặn phòng đang có khách → BE trả 1 đơn
cần xếp lại, FE ra y hệt). Sau khi BE vá xong, có thể chuyển FE về gọi `dryRun` để lấy số chính xác
từ `room_availability`.

---

## 2. 🔴 Không có API gán phòng TRƯỚC check-in

**Hiện trạng**: `bookingRoom` chỉ được tạo trong `bookingService.checkIn`. Không có endpoint nào cho
lễ tân chốt phòng vật lý cho một đơn đã xác nhận nhưng chưa tới.

**Hệ quả**: một đơn `confirmed` cho đêm nay **chiếm một suất trong kho** nhưng **không gắn với phòng
nào**. Trên bản đồ phòng, 10 phòng đều hiện trống trong khi thực tế chỉ 9 phòng phát ra được — lễ
tân dễ hứa nhầm với khách vãng lai.

**FE đang chữa cháy**: tự xếp tạm đơn vào một phòng trống cùng loại (`applyProvisionalHolds`), ô đó
chuyển sang nhãn **Held** (viền đứt) và rời khỏi nhóm `Available`. Chọn theo số phòng tăng dần +
thứ tự đơn cố định để ổn định giữa các lần tải. **Đây là phỏng đoán của FE** nên UI phải ghi rõ
_"do not quote it to the guest yet"_ — phòng thật vẫn do `checkIn` chọn.

**Đề xuất**:

```
POST   /hotels/:hotelId/bookings/:bookingId/assign-room   { roomId }
DELETE /hotels/:hotelId/bookings/:bookingId/assign-room
```

- Kiểm phòng đúng loại, `isActive`, không dính block, không trùng đơn khác trong khoảng lưu trú.
- Ghi có điều kiện như `checkIn` đang làm (`where: { id, status: 'available' }`) để hai lễ tân gán
  cùng lúc không đụng nhau.
- `checkIn` nếu đã có phòng gán trước thì dùng luôn, không chọn lại.

Có endpoint này thì FE gỡ `applyProvisionalHolds` và đọc thẳng `bookingRooms` — hết phỏng đoán.

---

## 3. 🟠 `PATCH /rooms/:roomId/status` không có chiều thời gian (lối vào cũ của Room map)

**Hiện trạng** (`room.service.ts`):

- `status = 'maintenance'` → `blockForLegacyMaintenance` tạo đợt chặn OOO **cứng 7 ngày** kể từ hôm
  nay, lý do bịa sẵn `"Chặn nhanh từ Room map — chưa nhập ngày dự kiến xong"`.
- `status = 'available'` → **gỡ SẠCH mọi đợt chặn còn hiệu lực** của phòng, kể cả đợt tuần sau do
  người khác đặt lịch.

**Hệ quả**: đây chính là bug người dùng báo — "đổi trạng thái là đổi cho mọi ngày". Dữ liệu deploy
còn nguyên vết: 2 phòng của KS Đà Nẵng đang bị chặn `06/08 → 13/08` với đúng lý do bịa ở trên.

**FE đã làm**: cổng staff **bỏ hẳn** endpoint này (xoá `useUpdateRoomStatus` +
`staffService.updateRoomStatus`), chuyển sang `POST .../blocks` cho việc chặn theo ngày và
`PATCH .../housekeeping` cho trạng thái dọn.

**⚠️ Còn một cửa chưa bịt**: `POST /hotels/:id/rooms` và `PUT /hotels/:id/rooms/:roomId` vẫn nhận
`status: 'maintenance'` và cũng đẻ ra đợt chặn 7 ngày (`room.service.ts:88` và `:237`) — form
tạo/sửa phòng của **partner** vẫn đang dùng.

**Đề xuất**: đánh dấu `@deprecated` cho `PATCH .../status`, bỏ `maintenance` khỏi `status` được nhận
ở create/update room, và nếu muốn giữ tương thích thì trả 400 kèm hướng dẫn dùng `POST .../blocks`.

---

## 4. 🟠 Nhãn `rooms.status` không tự cập nhật theo ngày (không có cron)

**Hiện trạng**: `deriveRoomStatus` chỉ được ghi lại qua `syncDisplayStatus`, và hàm này chỉ chạy
trong 3 tình huống: đổi housekeeping, tạo block, gỡ block. `getActiveBlocksToday` cũng chỉ tra đợt
chặn **của hôm nay**. Danh sách cron hiện có (`config/scheduler.ts`) không có job nào rà lại trạng
thái phòng: `release-holds`, `sweep-no-shows`, `settle-commissions`, `auto-approve-refunds`,
`credit-wallet-refunds`, `remind-commission-expiry`.

**Hệ quả**: đặt đợt chặn cho ngày mai thì **sang ngày mai `rooms.status` vẫn là `available`** cho
tới khi có ai đó tình cờ đụng vào phòng đó. Mọi màn hình đọc `rooms.status` (kể cả bộ lọc phòng khi
check-in) sẽ thấy sai.

**FE không dính**: bản đồ phòng theo ngày đọc thẳng `room_blocks` chứ không đọc `rooms.status`.

**Đề xuất**: thêm một cron chạy đầu ngày (vd `5 0 * * *`) gọi `syncDisplayStatus` cho các phòng có
block bắt đầu/kết thúc trong ngày. Rẻ và bịt được lỗ hổng im lặng này.

---

## 5. 🟠 Đợt chặn: không sửa được, không gỡ được một ngày giữa đợt

**Hiện trạng**:

- Không có endpoint `PATCH .../blocks/:blockId` ⇒ muốn đổi ngày kết thúc hoặc sửa lý do thì phải gỡ
  rồi tạo lại (mất luôn lịch sử chi phí sự cố của đợt cũ).
- `DELETE .../blocks/:blockId` (resolveBlock) **kết thúc cả đợt**, trả phòng về kho cho mọi ngày còn
  lại. Không có cách nào gỡ chặn riêng **một ngày nằm giữa** khoảng.
- `createBlock` từ chối hai đợt `ooo` chồng nhau trên cùng phòng — hợp lý, nhưng cộng với việc không
  sửa được thì thao tác "gia hạn thêm 2 ngày" trở nên vòng vèo.

**FE đang làm**: nút "End block" hiện hộp xác nhận nói rõ **gỡ là kết thúc cả đợt** kèm khoảng ngày
(`04/08 → 11/08`), để staff không tưởng chỉ gỡ ngày đang xem.

**Đề xuất**: `PATCH .../blocks/:blockId` cho phép sửa `endDate` / `reason` / `estimatedCost` (kèm
kiểm xung đột như `createBlock`). Việc "gỡ một ngày giữa đợt" nếu cần thì implement bằng cách tách
đợt làm hai.

---

## 6. 🟡 `ooo` và `oos` cùng cho ra một nhãn `maintenance`

**Hiện trạng**: `deriveRoomStatus` chỉ hỏi "có block hay không", không phân biệt loại. Nhưng chỉ
`ooo` mới trừ tồn kho; `oos` thì không.

**Hệ quả**: nhìn Room map thấy `Maintenance` nhưng lịch vẫn còn phòng bán → trông như đếm sai, trong
khi số hoàn toàn đúng.

**FE đang làm**: tách thành 2 nhãn — **Maintenance** (`ooo`, mất một phòng để bán) và **Out of
service** (`oos`, vẫn bán được).

**Đề xuất**: cân nhắc trả thêm `activeBlock.blockType` ở nhãn hiển thị, hoặc tách enum
`RoomStatus` thành `maintenance` / `out_of_service`. Không gấp — FE tự phân biệt được từ
`room_blocks`.

---

## 7. 🟡 `clean` và `inspected` hiện KHÔNG khác gì nhau

**Hiện trạng**:

- Chỗ **duy nhất** phân biệt hai giá trị là `utils/room-status.ts → isHousekeepingReady`
  (`requiresInspection ? hkStatus === 'inspected' : clean || inspected`).
- Grep toàn `server/src`: **hàm này chưa được gọi ở đâu cả** ngoài chính file định nghĩa.
- Cột `room_types.requires_inspection` mặc định `false` và **không có UI nào bật nó**.
- `config/roles.ts`: vai trò `staff` có **danh sách quyền rỗng**; quyền vào endpoint vận hành đi qua
  `getOperableHotel` (chủ KS / `manageBookings` / được phân công). **Không có vai trò giám sát** ⇒
  ai bấm được `clean` thì cũng bấm được `inspected`.

**Hệ quả**: bước "duyệt" là nghi thức rỗng — không thêm quyền, không chặn gì, không ghi ai duyệt.
Ngoài ra gần như mọi phòng trên deploy đang là `inspected` **không phải vì có ai kiểm tra**, mà do
migration backfill mặc định `inspected` và lối cũ của Room map ghi thẳng `inspected` khi bấm
"Available" (`room.service.ts:215`).

**FE đang làm**: nút "Available" ghi `clean` (trung thực: dọn xong ≠ đã được duyệt), còn `Inspected`
nằm riêng trong nhóm *Housekeeping detail*.

**Đề xuất — cần quyết định nghiệp vụ trước khi code**:

1. Nếu **muốn có quy trình 2 bước**: thêm vai trò giám sát (hoặc quyền `inspectHousekeeping`), gọi
   `isHousekeepingReady` trong `checkIn` + chỗ tính phòng sẵn sàng, và cho partner bật
   `requiresInspection` theo từng loại phòng.
2. Nếu **không**: bỏ `inspected` khỏi enum (hoặc ít nhất khỏi tài liệu/UI) để không ai tưởng có
   kiểm soát chất lượng trong khi không có.

---

## 8. 🟡 Không có endpoint lịch tồn kho theo từng đêm

**Hiện trạng**: `availabilityService.getStayQuotes` chỉ trả MIN của cả kỳ ở. Không có gì trả
"mỗi loại phòng × mỗi đêm còn bao nhiêu".

**FE đang chữa cháy**: **nhân bản công thức của BE** ở client (`utils/inventoryCalendar.ts`), ghép
từ 3 endpoint `GET /rooms` + `GET /room-blocks` + `GET /bookings`.

**Rủi ro đã biết**: BE ưu tiên dòng `room_availability` (`totalRooms - bookedRooms`) khi đêm đó đã có
dòng; FE không đọc được bảng này nên phải đếm booking thay thế. Hiện **khớp 30/30** trên dữ liệu
thật, nhưng nếu đối tác chỉnh tay `totalRooms` thì hai bên sẽ lệch. Đây cũng là chỗ dễ trôi lệch
nhất mỗi khi BE đổi công thức (đã xảy ra một lần: `SELLABLE_ROOM_WHERE` → `ACTIVE_ROOM_WHERE`).

**Đề xuất**: `GET /hotels/:hotelId/inventory/calendar?from&to` đọc thẳng `room_availability`
(~50 dòng), trả `[{ roomTypeId, date, totalRooms, bookedRooms }]`. FE gỡ được toàn bộ phần mô phỏng.

---

## 9. 🟡 `GET /hotels/:hotelId/bookings` khó dùng cho việc dựng lịch

Ba điểm, tất cả đều **có thật và đã phải chữa cháy ở FE**:

1. `fromDate`/`toDate` lọc theo **`checkInDate`**, không theo khoảng lưu trú ⇒ đơn nhận phòng 30/07
   trả 09/08 **không** xuất hiện khi lọc từ 06/08, dù vẫn chiếm phòng. FE phải lùi `fromDate` đúng
   **30 ngày** (`MAX_NIGHTS`).
2. `status` chỉ nhận **một** giá trị ⇒ không lọc được `confirmed|checked_in|pending` trong một lượt;
   FE bỏ lọc ở server và lọc ở client.
3. `limit` tối đa **100**/trang ⇒ FE phải lặp trang (trần 20 trang) và **nói ra khi chạm trần** thay
   vì cắt im lặng.

**Đề xuất**: cho `fromDate`/`toDate` lọc theo **khoảng lưu trú** (`checkInDate <= toDate AND
checkOutDate > fromDate`), và cho `status` nhận mảng.

---

## 10. ⚪ Thông báo lỗi tiếng Việt hardcode

`errorMessage()` của FE hiển thị **nguyên văn** message của BE, trong khi phần lớn giao diện nội bộ
đang là tiếng Anh. Vd staff thấy _"Phòng đang có khách lưu trú — trả phòng ở mục Front desk trước khi
đổi trạng thái"_ giữa một màn hình tiếng Anh.

Không phải lỗi, nhưng nếu muốn thống nhất thì BE cần trả **mã lỗi** để FE tự map sang chữ.

---

## Thứ tự đề xuất

| # | Việc | Mức | Vì sao ưu tiên |
|---|---|---|---|
| 1 | Vá `dryRun` | 🔴 | Endpoint đang phá dữ liệu; sửa 2 dòng |
| 2 | API gán phòng trước check-in | 🔴 | Gỡ được phần FE đang phỏng đoán |
| 3 | Deprecate `PATCH .../status` + bỏ `maintenance` khỏi form phòng | 🟠 | Bịt cửa cuối còn đẻ đợt chặn 7 ngày |
| 4 | Cron đồng bộ `rooms.status` theo ngày | 🟠 | Lỗi im lặng, không ai thấy cho tới khi sai |
| 5 | `PATCH .../blocks/:blockId` | 🟠 | Sửa/gia hạn đợt chặn |
| 6 | Quyết định nghiệp vụ `clean` vs `inspected` | 🟡 | Cần quyết trước khi code |
| 7 | `GET .../inventory/calendar` | 🟡 | Gỡ phần FE nhân bản công thức |
| 8 | Nới bộ lọc `GET .../bookings` | 🟡 | Bớt lùi ngày + lặp trang ở FE |
| 9 | Mã lỗi thay cho message tiếng Việt | ⚪ | Dọn dẹp |

---

## Ghi chú về dữ liệu deploy

- Mọi đợt chặn tạo ra khi kiểm chứng **đã được gỡ**; DB về đúng **2 đợt chặn mở** như trước.
- 2 đợt chặn đó (`06/08 → 13/08`, phòng 802 và 804, lý do _"Chặn nhanh từ Room map — chưa nhập ngày
  dự kiến xong"_) là **dữ liệu có sẵn** do lối vào cũ ở mục 3 sinh ra, không phải do đợt kiểm chứng
  này. Giờ nhìn thấy và gỡ được ngay trên bản đồ phòng của hôm nay.
