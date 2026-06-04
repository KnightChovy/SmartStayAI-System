import httpStatus from 'http-status';
import type { Prisma, User, LicenseType, LicenseStarRating, VerificationDocumentType } from '@prisma/client';
import prisma from '../config/prisma';
import config from '../config/config';
import ApiError from '../utils/ApiError';
import { encrypt } from '../utils/encryption';
import { roleRights } from '../config/roles';
import type {
  RegisterHotelDto,
  ReviewRequestDto,
  ReviewDocumentDto,
  VerificationRequestFilter,
  VerificationRequestQueryOptions,
} from '../dto/hotel-partner.dto';

// Quan hệ kèm theo khi trả về một hồ sơ duyệt (gồm ảnh khách sạn + license join file hiện hành)
const requestInclude = {
  hotel: { include: { images: { orderBy: { sortOrder: 'asc' } } } },
  partner: true,
  documents: true,
  licenses: { include: { currentDocument: true } },
} satisfies Prisma.HotelVerificationRequestInclude;

// Các loại document đồng thời là một license (5/8 loại). Dùng để biết khi duyệt document thì
// có cần cập nhật current_document_id của license tương ứng hay không.
const LICENSE_DOCUMENT_TYPES: LicenseType[] = [
  'business_license',
  'operating_license',
  'fire_safety',
  'security_order',
  'classification',
];

const STAR_ENUM: Record<string, LicenseStarRating> = {
  '1': 'star1',
  '2': 'star2',
  '3': 'star3',
  '4': 'star4',
  '5': 'star5',
  unrated: 'unrated',
};

const toNullableDate = (value?: string | null): Date | null => (value ? new Date(value) : null);

// Một giấy tờ "có cấu trúc": vừa tạo 1 document (file) vừa tạo 1 license (metadata)
interface LicenseItem {
  licenseType: LicenseType;
  documentType: VerificationDocumentType;
  fileUrl: string;
  licenseNumber: string | null;
  certificateNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  authority: string | null;
  validityStatus: 'active' | 'pending' | 'expired' | null;
  starRating: LicenseStarRating | null;
}

export class HotelPartnerService {
  // Gom businessLicense + certificates của client thành danh sách license/document để tạo
  private buildLicenseItems = (payload: RegisterHotelDto): LicenseItem[] => {
    const items: LicenseItem[] = [];
    const bl = payload.businessLicense;
    items.push({
      licenseType: 'business_license',
      documentType: 'business_license',
      fileUrl: bl.documentFileUrl,
      licenseNumber: bl.licenseNumber || null,
      certificateNumber: null,
      issueDate: toNullableDate(bl.issueDate),
      expiryDate: toNullableDate(bl.expiryDate),
      authority: bl.authority || null,
      validityStatus: bl.status || null,
      starRating: null,
    });

    const c = payload.certificates;
    if (c.operatingLicense) {
      items.push({
        licenseType: 'operating_license',
        documentType: 'operating_license',
        fileUrl: c.operatingLicense.documentFileUrl,
        licenseNumber: c.operatingLicense.licenseNumber || null,
        certificateNumber: null,
        issueDate: toNullableDate(c.operatingLicense.issueDate),
        expiryDate: null,
        authority: c.operatingLicense.authority || null,
        validityStatus: null,
        starRating: null,
      });
    }
    if (c.fireSafety) {
      items.push({
        licenseType: 'fire_safety',
        documentType: 'fire_safety',
        fileUrl: c.fireSafety.documentFileUrl,
        licenseNumber: null,
        certificateNumber: c.fireSafety.certificateNumber || null,
        issueDate: toNullableDate(c.fireSafety.issueDate),
        expiryDate: null,
        authority: null,
        validityStatus: null,
        starRating: null,
      });
    }
    if (c.securityOrder) {
      items.push({
        licenseType: 'security_order',
        documentType: 'security_order',
        fileUrl: c.securityOrder.documentFileUrl,
        licenseNumber: null,
        certificateNumber: c.securityOrder.certificateNumber || null,
        issueDate: toNullableDate(c.securityOrder.issueDate),
        expiryDate: null,
        authority: null,
        validityStatus: null,
        starRating: null,
      });
    }
    if (c.classification) {
      items.push({
        licenseType: 'classification',
        documentType: 'classification',
        fileUrl: c.classification.ratingCertificateFileUrl,
        licenseNumber: null,
        certificateNumber: null,
        issueDate: null,
        expiryDate: null,
        authority: null,
        validityStatus: null,
        starRating: STAR_ENUM[c.classification.starRating] ?? null,
      });
    }
    return items;
  };

  /**
   * Nộp hồ sơ đăng ký khách sạn (theo cấu trúc form client).
   * Tạo Partner (pending) + Hotel (chưa active) + mỗi giấy tờ tạo 1 document (file, pending) và
   * 1 license (metadata, current_document_id null cho tới khi document được duyệt) + đại diện + ảnh
   * + tài khoản nhận tiền + yêu cầu duyệt — tất cả trong một transaction.
   */
  registerHotel = async (userId: string, payload: RegisterHotelDto) => {
    const existingPartner = await prisma.hotelPartner.findFirst({
      where: { ownerId: userId, status: { in: ['pending', 'approved'] }, deletedAt: null },
    });
    if (existingPartner) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Bạn đã có hồ sơ đối tác đang chờ duyệt hoặc đã được duyệt');
    }

    const bi = payload.businessInfo;
    const rep = payload.representative;
    const ba = payload.paymentPayouts.bankAccount;
    const ti = payload.paymentPayouts.taxInvoice;
    const licenseItems = this.buildLicenseItems(payload);
    const classification = payload.certificates.classification;
    const hotelStarRating =
      classification && classification.starRating !== 'unrated' ? Number(classification.starRating) : null;

    return prisma.$transaction(async (tx) => {
      const partner = await tx.hotelPartner.create({
        data: {
          ownerId: userId,
          businessName: bi.businessName,
          contactEmail: bi.email || null,
          contactPhone: bi.phone || null,
          status: 'pending',
          commissionRate: config.partner.defaultCommissionRate,
        },
      });

      const hotel = await tx.hotel.create({
        data: {
          partnerId: partner.id,
          name: bi.businessName,
          address: bi.address,
          // Form chỉ phục vụ thị trường VN và không gửi country → mặc định "Vietnam"
          city: bi.cityProvince,
          country: 'Vietnam',
          businessType: bi.businessType || null,
          businessRegistrationNumber: bi.businessRegistrationNumber || null,
          taxCode: bi.taxCode || null,
          district: bi.district || null,
          ward: bi.ward || null,
          latitude: bi.location?.lat ?? null,
          longitude: bi.location?.lng ?? null,
          starRating: hotelStarRating,
          isActive: false,
          isListed: false,
        },
      });

      const request = await tx.hotelVerificationRequest.create({
        data: { partnerId: partner.id, hotelId: hotel.id, status: 'pending' },
      });

      // Mỗi giấy tờ: tạo document (file) rồi tạo license (metadata) gắn cùng loại.
      // Link license <-> document được thực hiện theo loại khi document được duyệt (reviewDocument).
      for (const item of licenseItems) {
        await tx.hotelVerificationDocument.create({
          data: {
            verificationRequestId: request.id,
            partnerId: partner.id,
            hotelId: hotel.id,
            documentType: item.documentType,
            fileUrl: item.fileUrl,
            status: 'pending',
          },
        });
        await tx.hotelLicense.create({
          data: {
            hotelId: hotel.id,
            verificationRequestId: request.id,
            licenseType: item.licenseType,
            licenseNumber: item.licenseNumber,
            certificateNumber: item.certificateNumber,
            issueDate: item.issueDate,
            expiryDate: item.expiryDate,
            authority: item.authority,
            validityStatus: item.validityStatus,
            starRating: item.starRating,
            // current_document_id chỉ set khi document được duyệt (xem reviewDocument)
            currentDocumentId: null,
          },
        });
      }

      await tx.hotelRepresentative.create({
        data: {
          hotelId: hotel.id,
          partnerId: partner.id,
          fullName: rep.fullName,
          role: rep.role,
          dateOfBirth: toNullableDate(rep.dob),
          idNumber: rep.idNumber,
          phone: rep.phone || null,
          address: rep.address || null,
          idFrontImageUrl: rep.idFrontImageUrl || null,
          idBackImageUrl: rep.idBackImageUrl || null,
        },
      });

      const imageData: Prisma.HotelImageCreateManyInput[] = [
        ...payload.propertyImages.coverImages.map((url, index) => ({
          hotelId: hotel.id,
          imageCategory: 'cover' as const,
          url,
          isPrimary: index === 0,
          sortOrder: index,
        })),
        ...payload.propertyImages.exteriorImages.map((url, index) => ({
          hotelId: hotel.id,
          imageCategory: 'exterior' as const,
          url,
          sortOrder: index,
        })),
        ...payload.propertyImages.roomImages.map((url, index) => ({
          hotelId: hotel.id,
          imageCategory: 'room' as const,
          url,
          sortOrder: index,
        })),
      ];
      await tx.hotelImage.createMany({ data: imageData });

      await tx.hotelPayoutAccount.create({
        data: {
          hotelId: hotel.id,
          partnerId: partner.id,
          accountHolder: ba.accountHolder,
          bankName: ba.bankName,
          // Mã hoá số tài khoản trước khi lưu; chỉ giải mã khi thực sự cần (vd: lúc chi trả)
          accountNumber: encrypt(ba.accountNumber),
          bankBranch: ba.bankBranch || null,
          swiftCode: ba.swiftCode || null,
          taxIdVatNumber: ti?.taxIdVatNumber || null,
          registeredBusinessAddress: ti?.registeredBusinessAddress || null,
          isPrimary: true,
        },
      });

      return tx.hotelVerificationRequest.findUniqueOrThrow({
        where: { id: request.id },
        include: requestInclude,
      });
    });
  };

  getMyRequests = async (userId: string) => {
    return prisma.hotelVerificationRequest.findMany({
      where: { partner: { ownerId: userId } },
      include: requestInclude,
      orderBy: { submittedAt: 'desc' },
    });
  };

  getRequestById = async (requestId: string, currentUser: User) => {
    const request = await prisma.hotelVerificationRequest.findUnique({
      where: { id: requestId },
      include: requestInclude,
    });
    if (!request) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy hồ sơ đăng ký');
    }
    const isOwner = request.partner.ownerId === currentUser.id;
    const canManage = (roleRights.get(currentUser.role) || []).includes('manageHotelVerifications');
    if (!isOwner && !canManage) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    return request;
  };

  /** Liệt kê hồ sơ cho platform_manager, lọc theo trạng thái + phân trang. */
  listRequests = async (filter: VerificationRequestFilter, options: VerificationRequestQueryOptions) => {
    const limit = options.limit || 10;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.HotelVerificationRequestWhereInput = {};
    if (filter.status) {
      where.status = filter.status;
    }

    let orderBy: Prisma.HotelVerificationRequestOrderByWithRelationInput = { submittedAt: 'desc' };
    if (options.sortBy) {
      const [field, direction] = options.sortBy.split(':');
      orderBy = { [field]: direction === 'desc' ? 'desc' : 'asc' };
    }

    const [results, totalResults] = await prisma.$transaction([
      prisma.hotelVerificationRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        // List chỉ cần ảnh cover làm thumbnail, không lấy hết ảnh cho nhẹ
        include: {
          hotel: { include: { images: { where: { imageCategory: 'cover' }, orderBy: { sortOrder: 'asc' } } } },
          partner: true,
        },
      }),
      prisma.hotelVerificationRequest.count({ where }),
    ]);

    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults };
  };

  /**
   * Duyệt / từ chối MỘT giấy tờ (Hướng B). Khi approve, nếu loại giấy tờ này cũng là một license
   * thì cập nhật current_document_id của license đó trỏ tới document vừa duyệt.
   */
  reviewDocument = async (documentId: string, reviewerId: string, body: ReviewDocumentDto) => {
    const document = await prisma.hotelVerificationDocument.findUnique({ where: { id: documentId } });
    if (!document) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy giấy tờ');
    }
    const reviewedAt = new Date();
    const newStatus = body.decision === 'approve' ? 'approved' : 'rejected';

    return prisma.$transaction(async (tx) => {
      const updated = await tx.hotelVerificationDocument.update({
        where: { id: documentId },
        data: { status: newStatus, reviewedBy: reviewerId, reviewedAt },
      });

      // Đánh dấu hồ sơ đang trong quá trình thẩm định
      await tx.hotelVerificationRequest.updateMany({
        where: { id: document.verificationRequestId, status: 'pending' },
        data: { status: 'in_review' },
      });

      if (body.decision === 'approve' && LICENSE_DOCUMENT_TYPES.includes(document.documentType as LicenseType)) {
        const license = await tx.hotelLicense.findFirst({
          where: {
            hotelId: document.hotelId,
            verificationRequestId: document.verificationRequestId,
            licenseType: document.documentType as LicenseType,
          },
        });
        if (license) {
          await tx.hotelLicense.update({ where: { id: license.id }, data: { currentDocumentId: document.id } });
        }
      }
      return updated;
    });
  };

  /**
   * Partner nộp lại file mới cho một giấy tờ bị từ chối: tạo document mới (pending) và trỏ
   * replaced_by của bản cũ sang bản mới.
   */
  replaceDocument = async (documentId: string, currentUser: User, fileUrl: string) => {
    const oldDocument = await prisma.hotelVerificationDocument.findUnique({
      where: { id: documentId },
      include: { partner: true },
    });
    if (!oldDocument) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy giấy tờ');
    }
    if (oldDocument.partner.ownerId !== currentUser.id) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    if (oldDocument.status !== 'rejected') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Chỉ được nộp lại giấy tờ đã bị từ chối');
    }

    return prisma.$transaction(async (tx) => {
      const newDocument = await tx.hotelVerificationDocument.create({
        data: {
          verificationRequestId: oldDocument.verificationRequestId,
          partnerId: oldDocument.partnerId,
          hotelId: oldDocument.hotelId,
          documentType: oldDocument.documentType,
          fileUrl,
          status: 'pending',
        },
      });
      await tx.hotelVerificationDocument.update({
        where: { id: oldDocument.id },
        data: { replacedById: newDocument.id },
      });
      return newDocument;
    });
  };

  /**
   * Quyết định cuối cùng cả hồ sơ. Approve: duyệt nốt các giấy tờ chưa bị từ chối, gắn
   * current_document_id cho license, kích hoạt partner/hotel và nâng role user thành hotel_partner.
   */
  reviewRequest = async (requestId: string, reviewerId: string, body: ReviewRequestDto) => {
    const request = await prisma.hotelVerificationRequest.findUnique({
      where: { id: requestId },
      include: { partner: true },
    });
    if (!request) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy hồ sơ đăng ký');
    }
    if (request.status === 'approved' || request.status === 'rejected') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Hồ sơ này đã được duyệt trước đó');
    }

    const reviewedAt = new Date();

    if (body.decision === 'approve') {
      return prisma.$transaction(async (tx) => {
        // Duyệt nốt các giấy tờ chưa bị từ chối và gắn license -> document hiện hành
        const pendingDocs = await tx.hotelVerificationDocument.findMany({
          where: { verificationRequestId: requestId, status: { not: 'rejected' } },
        });
        for (const doc of pendingDocs) {
          await tx.hotelVerificationDocument.update({
            where: { id: doc.id },
            data: { status: 'approved', reviewedBy: reviewerId, reviewedAt },
          });
          if (LICENSE_DOCUMENT_TYPES.includes(doc.documentType as LicenseType)) {
            const license = await tx.hotelLicense.findFirst({
              where: {
                hotelId: doc.hotelId,
                verificationRequestId: requestId,
                licenseType: doc.documentType as LicenseType,
              },
            });
            if (license) {
              await tx.hotelLicense.update({ where: { id: license.id }, data: { currentDocumentId: doc.id } });
            }
          }
        }

        await tx.hotelVerificationRequest.update({
          where: { id: requestId },
          data: { status: 'approved', reviewedBy: reviewerId, reviewedAt },
        });
        await tx.hotelPartner.update({
          where: { id: request.partnerId },
          data: { status: 'approved', approvedBy: reviewerId, approvedAt: reviewedAt, rejectionReason: null },
        });
        await tx.hotel.update({
          where: { id: request.hotelId },
          data: { isActive: true, isListed: true },
        });
        await tx.user.update({
          where: { id: request.partner.ownerId },
          data: { role: 'hotel_partner' },
        });
        return tx.hotelVerificationRequest.findUniqueOrThrow({ where: { id: requestId }, include: requestInclude });
      });
    }

    // decision === 'reject'
    return prisma.$transaction(async (tx) => {
      await tx.hotelVerificationRequest.update({
        where: { id: requestId },
        data: { status: 'rejected', reviewedBy: reviewerId, reviewedAt, rejectionReason: body.rejectionReason || null },
      });
      await tx.hotelPartner.update({
        where: { id: request.partnerId },
        data: { status: 'rejected', rejectionReason: body.rejectionReason || null },
      });
      return tx.hotelVerificationRequest.findUniqueOrThrow({ where: { id: requestId }, include: requestInclude });
    });
  };
}

export const hotelPartnerService = new HotelPartnerService();
