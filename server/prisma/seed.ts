import { PrismaClient, UserRole } from '@prisma/client';
import type { AmenityCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { toUtcDate, eachNightOfStay } from '../src/utils/dates';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/** Ngày (UTC-midnight) cách hôm nay `days` ngày — dùng cho pricing rule / booking mẫu. */
const daysFromNow = (days: number): Date => {
  const d = toUtcDate(new Date());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

// Sample accounts: one per role + a few extra applicants (role customer) so the hotel
// registration flow can be tested repeatedly (each applicant can submit one registration).
// Password convention: `<role>Password123` (e.g. applicants use `customerPassword123`).
const seedAccounts: { fullName: string; email: string; role: UserRole }[] = [
  { fullName: 'SmartStay Admin', email: 'admin@smartstay.ai', role: 'admin' },
  { fullName: 'Platform Manager', email: 'manager@smartstay.ai', role: 'platform_manager' },
  { fullName: 'Hotel Partner', email: 'partner@smartstay.ai', role: 'hotel_partner' },
  { fullName: 'Hotel Staff', email: 'staff@smartstay.ai', role: 'staff' },
  { fullName: 'Regular Customer', email: 'customer@smartstay.ai', role: 'customer' },
  { fullName: 'Guest User', email: 'guest@smartstay.ai', role: 'guest' },
  // Extra applicants for repeatable hotel-registration testing
  { fullName: 'Hotel Applicant 1', email: 'applicant1@smartstay.ai', role: 'customer' },
  { fullName: 'Hotel Applicant 2', email: 'applicant2@smartstay.ai', role: 'customer' },
];

// ---------------------------------------------------------------------------
// Dữ liệu mẫu: 3 khách sạn (2 Đà Nẵng + 1 Hà Nội) cho luồng search / booking
// ---------------------------------------------------------------------------
interface SeedRoomType {
  name: string;
  description: string;
  maxOccupancy: number;
  basePrice: number;
  areaSqm: number;
  bedType: string;
  viewType: string;
  floor: number;
  roomCount: number;
  amenities: string[]; // tên amenity loại "room"
  imageUrl: string;
}

interface SeedHotel {
  name: string;
  description: string;
  address: string;
  city: string;
  district: string;
  starRating: number;
  amenities: string[]; // tên amenity loại "hotel"
  coverImageUrl: string;
  roomTypes: SeedRoomType[];
}

const AMENITIES: { name: string; icon: string; category: AmenityCategory }[] = [
  { name: 'WiFi miễn phí', icon: 'wifi', category: 'hotel' },
  { name: 'Hồ bơi', icon: 'pool', category: 'hotel' },
  { name: 'Bãi đậu xe', icon: 'parking', category: 'hotel' },
  { name: 'Nhà hàng', icon: 'restaurant', category: 'hotel' },
  { name: 'Điều hoà', icon: 'air-conditioner', category: 'room' },
  { name: 'TV màn hình phẳng', icon: 'tv', category: 'room' },
  { name: 'Minibar', icon: 'minibar', category: 'room' },
  { name: 'Ban công', icon: 'balcony', category: 'room' },
];

// FAQ chung áp dụng cho mọi khách sạn. Nhiều câu → vector RAG mới có việc "chọn lọc" câu liên quan.
const GENERIC_FAQS: { category: string; question: string; answer: string }[] = [
  { category: 'Chính sách', question: 'Khách sạn có cho mang theo thú cưng không?', answer: 'Rất tiếc, khách sạn không nhận thú cưng, trừ chó dẫn đường hỗ trợ người khuyết tật.' },
  { category: 'Chính sách', question: 'Chính sách hủy phòng như thế nào?', answer: 'Hủy miễn phí nếu báo trước 48 giờ so với giờ nhận phòng; trong vòng 48 giờ sẽ bị thu phí 1 đêm đầu.' },
  { category: 'Chính sách', question: 'Khách sạn có cho hút thuốc trong phòng không?', answer: 'Tất cả phòng đều cấm hút thuốc. Có khu vực hút thuốc riêng ngoài trời.' },
  { category: 'Chính sách', question: 'Trẻ em ở cùng có tính phí không?', answer: 'Trẻ dưới 6 tuổi ngủ ghép giường với bố mẹ được miễn phí; từ 6 tuổi tính như người lớn hoặc phụ thu giường phụ.' },
  { category: 'Chính sách', question: 'Có thể yêu cầu giường phụ không?', answer: 'Có, giường phụ phụ thu 250.000đ/đêm; vui lòng báo trước vì số lượng có hạn.' },
  { category: 'Chính sách', question: 'Nhận phòng cần giấy tờ gì?', answer: 'Khách vui lòng xuất trình CCCD/CMND hoặc hộ chiếu còn hiệu lực khi nhận phòng.' },
  { category: 'Chính sách', question: 'Giờ nhận và trả phòng là mấy giờ?', answer: 'Nhận phòng từ 14:00, trả phòng trước 12:00.' },
  { category: 'Chính sách', question: 'Nhận phòng sớm hoặc trả phòng muộn được không?', answer: 'Tuỳ tình trạng phòng. Trả phòng muộn sau 12:00 có thể phụ thu; vui lòng hỏi lễ tân.' },
  { category: 'Chính sách', question: 'Khách có thể dẫn người tới thăm phòng không?', answer: 'Khách tới thăm cần đăng ký với lễ tân và xuất trình giấy tờ; không lưu trú qua đêm nếu chưa đăng ký.' },
  { category: 'Chính sách', question: 'Khách sạn có yêu cầu đặt cọc không?', answer: 'Đặt phòng online đã thanh toán thì không cần cọc thêm; khi nhận phòng có thể cần cọc nhỏ cho minibar/hư hỏng, hoàn lại lúc trả phòng.' },
  { category: 'Tiện ích', question: 'Khách sạn có WiFi miễn phí không?', answer: 'Có WiFi miễn phí tốc độ cao ở toàn bộ khu vực và trong phòng.' },
  { category: 'Tiện ích', question: 'Hồ bơi mở cửa mấy giờ?', answer: 'Hồ bơi mở từ 6:00 đến 21:00 hằng ngày (nếu khách sạn có hồ bơi).' },
  { category: 'Tiện ích', question: 'Khách sạn có phòng tập gym không?', answer: 'Một số cơ sở có phòng gym mở 24/7 cho khách lưu trú; vui lòng hỏi lễ tân.' },
  { category: 'Tiện ích', question: 'Có chỗ đậu xe không?', answer: 'Có bãi đậu xe cho khách lưu trú (nếu khách sạn có dịch vụ này), ưu tiên theo chỗ trống.' },
  { category: 'Tiện ích', question: 'Bữa sáng phục vụ mấy giờ?', answer: 'Bữa sáng buffet phục vụ từ 6:30 đến 9:30 và đã bao gồm trong hầu hết các hạng phòng.' },
  { category: 'Tiện ích', question: 'Khách sạn có phục vụ ăn tại phòng (room service) không?', answer: 'Có room service trong khung giờ nhà hàng hoạt động; xem menu trong phòng hoặc gọi lễ tân.' },
  { category: 'Tiện ích', question: 'Có dịch vụ giặt là không?', answer: 'Có dịch vụ giặt là tính phí; nhận đồ trước 9:00 thường trả trong ngày.' },
  { category: 'Tiện ích', question: 'Khách sạn có đưa đón sân bay không?', answer: 'Có dịch vụ đưa đón sân bay tính phí; vui lòng đặt trước với lễ tân ít nhất 12 giờ.' },
  { category: 'Tiện ích', question: 'Có thể gửi hành lý trước hoặc sau giờ nhận phòng không?', answer: 'Có, lễ tân nhận giữ hành lý miễn phí trước khi nhận phòng và sau khi trả phòng.' },
  { category: 'Tiện ích', question: 'Lễ tân có làm việc 24/7 không?', answer: 'Có, lễ tân trực 24/7 và hỗ trợ báo thức, đặt taxi, tư vấn du lịch.' },
  { category: 'Thanh toán', question: 'Khách sạn nhận thanh toán bằng hình thức nào?', answer: 'Nhận thanh toán online qua VNPay và tiền mặt tại quầy lễ tân.' },
  { category: 'Thanh toán', question: 'Khách sạn có xuất hóa đơn VAT không?', answer: 'Có, vui lòng cung cấp thông tin xuất hóa đơn khi nhận/trả phòng.' },
  { category: 'Thanh toán', question: 'Tôi hủy phòng đã trả tiền thì được hoàn lại không?', answer: 'Có. Hoàn 100% nếu hủy trước 48 giờ; trong 48 giờ giữ lại 1 đêm đầu. Tiền hoàn về phương thức đã thanh toán.' },
  { category: 'Phòng', question: 'Phòng có điều hoà và nước nóng không?', answer: 'Tất cả phòng đều có điều hoà và nước nóng/lạnh.' },
  { category: 'Phòng', question: 'Trong phòng có minibar không?', answer: 'Các hạng phòng cao cấp có minibar; đồ dùng tính phí theo bảng giá trong phòng.' },
  { category: 'Khác', question: 'Khách sạn có hỗ trợ đặt tour, thuê xe không?', answer: 'Lễ tân hỗ trợ đặt tour, thuê xe máy/ô tô và tư vấn điểm tham quan gần khách sạn.' },
];

const HOTELS: SeedHotel[] = [
  {
    name: 'SmartStay Đà Nẵng Beach Hotel',
    description: 'Khách sạn 4 sao cạnh biển Mỹ Khê, cách sân bay 15 phút.',
    address: '123 Võ Nguyên Giáp, Phước Mỹ',
    city: 'Đà Nẵng',
    district: 'Sơn Trà',
    starRating: 4,
    amenities: ['WiFi miễn phí', 'Hồ bơi', 'Bãi đậu xe', 'Nhà hàng'],
    coverImageUrl: 'https://picsum.photos/seed/danang-beach/1200/800',
    roomTypes: [
      {
        name: 'Phòng Standard Giường Đôi',
        description: 'Phòng tiêu chuẩn 22m² với giường đôi, hướng thành phố.',
        maxOccupancy: 2,
        basePrice: 800_000,
        areaSqm: 22,
        bedType: 'double',
        viewType: 'city',
        floor: 1,
        roomCount: 5,
        amenities: ['Điều hoà', 'TV màn hình phẳng'],
        imageUrl: 'https://picsum.photos/seed/standard-double/1200/800',
      },
      {
        name: 'Phòng Deluxe Hướng Biển',
        description: 'Phòng 32m² giường king, ban công nhìn thẳng ra biển Mỹ Khê.',
        maxOccupancy: 3,
        basePrice: 1_500_000,
        areaSqm: 32,
        bedType: 'king',
        viewType: 'ocean',
        floor: 2,
        roomCount: 4,
        amenities: ['Điều hoà', 'TV màn hình phẳng', 'Minibar', 'Ban công'],
        imageUrl: 'https://picsum.photos/seed/deluxe-ocean/1200/800',
      },
      {
        name: 'Suite Gia Đình',
        description: 'Suite 55m² với 2 giường queen, phù hợp gia đình 4-5 người.',
        maxOccupancy: 5,
        basePrice: 2_800_000,
        areaSqm: 55,
        bedType: 'two queens',
        viewType: 'ocean',
        floor: 3,
        roomCount: 2,
        amenities: ['Điều hoà', 'TV màn hình phẳng', 'Minibar', 'Ban công'],
        imageUrl: 'https://picsum.photos/seed/family-suite/1200/800',
      },
    ],
  },
  {
    name: 'SmartStay Mỹ Khê Boutique',
    description: 'Khách sạn boutique nhỏ gọn, giá tốt, gần chợ đêm Sơn Trà.',
    address: '45 Hồ Nghinh, Phước Mỹ',
    city: 'Đà Nẵng',
    district: 'Sơn Trà',
    starRating: 3,
    amenities: ['WiFi miễn phí', 'Bãi đậu xe'],
    coverImageUrl: 'https://picsum.photos/seed/mykhe-boutique/1200/800',
    roomTypes: [
      {
        name: 'Phòng Tiêu Chuẩn',
        description: 'Phòng 18m² giường đôi, đầy đủ tiện nghi cơ bản.',
        maxOccupancy: 2,
        basePrice: 550_000,
        areaSqm: 18,
        bedType: 'double',
        viewType: 'city',
        floor: 2,
        roomCount: 6,
        amenities: ['Điều hoà', 'TV màn hình phẳng'],
        imageUrl: 'https://picsum.photos/seed/boutique-standard/1200/800',
      },
      {
        name: 'Phòng Superior',
        description: 'Phòng 25m² giường queen, tầng cao thoáng mát.',
        maxOccupancy: 3,
        basePrice: 850_000,
        areaSqm: 25,
        bedType: 'queen',
        viewType: 'ocean',
        floor: 5,
        roomCount: 3,
        amenities: ['Điều hoà', 'TV màn hình phẳng', 'Minibar'],
        imageUrl: 'https://picsum.photos/seed/boutique-superior/1200/800',
      },
    ],
  },
  {
    name: 'SmartStay Hà Nội Old Quarter',
    description: 'Khách sạn 4 sao giữa lòng phố cổ, đi bộ 5 phút tới hồ Hoàn Kiếm.',
    address: '8 Hàng Bè, Hàng Bạc',
    city: 'Hà Nội',
    district: 'Hoàn Kiếm',
    starRating: 4,
    amenities: ['WiFi miễn phí', 'Nhà hàng'],
    coverImageUrl: 'https://picsum.photos/seed/hanoi-oldquarter/1200/800',
    roomTypes: [
      {
        name: 'Phòng Cổ Điển',
        description: 'Phòng 20m² phong cách Đông Dương, cửa sổ nhìn ra phố cổ.',
        maxOccupancy: 2,
        basePrice: 950_000,
        areaSqm: 20,
        bedType: 'double',
        viewType: 'city',
        floor: 3,
        roomCount: 4,
        amenities: ['Điều hoà', 'TV màn hình phẳng', 'Minibar'],
        imageUrl: 'https://picsum.photos/seed/hanoi-classic/1200/800',
      },
      {
        name: 'Phòng Hạng Sang Hồ Gươm',
        description: 'Phòng 40m² giường king, ban công hướng hồ Hoàn Kiếm.',
        maxOccupancy: 4,
        basePrice: 1_800_000,
        areaSqm: 40,
        bedType: 'king',
        viewType: 'lake',
        floor: 6,
        roomCount: 2,
        amenities: ['Điều hoà', 'TV màn hình phẳng', 'Minibar', 'Ban công'],
        imageUrl: 'https://picsum.photos/seed/hanoi-premium/1200/800',
      },
    ],
  },
];

async function main() {
  console.log('Seeding database...');

  // Reset all data (dev only): truncate every table except the migration history.
  // CASCADE handles foreign-key dependencies regardless of onDelete: Restrict.
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  const tableNames = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  if (tableNames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
  }

  // ----- Tài khoản mẫu mỗi role (giữ lại admin / partner / customer để gắn dữ liệu khách sạn) -----
  const usersByEmail = new Map<string, { id: string }>();
  for (const account of seedAccounts) {
    const password = `${account.role}Password123`;
    const passwordHash = await bcrypt.hash(password, 8);

    const user = await prisma.user.create({
      data: {
        fullName: account.fullName,
        email: account.email,
        passwordHash,
        role: account.role,
        status: 'active',
        emailVerifiedAt: new Date(),
        profile: { create: { nationality: 'Vietnamese', marketingOptIn: false } },
      },
    });
    usersByEmail.set(account.email, user);
    console.log(`  ✓ ${account.role.padEnd(18)} ${account.email}  (password: ${password})`);
  }

  const admin = usersByEmail.get('admin@smartstay.ai')!;
  const partnerOwner = usersByEmail.get('partner@smartstay.ai')!;
  const customer = usersByEmail.get('customer@smartstay.ai')!;

  // ----- Amenities (dùng chung cho mọi khách sạn / loại phòng) -----
  const amenityIdByName = new Map<string, string>();
  for (const item of AMENITIES) {
    const amenity = await prisma.amenity.create({ data: item });
    amenityIdByName.set(amenity.name, amenity.id);
  }

  // ----- Partner đã được duyệt, sở hữu cả 3 khách sạn -----
  const partner = await prisma.hotelPartner.create({
    data: {
      ownerId: partnerOwner.id,
      businessName: 'SmartStay Hospitality Group',
      contactEmail: 'partner@smartstay.ai',
      contactPhone: '0905123456',
      status: 'approved',
      commissionRate: 15,
      approvedBy: admin.id,
      approvedAt: new Date(),
    },
  });

  // ----- Khách sạn + loại phòng + phòng vật lý -----
  // Lưu loại phòng đầu tiên (để tạo booking mẫu) và 1 loại phòng hướng biển (để gắn pricing rule)
  let sampleRoomType: { id: string; hotelId: string; basePrice: number; roomCount: number } | null = null;
  let weekendRoomType: { id: string; hotelId: string; basePrice: number; roomCount: number } | null = null;

  for (const seedHotel of HOTELS) {
    const hotel = await prisma.hotel.create({
      data: {
        partnerId: partner.id,
        name: seedHotel.name,
        description: seedHotel.description,
        address: seedHotel.address,
        city: seedHotel.city,
        district: seedHotel.district,
        country: 'Vietnam',
        businessType: 'hotel',
        starRating: seedHotel.starRating,
        checkInTime: '14:00',
        checkOutTime: '12:00',
        isActive: true,
        isListed: true,
        images: {
          create: [
            { imageCategory: 'cover', url: seedHotel.coverImageUrl, isPrimary: true, sortOrder: 0 },
            { imageCategory: 'exterior', url: `${seedHotel.coverImageUrl}?exterior`, sortOrder: 1 },
          ],
        },
        amenities: {
          create: seedHotel.amenities.map((name) => ({
            amenityId: amenityIdByName.get(name) as string,
          })),
        },
      },
    });

    // FAQ = bộ chung + vài câu dựng từ DỮ LIỆU THẬT của chính khách sạn này
    const minPrice = Math.min(...seedHotel.roomTypes.map((r) => r.basePrice));
    await prisma.faqKnowledgeBase.createMany({
      data: [
        ...GENERIC_FAQS.map((f) => ({ hotelId: hotel.id, ...f })),
        {
          hotelId: hotel.id,
          category: 'Tiện ích',
          question: 'Khách sạn có những tiện nghi gì?',
          answer: `Khách sạn có: ${seedHotel.amenities.join(', ')}.`,
        },
        {
          hotelId: hotel.id,
          category: 'Phòng',
          question: 'Khách sạn có những loại phòng nào?',
          answer: `Các loại phòng: ${seedHotel.roomTypes.map((r) => r.name).join(', ')}.`,
        },
        {
          hotelId: hotel.id,
          category: 'Phòng',
          question: 'Phòng rẻ nhất giá bao nhiêu?',
          answer: `Giá phòng thấp nhất từ ${minPrice.toLocaleString('vi-VN')}đ/đêm.`,
        },
        {
          hotelId: hotel.id,
          category: 'Vị trí',
          question: 'Khách sạn nằm ở đâu?',
          answer: `${seedHotel.address}, ${seedHotel.district}, ${seedHotel.city}.`,
        },
        {
          hotelId: hotel.id,
          category: 'Thông tin',
          question: 'Khách sạn được xếp hạng mấy sao?',
          answer: `Khách sạn đạt chuẩn ${seedHotel.starRating} sao.`,
        },
      ],
    });

    for (const seedRoomType of seedHotel.roomTypes) {
      const roomType = await prisma.roomType.create({
        data: {
          hotelId: hotel.id,
          name: seedRoomType.name,
          description: seedRoomType.description,
          maxOccupancy: seedRoomType.maxOccupancy,
          basePrice: seedRoomType.basePrice,
          areaSqm: seedRoomType.areaSqm,
          bedType: seedRoomType.bedType,
          viewType: seedRoomType.viewType,
          isActive: true,
          images: {
            create: [{ url: seedRoomType.imageUrl, isPrimary: true, sortOrder: 0 }],
          },
          amenities: {
            create: seedRoomType.amenities.map((name) => ({
              amenityId: amenityIdByName.get(name) as string,
            })),
          },
          rooms: {
            // Số phòng vật lý: 101, 102, ... theo tầng — đây là tồn kho gốc của loại phòng
            create: Array.from({ length: seedRoomType.roomCount }, (_, i) => ({
              hotelId: hotel.id,
              roomNumber: `${seedRoomType.floor}0${i + 1}`,
              floor: seedRoomType.floor,
              status: 'available' as const,
            })),
          },
        },
      });

      if (!sampleRoomType) {
        sampleRoomType = {
          id: roomType.id,
          hotelId: hotel.id,
          basePrice: seedRoomType.basePrice,
          roomCount: seedRoomType.roomCount,
        };
      }
      if (!weekendRoomType && seedRoomType.viewType === 'ocean') {
        weekendRoomType = {
          id: roomType.id,
          hotelId: hotel.id,
          basePrice: seedRoomType.basePrice,
          roomCount: seedRoomType.roomCount,
        };
      }
    }
  }

  // ----- Pricing rule cuối tuần: +20% cho phòng Deluxe Hướng Biển (đêm T6 & T7, 60 ngày tới) -----
  // (demo luồng pricing rule: search/booking tự cộng giá, không cần ghi sẵn từng đêm)
  if (weekendRoomType) {
    await prisma.pricingRule.create({
      data: {
        hotelId: weekendRoomType.hotelId,
        roomTypeId: weekendRoomType.id,
        name: 'Phụ thu cuối tuần Deluxe Hướng Biển',
        ruleType: 'weekend',
        startDate: daysFromNow(0),
        endDate: daysFromNow(60),
        dayOfWeek: [5, 6], // đêm thứ 6 và thứ 7
        adjustmentType: 'percentage',
        adjustmentValue: 20,
        priority: 10,
        isActive: true,
      },
    });

    // priceOverride 1 đêm "lễ" (10 ngày nữa): giá cố định 2.500.000 — demo cơ chế override theo đêm.
    // Đêm này nếu trùng T6/T7 thì rule cuối tuần cộng tiếp trên giá override.
    await prisma.roomAvailability.create({
      data: {
        roomTypeId: weekendRoomType.id,
        hotelId: weekendRoomType.hotelId,
        date: daysFromNow(10),
        totalRooms: weekendRoomType.roomCount,
        bookedRooms: 0,
        priceOverride: 2_500_000,
      },
    });
  }

  // ----- Booking mẫu: customer đặt loại phòng đầu tiên, 2 đêm, 7 ngày nữa nhận phòng -----
  if (sampleRoomType) {
    const checkIn = daysFromNow(7);
    const checkOut = daysFromNow(9);
    const nights = eachNightOfStay(checkIn, checkOut);

    // Giữ tồn kho cho booking mẫu, giống hệt cách createBooking làm (upsert + tăng bookedRooms)
    for (const night of nights) {
      await prisma.roomAvailability.upsert({
        where: { roomTypeId_date: { roomTypeId: sampleRoomType.id, date: night } },
        create: {
          roomTypeId: sampleRoomType.id,
          hotelId: sampleRoomType.hotelId,
          date: night,
          totalRooms: sampleRoomType.roomCount,
          bookedRooms: 1,
        },
        update: { bookedRooms: { increment: 1 } },
      });
    }

    const subtotal = sampleRoomType.basePrice * nights.length;
    await prisma.booking.create({
      data: {
        bookingCode: 'BKSEED001',
        customerId: customer.id,
        hotelId: sampleRoomType.hotelId,
        roomTypeId: sampleRoomType.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numNights: nights.length,
        numGuests: 2,
        basePricePerNight: sampleRoomType.basePrice,
        subtotal,
        discountAmount: 0,
        totalAmount: subtotal,
        status: 'confirmed',
        source: 'website',
        specialRequests: 'Phòng tầng cao, xa thang máy',
      },
    });
  }

  // ===== Bổ sung data để test ĐẦY ĐỦ các feature (voucher, check-in, review, detail Pha 1, payout) =====
  if (sampleRoomType) {
    const firstHotelId = sampleRoomType.hotelId;
    const twoNights = sampleRoomType.basePrice * 2;

    // (1) Voucher cho booking mẫu BKSEED001 — để test QR lookup theo voucher_code
    const booking1 = await prisma.booking.findUnique({ where: { bookingCode: 'BKSEED001' } });
    if (booking1) {
      await prisma.bookingVoucher.create({
        data: { bookingId: booking1.id, voucherCode: 'VCSEED001', qrData: 'SMARTSTAY|VCSEED001|BKSEED001', expiresAt: booking1.checkOutDate },
      });
    }

    // (2) Booking sẵn sàng CHECK-IN HÔM NAY (+ voucher) — test chuỗi check-in → check-out → housekeeping → QR
    const checkInToday = daysFromNow(0);
    const checkOut2 = daysFromNow(2);
    for (const night of eachNightOfStay(checkInToday, checkOut2)) {
      await prisma.roomAvailability.upsert({
        where: { roomTypeId_date: { roomTypeId: sampleRoomType.id, date: night } },
        create: { roomTypeId: sampleRoomType.id, hotelId: firstHotelId, date: night, totalRooms: sampleRoomType.roomCount, bookedRooms: 1 },
        update: { bookedRooms: { increment: 1 } },
      });
    }
    const booking2 = await prisma.booking.create({
      data: {
        bookingCode: 'BKSEED002', customerId: customer.id, hotelId: firstHotelId, roomTypeId: sampleRoomType.id,
        checkInDate: checkInToday, checkOutDate: checkOut2, numNights: 2, numGuests: 2,
        basePricePerNight: sampleRoomType.basePrice, subtotal: twoNights, discountAmount: 0, totalAmount: twoNights,
        status: 'confirmed', source: 'website',
      },
    });
    await prisma.bookingVoucher.create({
      data: { bookingId: booking2.id, voucherCode: 'VCSEED002', qrData: 'SMARTSTAY|VCSEED002|BKSEED002', expiresAt: checkOut2 },
    });

    // (3) Booking ĐÃ TRẢ PHÒNG, CHƯA review — test POST /reviews. Gán 1 phòng vào lịch sử → cũng test "không xoá được phòng đã dùng"
    const someRoom = await prisma.room.findFirst({ where: { roomTypeId: sampleRoomType.id } });
    const booking3 = await prisma.booking.create({
      data: {
        bookingCode: 'BKSEED003', customerId: customer.id, hotelId: firstHotelId, roomTypeId: sampleRoomType.id,
        checkInDate: daysFromNow(-3), checkOutDate: daysFromNow(-1), numNights: 2, numGuests: 2,
        basePricePerNight: sampleRoomType.basePrice, subtotal: twoNights, discountAmount: 0, totalAmount: twoNights,
        status: 'checked_out', source: 'website', checkedInAt: daysFromNow(-3), checkedOutAt: daysFromNow(-1),
      },
    });
    if (someRoom) {
      await prisma.bookingRoom.create({ data: { bookingId: booking3.id, roomId: someRoom.id, assignedAt: daysFromNow(-3) } });
    }

    // (4) Booking ĐÃ TRẢ PHÒNG + đã có Review (published) — test GET /reviews?hotelId có sẵn dữ liệu
    const booking4 = await prisma.booking.create({
      data: {
        bookingCode: 'BKSEED004', customerId: customer.id, hotelId: firstHotelId, roomTypeId: sampleRoomType.id,
        checkInDate: daysFromNow(-10), checkOutDate: daysFromNow(-8), numNights: 2, numGuests: 2,
        basePricePerNight: sampleRoomType.basePrice, subtotal: twoNights, discountAmount: 0, totalAmount: twoNights,
        status: 'checked_out', source: 'website', checkedInAt: daysFromNow(-10), checkedOutAt: daysFromNow(-8),
      },
    });
    await prisma.review.create({
      data: {
        bookingId: booking4.id, customerId: customer.id, hotelId: firstHotelId,
        overallRating: 5, cleanlinessRating: 5, serviceRating: 4, locationRating: 5, valueRating: 4,
        title: 'Kỳ nghỉ tuyệt vời', content: 'Phòng sạch, nhân viên thân thiện, vị trí gần biển.', status: 'published',
        images: { create: [{ url: 'https://picsum.photos/seed/review-seed/800/600' }] },
      },
    });

    // (5) Chi tiết Pha 1 (booking.com detail) cho khách sạn đầu tiên + cấu hình giường loại phòng đầu tiên
    await prisma.hotel.update({
      where: { id: firstHotelId },
      data: {
        phone: '0236 3888 999', email: 'danang-beach@smartstay.ai', postalCode: '550000',
        totalFloors: 12, builtYear: 2018, isSmokingAllowed: false, petsPolicy: 'on_request',
        minGuestAge: 0, languagesSpoken: ['vi', 'en', 'ko'], maxLengthOfStay: 30,
        contacts: {
          create: [
            { contactType: 'general', name: 'Lễ tân', phone: '0236 3888 999', phoneType: 'voice' },
            { contactType: 'invoices', email: 'invoice-danang@smartstay.ai' },
          ],
        },
        // Điều khoản = văn bản cho khách đọc, KHÔNG ảnh hưởng tiền
        policies: {
          create: [
            { title: 'Chính sách huỷ phòng', description: 'Huỷ miễn phí trước 48 giờ so với giờ nhận phòng.', important: true },
            { title: 'Đặt cọc', description: 'Đặt cọc minibar 200.000đ khi nhận phòng, hoàn lại lúc trả phòng.' },
            { title: 'Giờ nhận / trả phòng', description: 'Nhận phòng từ 14:00, trả phòng trước 12:00.' },
          ],
        },
        // Khoản thu = con số engine tính giá đọc rồi cộng vào tổng đơn (availability.computeTaxAndFees):
        // một khoản theo phần trăm, một khoản cố định theo đêm — để test cả hai nhánh tính.
        charges: {
          create: [
            { chargeType: 'tax', name: 'VAT', amount: 8, isPercentage: true },
            { chargeType: 'fee', name: 'Phí dịch vụ', amount: 50_000, isPercentage: false, chargeFrequency: 'per_night' },
          ],
        },
        nearbyPlaces: {
          create: [
            { name: 'Biển Mỹ Khê', category: 'beach', distance: 0.2, distanceUnit: 'km', transportType: 'walk', journeyMinutes: 3 },
            { name: 'Sân bay quốc tế Đà Nẵng', category: 'airport', distance: 6, distanceUnit: 'km', transportType: 'car', journeyMinutes: 15 },
          ],
        },
      },
    });
    await prisma.roomBed.create({ data: { roomTypeId: sampleRoomType.id, bedType: 'double', quantity: 1 } });

    // (6) Payout mẫu — PHẢI tạo HotelPayoutAccount trước (FK). Số TK để PLAIN cho seed (app sẽ mã hoá khi tạo qua API).
    const payoutAccount = await prisma.hotelPayoutAccount.create({
      data: {
        hotelId: firstHotelId, partnerId: partner.id,
        accountHolder: 'SmartStay Hospitality Group', bankName: 'Vietcombank',
        accountNumber: 'SEED-0011001234567', bankBranch: 'CN Đà Nẵng', isPrimary: true,
      },
    });
    await prisma.payout.create({
      data: {
        hotelId: firstHotelId, partnerId: partner.id, payoutAccountId: payoutAccount.id,
        amount: 5_000_000, currency: 'VND', status: 'paid',
        periodStart: daysFromNow(-30), periodEnd: daysFromNow(-1),
        payoutTransactionId: 'PAYOUTSEED001', processedAt: daysFromNow(-1),
      },
    });
  }

  console.log('Seed completed successfully!');
  console.log('Data: 3 hotels (2 Đà Nẵng, 1 Hà Nội), 7 room types, 26 rooms,');
  console.log('      weekend pricing rule +20% for "Phòng Deluxe Hướng Biển" (Fri/Sat nights),');
  console.log('      1 holiday priceOverride (2.5M, in 10 days) for the same room type.');
  console.log('Bookings: BKSEED001 (confirmed, +7d, +voucher VCSEED001),');
  console.log('          BKSEED002 (confirmed, check-in TODAY, +voucher VCSEED002 → test check-in/out/QR),');
  console.log('          BKSEED003 (checked_out, chưa review → test POST /reviews),');
  console.log('          BKSEED004 (checked_out, đã có 1 review published → test GET /reviews).');
  console.log('Detail: hotel #1 có contacts/policies/nearby_places + cột mới + room_beds; 1 payout mẫu (PAYOUTSEED001).');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
