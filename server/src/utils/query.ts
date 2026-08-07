/**
 * Đọc một CỜ BOOLEAN từ query string.
 *
 * Phải nhận cả boolean lẫn chuỗi: middleware `validate` kết thúc bằng `Object.assign(req, value)`
 * nên `req.query` đã bị thay bằng bản Joi ĐÃ CONVERT — cờ khai `Joi.boolean()` tới controller là
 * boolean thật, còn endpoint không mount `validate` thì vẫn là chuỗi 'true'.
 *
 * Vì sao có hàm này: `req.query.dryRun === 'true'` (so chuỗi) không bao giờ đúng sau khi Joi
 * convert ⇒ nhánh "xem trước, không ghi gì" của POST .../blocks chưa từng chạy, mỗi lần gọi là
 * chặn một phòng thật. Cùng cạm bẫy với `includeResolved`. Đọc cờ query PHẢI đi qua đây.
 */
export const isTrue = (value: unknown): boolean => value === true || value === 'true' || value === '1';

export default isTrue;
