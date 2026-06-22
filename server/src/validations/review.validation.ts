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

// Liệt kê đánh giá công khai của một khách sạn (?hotelId=...)
export const getHotelReviews = {
  query: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// Chi tiết một đánh giá
export const getReview = {
  params: Joi.object().keys({
    reviewId: Joi.string().uuid().required(),
  }),
};
