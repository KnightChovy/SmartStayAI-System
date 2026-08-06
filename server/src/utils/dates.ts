/**
 * Date helpers for booking date ranges. Prisma stores `@db.Date` columns as
 * UTC-midnight Date objects, so every date we compare/persist must be
 * normalised the same way to avoid timezone off-by-one bugs.
 */

/**
 * Normalise a Date to UTC midnight (drop the time part)
 * @param {Date} date
 * @returns {Date}
 */
export const toUtcDate = (date: Date): Date => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';
const WEEKDAYS_VI = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

/**
 * Hôm nay theo GIỜ VIỆT NAM, không theo giờ máy chủ (Render chạy UTC nên hai mốc lệch nhau
 * từ 00:00 đến 07:00 giờ VN). Dùng để nói cho chatbot biết "hôm nay là ngày nào" — model không có
 * đồng hồ, không nói thì nó lấy mốc thời gian từ dữ liệu huấn luyện.
 *
 * @returns {{iso: string, label: string}} iso dạng YYYY-MM-DD; label kèm thứ để quy đổi "cuối tuần này"
 */
export const todayInVietnam = (): { iso: string; label: string } => {
  // en-CA cho ra đúng định dạng YYYY-MM-DD
  const iso = new Intl.DateTimeFormat('en-CA', { timeZone: VN_TIMEZONE }).format(new Date());
  const [year, month, day] = iso.split('-').map(Number);
  // Dựng lại ở UTC để getUTCDay() cho ra thứ của CHÍNH ngày đó, không lệ thuộc giờ máy chủ
  const weekday = WEEKDAYS_VI[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const pad = (n: number): string => String(n).padStart(2, '0');
  return { iso, label: `${weekday}, ${pad(day)}/${pad(month)}/${year}` };
};

/**
 * List every night of a stay: [checkIn, checkOut) — the check-out day itself is not a night.
 * @param {Date} checkIn
 * @param {Date} checkOut
 * @returns {Date[]} one UTC-midnight Date per night
 */
export const eachNightOfStay = (checkIn: Date, checkOut: Date): Date[] => {
  const nights: Date[] = [];
  const current = toUtcDate(checkIn);
  const end = toUtcDate(checkOut);
  while (current < end) {
    nights.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return nights;
};
