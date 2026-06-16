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
  { fullName: 'Marketing Staff', email: 'marketer@smartstay.ai', role: 'marketer' },
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

  console.log('Seed completed successfully!');
  console.log('Data: 3 hotels (2 Đà Nẵng, 1 Hà Nội), 7 room types, 26 rooms,');
  console.log('      weekend pricing rule +20% for "Phòng Deluxe Hướng Biển" (Fri/Sat nights),');
  console.log('      1 holiday priceOverride (2.5M, in 10 days) for the same room type,');
  console.log('      1 sample booking BKSEED001 (confirmed, check-in in 7 days).');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
