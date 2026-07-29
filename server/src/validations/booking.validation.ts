import Joi from 'joi';

export const createBooking = {
  body: Joi.object()
    .keys({
      hotelId: Joi.string().uuid().required(),
      roomTypeId: Joi.string().uuid().required(),
      checkInDate: Joi.date().iso().required(),
      checkOutDate: Joi.date().iso().greater(Joi.ref('checkInDate')).required(),
      // Số khách: cách MỚI tách người lớn/trẻ em, hoặc cách CŨ gộp (numGuests) cho mobile/link cũ.
      // Bắt buộc có ÍT NHẤT một trong hai (numGuests | numAdults) — .or ở dưới.
      numGuests: Joi.number().integer().min(1),
      numAdults: Joi.number().integer().min(1),
      numChildren: Joi.number().integer().min(0).default(0),
      specialRequests: Joi.string().max(1000).allow('', null),
      paymentMethod: Joi.string().valid('vnpay', 'sepay', 'cash').default('vnpay'),
    })
    .or('numGuests', 'numAdults'),
};

export const getMyBookings = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

export const getBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().uuid().required(),
  }),
};

export const cancelBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    reason: Joi.string().max(500).allow('', null),
    // Mặc định hoàn vào ví (nhận ngay). Chọn 'bank' thì BẮT BUỘC gửi tài khoản — không có thì
    // Platform Manager không biết chuyển đi đâu, nên Joi chặn ngay thay vì để lòi ra lúc chi tiền.
    refundMethod: Joi.string().valid('wallet', 'bank').default('wallet'),
    bankAccount: Joi.object()
      .keys({
        accountNumber: Joi.string().max(30).pattern(/^\d+$/).required(),
        bankName: Joi.string().max(100).required(),
        accountHolder: Joi.string().max(100).required(),
      })
      .when('refundMethod', { is: 'bank', then: Joi.required(), otherwise: Joi.forbidden() }),
  }),
};

// Xem trước tiền hoàn trước khi huỷ (chỉ đọc)
export const getRefundPreview = {
  params: Joi.object().keys({
    bookingId: Joi.string().uuid().required(),
  }),
};

// Staff/chủ KS xem booking của một khách sạn
export const listHotelBookings = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'),
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// [Platform Manager] Toàn bộ booking toàn sàn (lọc thêm theo KS/đối tác + tìm kiếm)
export const listPlatformBookings = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'),
    hotelId: Joi.string().uuid(),
    partnerId: Joi.string().uuid(),
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso(),
    search: Joi.string().max(255),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// [Partner] Booking của mọi khách sạn của partner đang đăng nhập (tuỳ chọn thu hẹp theo 1 KS)
export const listPartnerBookings = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'),
    hotelId: Joi.string().uuid(),
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso(),
    search: Joi.string().max(255),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// Staff/chủ KS xem chi tiết một booking của khách sạn
export const getHotelBooking = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    bookingId: Joi.string().uuid().required(),
  }),
};

// Staff quét QR / tra booking theo mã voucher trước khi check-in
export const lookupBookingByVoucher = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    voucherCode: Joi.string().max(50).required(),
  }),
};

// Check-in: gán phòng (tuỳ chọn) + đối chiếu voucher (tuỳ chọn)
export const checkInBooking = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    bookingId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    roomId: Joi.string().uuid(),
    voucherCode: Joi.string().max(50),
  }),
};

// Check-out: phụ thu phát sinh (>= 0)
export const checkOutBooking = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    bookingId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    extraCharge: Joi.number().min(0),
  }),
};

// Staff ghi nhận đã thu tiền mặt cho một booking trả tại khách sạn
export const recordCashPayment = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    bookingId: Joi.string().uuid().required(),
  }),
};

// Staff đánh dấu khách no-show
export const markNoShow = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    bookingId: Joi.string().uuid().required(),
  }),
};
