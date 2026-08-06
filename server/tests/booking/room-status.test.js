// Test máy trạng thái phòng (turnover) — require code đã build ở dist/. Không cần DB.
const { deriveRoomStatus, isHousekeepingReady, cleaningSlaLevel } = require('../../dist/utils/room-status');

describe('deriveRoomStatus — ép 3 chiều (fo/hk/block) về 1 nhãn hiển thị', () => {
  test('block đè tất cả ⇒ maintenance (kể cả phòng sạch, không khách)', () => {
    expect(deriveRoomStatus({ foStatus: 'vacant', hkStatus: 'inspected' }, true)).toBe('maintenance');
    expect(deriveRoomStatus({ foStatus: 'occupied', hkStatus: 'dirty' }, true)).toBe('maintenance');
  });

  test('có khách ⇒ occupied (ưu tiên hơn hk)', () => {
    expect(deriveRoomStatus({ foStatus: 'occupied', hkStatus: 'inspected' }, false)).toBe('occupied');
  });

  test('KỊCH BẢN turnover: SAU CHECK-OUT (vacant + dirty) ⇒ cleaning, KHÔNG phải available', () => {
    // Bằng chứng phòng vừa trả KHÔNG bán được cho khách mới cho tới khi dọn xong.
    expect(deriveRoomStatus({ foStatus: 'vacant', hkStatus: 'dirty' }, false)).toBe('cleaning');
    expect(deriveRoomStatus({ foStatus: 'vacant', hkStatus: 'cleaning' }, false)).toBe('cleaning');
  });

  test('dọn xong (vacant + clean/inspected) ⇒ available (mới được gán cho khách mới)', () => {
    expect(deriveRoomStatus({ foStatus: 'vacant', hkStatus: 'clean' }, false)).toBe('available');
    expect(deriveRoomStatus({ foStatus: 'vacant', hkStatus: 'inspected' }, false)).toBe('available');
  });
});

describe('isHousekeepingReady — phòng đã sẵn sàng đón khách chưa', () => {
  test('không cần inspection: clean/inspected là sẵn sàng, dirty thì chưa', () => {
    expect(isHousekeepingReady('clean', false)).toBe(true);
    expect(isHousekeepingReady('inspected', false)).toBe(true);
    expect(isHousekeepingReady('dirty', false)).toBe(false);
  });
  test('cần inspection: chỉ inspected mới sẵn sàng (clean chưa đủ)', () => {
    expect(isHousekeepingReady('clean', true)).toBe(false);
    expect(isHousekeepingReady('inspected', true)).toBe(true);
  });
});

describe('cleaningSlaLevel — mức trễ so với SLA dọn phòng', () => {
  const since = new Date('2026-08-06T00:00:00.000Z');
  const until = new Date('2026-08-06T00:30:00.000Z'); // định mức 30'
  test('còn trong định mức ⇒ on_time', () => {
    expect(cleaningSlaLevel('cleaning', since, until, new Date('2026-08-06T00:10:00.000Z'))).toBe('on_time');
  });
  test('quá 50% ⇒ warning', () => {
    expect(cleaningSlaLevel('cleaning', since, until, new Date('2026-08-06T00:20:00.000Z'))).toBe('warning');
  });
  test('quá 100% ⇒ overdue', () => {
    expect(cleaningSlaLevel('cleaning', since, until, new Date('2026-08-06T00:35:00.000Z'))).toBe('overdue');
  });
  test('không phải cleaning hoặc thiếu mốc ⇒ null (không bịa cảnh báo)', () => {
    expect(cleaningSlaLevel('dirty', since, until, new Date())).toBeNull();
    expect(cleaningSlaLevel('cleaning', null, until, new Date())).toBeNull();
  });
});
