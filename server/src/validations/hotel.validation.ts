import Joi from 'joi';

export const searchHotels = {
  query: Joi.object()
    .keys({
      city: Joi.string(),
      checkIn: Joi.date().iso(),
      checkOut: Joi.date().iso().greater(Joi.ref('checkIn')),
      guests: Joi.number().integer().min(1),
      sortBy: Joi.string(),
      limit: Joi.number().integer().min(1).max(100),
      page: Joi.number().integer().min(1),
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

// Thay thế TOÀN BỘ chính sách / phụ phí của khách sạn
export const setHotelPolicies = {
  params: hotelParams,
  body: Joi.object().keys({
    policies: Joi.array()
      .items(
        Joi.object().keys({
          policyType: Joi.string().valid('cancellation', 'tax', 'fee', 'parking', 'internet', 'deposit').required(),
          code: Joi.string().max(100).allow('', null),
          description: Joi.string().max(2000).allow('', null),
          amount: Joi.number().min(0).allow(null),
          isPercentage: Joi.boolean(),
          chargeFrequency: Joi.string()
            .valid('per_stay', 'per_night', 'per_person', 'per_person_per_night')
            .allow(null),
          minAge: Joi.number().integer().min(0).max(120).allow(null),
          maxAge: Joi.number().integer().min(0).max(120).allow(null),
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
