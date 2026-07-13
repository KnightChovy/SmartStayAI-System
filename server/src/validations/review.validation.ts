import Joi from 'joi';

// Điểm đánh giá theo thang 1–5, bắt buộc cho từng tiêu chí
const ratingField = Joi.number().integer().min(1).max(5).required();

// Khách viết đánh giá sau khi trả phòng
export const createReview = {
  body: Joi.object().keys({
    bookingId: Joi.string().uuid().required(),
    overallRating: ratingField,
    cleanlinessRating: ratingField,
    serviceRating: ratingField,
    locationRating: ratingField,
    valueRating: ratingField,
    title: Joi.string().max(200).allow('', null),
    content: Joi.string().max(2000).required(),
    images: Joi.array().items(Joi.string().uri()).max(10),
  }),
};

// Khách sửa đánh giá của chính mình — mọi trường tuỳ chọn nhưng phải có ít nhất một
export const updateMyReview = {
  params: Joi.object().keys({
    reviewId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      overallRating: Joi.number().integer().min(1).max(5),
      cleanlinessRating: Joi.number().integer().min(1).max(5),
      serviceRating: Joi.number().integer().min(1).max(5),
      locationRating: Joi.number().integer().min(1).max(5),
      valueRating: Joi.number().integer().min(1).max(5),
      title: Joi.string().max(200).allow('', null),
      content: Joi.string().max(2000),
      images: Joi.array().items(Joi.string().uri()).max(10),
    })
    .min(1),
};

// Khách xoá đánh giá của chính mình
export const deleteMyReview = {
  params: Joi.object().keys({
    reviewId: Joi.string().uuid().required(),
  }),
};

// Liệt kê đánh giá công khai của một khách sạn (?hotelId=...)
export const getHotelReviews = {
  query: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// Đánh giá của chính khách đang đăng nhập (mọi trạng thái)
export const getMyReviews = {
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// [Partner] Đánh giá của chính khách sạn mình (mọi trạng thái, lọc theo status)
export const getHotelReviewsForPartner = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'published', 'hidden'),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// [Partner] Thống kê đánh giá của khách sạn
export const getHotelReviewStats = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
};

// Chi tiết một đánh giá
export const getReview = {
  params: Joi.object().keys({
    reviewId: Joi.string().uuid().required(),
  }),
};
