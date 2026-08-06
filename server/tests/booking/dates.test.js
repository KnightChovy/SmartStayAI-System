// Test thuần logic ngày của luồng booking (require code đã build ở dist/). Không cần DB.
const { eachNightOfStay, eachDayInclusive, toUtcDate, todayInVietnamDate } = require('../../dist/utils/dates');

const d = (iso) => new Date(iso + 'T00:00:00.000Z'); // UTC-midnight từ 'YYYY-MM-DD'
const isoOf = (date) => date.toISOString().slice(0, 10);

describe('eachNightOfStay — ranh giới NỬA MỞ [checkIn, checkOut)', () => {
  test('1 đêm: check-in X, check-out X+1 ⇒ đúng [X], KHÔNG gồm ngày trả phòng', () => {
    expect(eachNightOfStay(d('2026-08-06'), d('2026-08-07')).map(isoOf)).toEqual(['2026-08-06']);
  });

  test('KỊCH BẢN HỘI ĐỒNG: khách B đặt đêm LIỀN SAU đêm A trả phòng ⇒ KHÔNG chung đêm nào', () => {
    // A ở 06→07 (đêm 06, trả sáng 07). B ở 07→08 (đêm 07). Ngày 07 không phải đêm chung.
    const aNights = eachNightOfStay(d('2026-08-06'), d('2026-08-07')).map(isoOf);
    const bNights = eachNightOfStay(d('2026-08-07'), d('2026-08-08')).map(isoOf);
    expect(aNights).toEqual(['2026-08-06']);
    expect(bNights).toEqual(['2026-08-07']);
    expect(aNights.filter((n) => bNights.includes(n))).toEqual([]); // không xung đột tồn kho
  });

  test('nhiều đêm: liệt kê đủ, đúng thứ tự', () => {
    expect(eachNightOfStay(d('2026-08-06'), d('2026-08-09')).map(isoOf)).toEqual([
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
    ]);
  });

  test('KỊCH BẢN cross-month: booking VẮT QUA đầu tháng', () => {
    expect(eachNightOfStay(d('2026-01-30'), d('2026-02-02')).map(isoOf)).toEqual([
      '2026-01-30',
      '2026-01-31',
      '2026-02-01',
    ]);
  });

  test('vắt qua năm', () => {
    expect(eachNightOfStay(d('2026-12-31'), d('2027-01-02')).map(isoOf)).toEqual(['2026-12-31', '2027-01-01']);
  });

  test('check-out <= check-in ⇒ 0 đêm', () => {
    expect(eachNightOfStay(d('2026-08-07'), d('2026-08-07'))).toEqual([]);
    expect(eachNightOfStay(d('2026-08-08'), d('2026-08-07'))).toEqual([]);
  });
});

describe('eachDayInclusive — khoảng ĐÓNG [start, end] (dùng cho room block)', () => {
  test('chặn 12/08 → 12/08 vẫn là MỘT ngày (khác eachNightOfStay)', () => {
    expect(eachDayInclusive(d('2026-08-12'), d('2026-08-12')).map(isoOf)).toEqual(['2026-08-12']);
  });
  test('gồm cả ngày cuối', () => {
    expect(eachDayInclusive(d('2026-08-10'), d('2026-08-12')).map(isoOf)).toEqual([
      '2026-08-10',
      '2026-08-11',
      '2026-08-12',
    ]);
  });
});

describe('toUtcDate — chuẩn hoá UTC-midnight', () => {
  test('cắt phần giờ về 00:00 UTC', () => {
    expect(toUtcDate(new Date('2026-08-06T18:30:00.000Z')).toISOString()).toBe('2026-08-06T00:00:00.000Z');
  });
});

describe('todayInVietnamDate — hôm nay theo giờ VN (fix timezone Phase 2)', () => {
  test('trả về UTC-midnight (giờ = 0)', () => {
    const t = todayInVietnamDate();
    expect(t.getUTCHours()).toBe(0);
    expect(t.getUTCMinutes()).toBe(0);
    expect(t.getUTCSeconds()).toBe(0);
  });
  test('khớp đúng ngày lịch theo giờ VN hiện tại', () => {
    const vnIso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
    expect(isoOf(todayInVietnamDate())).toBe(vnIso);
  });
});
