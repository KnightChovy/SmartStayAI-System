import Joi from 'joi';

export const searchHotels = {
  query: Joi.object()
    .keys({
      city: Joi.string(),
      checkIn: Joi.date().iso(),
      checkOut: Joi.date().iso().greater(Joi.ref('checkIn')),
      guests: Joi.number().integer().min(1),
      // WHITELIST bắt buộc: 'price'/'rating' KHÔNG phải cột DB (tính sau query) — trước đây nhét
      // thẳng vào Prisma orderBy nên gửi 'price:asc' làm SẬP trang (500). Giá trị lạ giờ trả 400.
      sortBy: Joi.string().valid('recommended', 'price:asc', 'price:desc', 'rating:desc'),
      limit: Joi.number().integer().min(1).max(100),
      page: Joi.number().integer().min(1),
      // ----- Bộ lọc nâng cao (P0-1) -----
      priceMin: Joi.number().min(0),
      // Chỉ đòi priceMax > priceMin KHI có priceMin; gửi mình priceMax vẫn hợp lệ (lọc "dưới X")
      priceMax: Joi.number()
        .min(0)
        .when('priceMin', { is: Joi.exist(), then: Joi.number().greater(Joi.ref('priceMin')) }),
      // CSV các sao 1..5, vd "3,4,5"
      stars: Joi.string().pattern(/^[1-5](,[1-5])*$/).message('stars phải là danh sách sao 1-5 phân tách bởi dấu phẩy'),
      // CSV các uuid amenity
      amenities: Joi.string().pattern(/^[0-9a-fA-F-]{36}(,[0-9a-fA-F-]{36})*$/).message('amenities phải là danh sách uuid phân tách bởi dấu phẩy'),
      // Điểm tối thiểu theo thang 10
      reviewScore: Joi.number().min(0).max(10),
    })
    // checkIn/checkOut phải đi cùng nhau — chỉ một trong hai thì không tính được tồn kho
    .and('checkIn', 'checkOut'),
};

// Chi tiết một khách sạn theo id (public)
export const getHotel = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
};

// Partner bật/tắt mở bán (publish) khách sạn của mình
export const setHotelListing = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    isListed: Joi.boolean().required(),
  }),
};

// Giờ nhận/trả phòng định dạng HH:mm (24h)
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

// Partner cập nhật hồ sơ khách sạn (partial). KHÔNG nhận isActive/isListed/taxCode/businessRegistrationNumber.
export const updateHotel = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().max(255),
      description: Joi.string().max(5000).allow('', null),
      address: Joi.string().max(500),
      city: Joi.string().max(255),
      country: Joi.string().max(255),
      district: Joi.string().max(255).allow('', null),
      ward: Joi.string().max(255).allow('', null),
      latitude: Joi.number().min(-90).max(90).allow(null),
      longitude: Joi.number().min(-180).max(180).allow(null),
      starRating: Joi.number().integer().min(1).max(5).allow(null),
      checkInTime: Joi.string().pattern(timePattern).allow(null),
      checkOutTime: Joi.string().pattern(timePattern).allow(null),
      businessType: Joi.string().valid('hotel', 'resort', 'villa', 'apartment'),
      // ----- Chi tiết bổ sung kiểu booking.com (Pha 1 DB) — đều tuỳ chọn -----
      postalCode: Joi.string().max(20).allow('', null),
      phone: Joi.string().max(30).allow('', null),
      email: Joi.string().email().allow('', null),
      totalFloors: Joi.number().integer().min(0).max(200).allow(null),
      builtYear: Joi.number().integer().min(1800).max(2100).allow(null),
      renovationYear: Joi.number().integer().min(1800).max(2100).allow(null),
      isSmokingAllowed: Joi.boolean(),
      petsPolicy: Joi.string().valid('not_allowed', 'allowed', 'on_request').allow(null),
      // Chính sách huỷ THẬT — đây là con số quyết định tiền hoàn cho khách. Khác hẳn
      // `cancellationPolicy` ngay dưới (chỉ là đoạn mô tả cho khách đọc, không ảnh hưởng tiền).
      // KHÔNG bật .unknown(): gõ sai khoá (vd 'freeUntilHour') sẽ bị chặn 400 thay vì im lặng rơi
      // về mặc định 48h — chính cái bẫy đó đã khiến chính sách của KS bị phớt lờ bấy lâu nay.
      settings: Joi.object().keys({
        cancellation: Joi.object()
          .keys({
            // Trần 2160h = 90 ngày: đủ cho cả villa/resort mùa cao điểm (chính sách 60-90 ngày),
            // vẫn chặn được số vô lý. 0 = không bao giờ được huỷ miễn phí.
            freeUntilHours: Joi.number().integer().min(0).max(2160).required(),
            latePenalty: Joi.string().valid('first_night', 'full').required(),
          })
          .required(),
      }),
      cancellationPolicy: Joi.string().max(5000).allow('', null),
      childrenPolicy: Joi.string().max(5000).allow('', null),
      minGuestAge: Joi.number().integer().min(0).max(120).allow(null),
      securityDepositAmount: Joi.number().min(0).allow(null),
      languagesSpoken: Joi.array().items(Joi.string().max(50)), // gửi [] để xoá hết
      maxLengthOfStay: Joi.number().integer().min(1).max(365).allow(null),
    })
    .min(1),
};

// Thêm ảnh khách sạn (URL đã upload qua POST /v1/uploads)
export const addHotelImages = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    images: Joi.array()
      .items(
        Joi.object().keys({
          url: Joi.string().uri().required(),
          imageCategory: Joi.string().valid('cover', 'exterior', 'room').required(),
          caption: Joi.string().max(500).allow('', null),
          isPrimary: Joi.boolean(),
          sortOrder: Joi.number().integer().min(0),
        })
      )
      .min(1)
      .required(),
  }),
};

// Xoá / đặt ảnh chính cho một ảnh khách sạn (dùng chung params)
export const hotelImageId = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    imageId: Joi.string().uuid().required(),
  }),
};

const hotelParams = Joi.object().keys({
  hotelId: Joi.string().uuid().required(),
});

// GET (chỉ params) dùng chung cho các sub-resource của khách sạn
export const hotelIdParam = { params: hotelParams };

// Thay thế TOÀN BỘ liên hệ của khách sạn (mảng rỗng = xoá hết)
export const setHotelContacts = {
  params: hotelParams,
  body: Joi.object().keys({
    contacts: Joi.array()
      .items(
        Joi.object().keys({
          contactType: Joi.string().valid('physical_location', 'general', 'availability', 'invoices').required(),
          name: Joi.string().max(255).allow('', null),
          jobTitle: Joi.string().max(255).allow('', null),
          email: Joi.string().email().allow('', null),
          phone: Joi.string().max(30).allow('', null),
          phoneType: Joi.string().valid('voice', 'fax', 'mobile').allow(null),
        })
      )
      .required(),
  }),
};

// Thay thế TOÀN BỘ điều khoản (văn bản cho khách đọc) của khách sạn
export const setHotelPolicies = {
  params: hotelParams,
  body: Joi.object().keys({
    policies: Joi.array()
      .items(
        Joi.object().keys({
          title: Joi.string().max(200).required(),
          description: Joi.string().max(2000).allow('', null),
          important: Joi.boolean(),
        })
      )
      .required(),
  }),
};

// Thay thế TOÀN BỘ khoản thu (thuế/phí) của khách sạn — ĐỔI SỐ Ở ĐÂY LÀ ĐỔI TIỀN KHÁCH TRẢ.
// chargeFrequency bị cấm khi tính theo %: phần trăm luôn tính trên tiền phòng cả kỳ, gửi kèm tần
// suất chỉ khiến người dùng tưởng "8% mỗi đêm" trong khi engine không hề nhân theo đêm.
export const setHotelCharges = {
  params: hotelParams,
  body: Joi.object().keys({
    charges: Joi.array()
      .items(
        Joi.object().keys({
          chargeType: Joi.string().valid('tax', 'fee').required(),
          name: Joi.string().max(200).required(),
          amount: Joi.number().min(0).required(),
          isPercentage: Joi.boolean().default(false),
          chargeFrequency: Joi.string()
            .valid('per_stay', 'per_night', 'per_person', 'per_person_per_night')
            .when('isPercentage', { is: true, then: Joi.forbidden(), otherwise: Joi.required() }),
        })
      )
      .required(),
  }),
};

// Thay thế TOÀN BỘ địa điểm lân cận của khách sạn
export const setHotelNearbyPlaces = {
  params: hotelParams,
  body: Joi.object().keys({
    nearbyPlaces: Joi.array()
      .items(
        Joi.object().keys({
          name: Joi.string().max(255).required(),
          category: Joi.string()
            .valid('attraction', 'beach', 'airport', 'restaurant', 'public_transport', 'landmark', 'nature')
            .required(),
          distance: Joi.number().min(0).required(),
          distanceUnit: Joi.string().valid('km', 'miles').required(),
          transportType: Joi.string().valid('walk', 'car', 'public_transport', 'taxi', 'shuttle').allow(null),
          journeyMinutes: Joi.number().integer().min(0).allow(null),
        })
      )
      .required(),
  }),
};

// Gán lại TOÀN BỘ tiện nghi của khách sạn (thay thế; mảng rỗng = bỏ hết). Mỗi dòng kèm isFree/quantity.
export const setHotelAmenities = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    amenities: Joi.array()
      .items(
        Joi.object().keys({
          amenityId: Joi.string().uuid().required(),
          isFree: Joi.boolean(),
          quantity: Joi.number().integer().min(0).allow(null),
        })
      )
      .unique('amenityId')
      .required(),
  }),
};

export const getRoomTypes = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object()
    .keys({
      checkIn: Joi.date().iso(),
      checkOut: Joi.date().iso().greater(Joi.ref('checkIn')),
      guests: Joi.number().integer().min(1),
      minPrice: Joi.number().min(0),
      maxPrice: Joi.number().min(0),
      bedType: Joi.string(),
      viewType: Joi.string(),
    })
    .and('checkIn', 'checkOut'),
};

// Chi tiết một loại phòng cho guest (public) — checkIn/checkOut tuỳ chọn để kèm giá/tồn kho kỳ ở
export const getRoomType = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    roomTypeId: Joi.string().uuid().required(),
  }),
  query: Joi.object()
    .keys({
      checkIn: Joi.date().iso(),
      checkOut: Joi.date().iso().greater(Joi.ref('checkIn')),
      // Số khách để nhân phí per_person cho khớp báo giá — không gửi thì coi như 1
      guests: Joi.number().integer().min(1),
    })
    .and('checkIn', 'checkOut'),
};
