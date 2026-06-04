import Joi from 'joi';

const location = Joi.object().keys({
  lat: Joi.number().required(),
  lng: Joi.number().required(),
});

const businessInfo = Joi.object()
  .keys({
    businessName: Joi.string().required(),
    businessType: Joi.string().valid('hotel', 'resort', 'villa', 'apartment').allow(null),
    businessRegistrationNumber: Joi.string().allow('', null),
    taxCode: Joi.string().allow('', null),
    phone: Joi.string().allow('', null),
    email: Joi.string().email().allow('', null),
    address: Joi.string().required(),
    cityProvince: Joi.string().required(),
    district: Joi.string().allow('', null),
    ward: Joi.string().allow('', null),
    location: location.allow(null),
  })
  .required();

const businessLicense = Joi.object()
  .keys({
    licenseNumber: Joi.string().allow('', null),
    issueDate: Joi.string().isoDate().allow('', null),
    expiryDate: Joi.string().isoDate().allow('', null),
    authority: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'pending', 'expired').allow(null),
    documentFileUrl: Joi.string().uri().required(),
  })
  .required();

const certificates = Joi.object()
  .keys({
    operatingLicense: Joi.object()
      .keys({
        licenseNumber: Joi.string().allow('', null),
        issueDate: Joi.string().isoDate().allow('', null),
        authority: Joi.string().allow('', null),
        documentFileUrl: Joi.string().uri().required(),
      })
      .required(),
    fireSafety: Joi.object()
      .keys({
        certificateNumber: Joi.string().allow('', null),
        issueDate: Joi.string().isoDate().allow('', null),
        documentFileUrl: Joi.string().uri().required(),
      })
      .required(),
    securityOrder: Joi.object().keys({
      certificateNumber: Joi.string().allow('', null),
      issueDate: Joi.string().isoDate().allow('', null),
      documentFileUrl: Joi.string().uri().required(),
    }),
    classification: Joi.object().keys({
      starRating: Joi.string().valid('1', '2', '3', '4', '5', 'unrated').required(),
      ratingCertificateFileUrl: Joi.string().uri().required(),
    }),
  })
  .required();

const representative = Joi.object()
  .keys({
    fullName: Joi.string().required(),
    role: Joi.string().valid('owner', 'general_manager', 'legal_representative', 'director').required(),
    dob: Joi.string().isoDate().allow('', null),
    idNumber: Joi.string().required(),
    phone: Joi.string().allow('', null),
    address: Joi.string().allow('', null),
    idFrontImageUrl: Joi.string().uri().allow('', null),
    idBackImageUrl: Joi.string().uri().allow('', null),
  })
  .required();

const propertyImages = Joi.object()
  .keys({
    coverImages: Joi.array().items(Joi.string().uri()).min(1).required(),
    exteriorImages: Joi.array().items(Joi.string().uri()).min(1).required(),
    roomImages: Joi.array().items(Joi.string().uri()).min(3).required(),
  })
  .required();

const paymentPayouts = Joi.object()
  .keys({
    bankAccount: Joi.object()
      .keys({
        accountHolder: Joi.string().required(),
        bankName: Joi.string().required(),
        accountNumber: Joi.string().required(),
        bankBranch: Joi.string().allow('', null),
        swiftCode: Joi.string().allow('', null),
      })
      .required(),
    taxInvoice: Joi.object().keys({
      taxIdVatNumber: Joi.string().allow('', null),
      registeredBusinessAddress: Joi.string().allow('', null),
    }),
  })
  .required();

export const submitRegistration = {
  body: Joi.object().keys({
    businessInfo,
    businessLicense,
    certificates,
    representative,
    propertyImages,
    paymentPayouts,
  }),
};

export const getRequest = {
  params: Joi.object().keys({
    requestId: Joi.string().uuid().required(),
  }),
};

export const listRequests = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'in_review', 'approved', 'rejected'),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1),
    page: Joi.number().integer().min(1),
  }),
};

export const reviewRequest = {
  params: Joi.object().keys({
    requestId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    decision: Joi.string().valid('approve', 'reject').required(),
    rejectionReason: Joi.when('decision', {
      is: 'reject',
      then: Joi.string().required(),
      otherwise: Joi.forbidden(),
    }),
  }),
};

export const reviewDocument = {
  params: Joi.object().keys({
    documentId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    decision: Joi.string().valid('approve', 'reject').required(),
  }),
};

export const replaceDocument = {
  params: Joi.object().keys({
    documentId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    fileUrl: Joi.string().uri().required(),
  }),
};
